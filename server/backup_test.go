package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"
)

func backupGraderFixture(t *testing.T) *Grading {
	t.Helper()
	reply := `{"verdict":"correct","feedback":"Accepted","issue":"","improvement":"","transcription":"p implies q"}`
	g := graderFixture(t, &reply)
	media := filepath.Join(t.TempDir(), "live media")
	if err := os.Mkdir(media, 0700); err != nil {
		t.Fatal(err)
	}
	g.server.media = DiskMedia{media}
	return g
}

func backupImage(t *testing.T, g *Grading, shade uint8) (string, []byte) {
	t.Helper()
	im := image.NewRGBA(image.Rect(0, 0, 2, 2))
	im.Set(0, 0, color.RGBA{R: shade, A: 255})
	var b bytes.Buffer
	if err := png.Encode(&b, im); err != nil {
		t.Fatal(err)
	}
	hash := sha256.Sum256(b.Bytes())
	id := hex.EncodeToString(hash[:])
	if err := g.server.media.Put(id, bytes.NewReader(b.Bytes())); err != nil {
		t.Fatal(err)
	}
	return id, b.Bytes()
}

func backupSubmit(t *testing.T, g *Grading, a Submission) {
	t.Helper()
	g.catalog.Exercises[a.Exercise] = g.catalog.Exercises["logic-1"]
	if _, _, err := g.submit(a); err != nil {
		t.Fatal(err)
	}
}

func backupAssertMedia(t *testing.T, root string, originals map[string][]byte) {
	t.Helper()
	for hash, original := range originals {
		data, err := os.ReadFile(filepath.Join(root, hash))
		if err != nil {
			t.Fatalf("referenced response media %s is unavailable: %v", hash, err)
		}
		actual := sha256.Sum256(data)
		if hex.EncodeToString(actual[:]) != hash || !bytes.Equal(data, original) {
			t.Fatalf("response media %s changed during backup/restore", hash)
		}
	}
}

func backupMediaNames(t *testing.T, point string) []string {
	t.Helper()
	entries, err := os.ReadDir(filepath.Join(point, "media"))
	if err != nil {
		t.Fatal(err)
	}
	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			t.Fatalf("unexpected media subdirectory %s", entry.Name())
		}
		names = append(names, entry.Name())
	}
	return names
}

func TestBackupRestoresRetiredResponseMedia(t *testing.T) {
	g := backupGraderFixture(t)
	rendered, renderedBytes := backupImage(t, g, 1)
	original, originalBytes := backupImage(t, g, 2)
	shared, sharedBytes := backupImage(t, g, 3)
	written, writtenBytes := backupImage(t, g, 4)
	backupImage(t, g, 5) // An unreferenced upload is not part of this recovery point.
	originals := map[string][]byte{rendered: renderedBytes, original: originalBytes, shared: sharedBytes, written: writtenBytes}
	photo := submission()
	photo.Mode, photo.Text = "photo", ""
	photo.Images = []string{rendered, rendered, shared}
	photo.Photos = []SubmittedPhoto{{Hash: original, Rotation: 90}, {Hash: original, Rotation: 270}, {Hash: shared}}
	second := submission()
	second.Exercise, second.Mode, second.Text = "logic-2", "photo", ""
	second.Images = []string{shared}
	second.Photos = []SubmittedPhoto{{Hash: shared, Rotation: 180}}
	handwriting := submission()
	handwriting.Exercise, handwriting.Mode, handwriting.Text = "logic-3", "write", ""
	handwriting.Images = []string{written, shared}
	handwriting.Ink = json.RawMessage(`{"version":1,"height":520,"strokes":[{"color":0,"size":2,"inputs":"synthetic-ink"}]}`)
	attempts := []Submission{photo, second, handwriting}
	for _, a := range attempts {
		backupSubmit(t, g, a)
	}
	backupAssertMedia(t, g.server.media.(DiskMedia).Root, originals)
	point := filepath.Join(t.TempDir(), "notebook-before-transcription")
	if err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point); err != nil {
		t.Fatal(err)
	}
	wantNames := []string{rendered, original, shared, written}
	sort.Strings(wantNames)
	if names := backupMediaNames(t, point); !reflect.DeepEqual(names, wantNames) {
		t.Fatalf("backup must copy each referenced hash once: got %v, want %v", names, wantNames)
	}
	for range attempts {
		if !g.step(context.Background()) {
			t.Fatal("expected pending grading work")
		}
		g.removeRetiredMedia()
	}
	for _, a := range attempts {
		saved, err := loadAttempt(g.server.db, a.ID)
		if err != nil || saved.Transcription != "p implies q" || len(saved.Images) != 0 || len(saved.Photos) != 0 || len(saved.Ink) != 0 {
			t.Fatalf("live transcription retirement changed: %+v, %v", saved, err)
		}
	}
	for hash := range originals {
		if _, err := os.Stat(filepath.Join(g.server.media.(DiskMedia).Root, hash)); !os.IsNotExist(err) {
			t.Fatalf("live media %s was not normally retired: %v", hash, err)
		}
	}
	restoredRoot := filepath.Join(t.TempDir(), "clean restore")
	if err := restoreBackup(point, restoredRoot); err != nil {
		t.Fatal(err)
	}
	db, err := openDB(filepath.Join(restoredRoot, "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	for _, a := range attempts {
		restored, err := loadAttempt(db, a.ID)
		if err != nil || restored.Transcription != "" || restored.Status != "pending" || !reflect.DeepEqual(restored.Submission, a) {
			t.Fatalf("pre-transcription response and metadata did not restore: got %+v, want %+v, error %v", restored, a, err)
		}
	}
	backupAssertMedia(t, filepath.Join(restoredRoot, "media"), originals)
	backupAssertMedia(t, filepath.Join(point, "media"), originals)
}

func TestBackupPreservesMediaInRetainedDraftVersions(t *testing.T) {
	g := backupGraderFixture(t)
	first, firstBytes := backupImage(t, g, 10)
	second, secondBytes := backupImage(t, g, 11)
	unreferenced, _ := backupImage(t, g, 12)
	photoEdit := func(id, hash string) Mutation {
		payload, err := json.Marshal(map[string]any{"photos": []map[string]any{{"id": id, "hash": hash, "rotation": 90}}})
		if err != nil {
			t.Fatal(err)
		}
		return Mutation{ID: "operation-" + id, Key: "photos/conflicting-draft", Payload: payload, Device: "synthetic"}
	}
	must(t, g.server, photoEdit("photo-1", first))
	want := must(t, g.server, photoEdit("photo-2", second))
	if len(want.Versions) != 2 || len(want.Conflicts) != 1 {
		t.Fatalf("fixture did not retain both draft variants: %+v", want)
	}
	// A hash merely mentioned in text is not a media reference.
	must(t, g.server, edit("operation-hash-text", "text/hash-reference", unreferenced, 0))
	point := filepath.Join(t.TempDir(), "notebook-draft-conflicts")
	if err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point); err != nil {
		t.Fatal(err)
	}
	wantNames := []string{first, second}
	sort.Strings(wantNames)
	if got := backupMediaNames(t, point); !reflect.DeepEqual(got, wantNames) {
		t.Fatalf("draft media roots: got %v, want %v", got, wantNames)
	}
	restoredRoot := filepath.Join(t.TempDir(), "restored")
	if err := restoreBackup(point, restoredRoot); err != nil {
		t.Fatal(err)
	}
	db, err := openDB(filepath.Join(restoredRoot, "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	got, err := record(db, want.Key)
	if err != nil || !reflect.DeepEqual(got, want) {
		t.Fatalf("draft conflict history changed: got %+v, want %+v, error %v", got, want, err)
	}
	backupAssertMedia(t, filepath.Join(restoredRoot, "media"), map[string][]byte{first: firstBytes, second: secondBytes})
}

func TestBackupRejectsMissingOrCorruptMediaWithoutPublishing(t *testing.T) {
	for _, failure := range []string{"missing", "corrupt", "directory"} {
		t.Run(failure, func(t *testing.T) {
			g := backupGraderFixture(t)
			a := photoSubmission(t, g)
			backupSubmit(t, g, a)
			source := filepath.Join(g.server.media.(DiskMedia).Root, a.Images[0])
			if err := os.Remove(source); err != nil {
				t.Fatal(err)
			}
			switch failure {
			case "corrupt":
				if err := os.WriteFile(source, []byte("corrupted upload"), 0600); err != nil {
					t.Fatal(err)
				}
			case "directory":
				if err := os.Mkdir(source, 0700); err != nil {
					t.Fatal(err)
				}
			}
			parent := t.TempDir()
			point := filepath.Join(parent, "notebook-failed")
			err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point)
			if err == nil || !strings.Contains(err.Error(), a.Images[0]) {
				t.Fatalf("backup must report the unavailable/corrupt media identity: %v", err)
			}
			if _, err := os.Stat(point); !os.IsNotExist(err) {
				t.Fatalf("failed backup published a recovery point: %v", err)
			}
			entries, err := os.ReadDir(parent)
			if err != nil {
				t.Fatal(err)
			}
			for _, entry := range entries {
				if !strings.HasPrefix(entry.Name(), ".") {
					t.Fatalf("failed backup left a valid-looking path: %s", entry.Name())
				}
			}
		})
	}
}

func TestBackupAndRestoreRefuseExistingDestinations(t *testing.T) {
	g := backupGraderFixture(t)
	a := photoSubmission(t, g)
	backupSubmit(t, g, a)
	point := filepath.Join(t.TempDir(), "notebook-valid")
	if err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point); err != nil {
		t.Fatal(err)
	}
	manifest, err := os.ReadFile(filepath.Join(point, "manifest.json"))
	if err != nil {
		t.Fatal(err)
	}
	if err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point); err == nil {
		t.Fatal("backup overwrote an existing recovery point")
	}
	after, err := os.ReadFile(filepath.Join(point, "manifest.json"))
	if err != nil || !bytes.Equal(after, manifest) {
		t.Fatal("existing recovery point changed", err)
	}
	restoreRoot := t.TempDir()
	marker := filepath.Join(restoreRoot, "existing-data")
	if err := os.WriteFile(marker, []byte("preserve"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := restoreBackup(point, restoreRoot); err == nil {
		t.Fatal("restore overwrote an existing data directory")
	}
	data, err := os.ReadFile(marker)
	if err != nil || string(data) != "preserve" {
		t.Fatal("existing restore destination changed", err)
	}
}

func TestRestoreRejectsIncompleteOrCorruptRecoveryPoint(t *testing.T) {
	for _, failure := range []string{"media missing", "media corrupt", "database corrupt", "manifest missing", "manifest version", "manifest omits media", "manifest invalid hash"} {
		t.Run(failure, func(t *testing.T) {
			g := backupGraderFixture(t)
			a := photoSubmission(t, g)
			backupSubmit(t, g, a)
			point := filepath.Join(t.TempDir(), "notebook-to-corrupt")
			if err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point); err != nil {
				t.Fatal(err)
			}
			var err error
			switch failure {
			case "media missing":
				err = os.Remove(filepath.Join(point, "media", a.Images[0]))
			case "media corrupt":
				err = os.WriteFile(filepath.Join(point, "media", a.Images[0]), []byte("corrupt media"), 0600)
			case "database corrupt":
				err = os.WriteFile(filepath.Join(point, "notebook.db"), []byte("not a database"), 0600)
			case "manifest missing":
				err = os.Remove(filepath.Join(point, "manifest.json"))
			case "manifest version":
				err = os.WriteFile(filepath.Join(point, "manifest.json"), []byte(`{"version":999}`), 0600)
			case "manifest omits media", "manifest invalid hash":
				var manifest backupManifest
				data, readErr := os.ReadFile(filepath.Join(point, "manifest.json"))
				if readErr != nil {
					t.Fatal(readErr)
				}
				if err = json.Unmarshal(data, &manifest); err != nil {
					t.Fatal(err)
				}
				manifest.MediaHashes = []string{}
				if failure == "manifest invalid hash" {
					manifest.MediaHashes = []string{"../../outside-recovery-point"}
				}
				data, err = json.Marshal(manifest)
				if err == nil {
					err = os.WriteFile(filepath.Join(point, "manifest.json"), data, 0600)
				}
			}
			if err != nil {
				t.Fatal(err)
			}
			restoreRoot := filepath.Join(t.TempDir(), "restore-failed")
			if err := restoreBackup(point, restoreRoot); err == nil {
				t.Fatalf("restored invalid recovery point: %s", failure)
			}
			if _, err := os.Stat(restoreRoot); !os.IsNotExist(err) {
				t.Fatalf("failed restore published a data directory: %v", err)
			}
		})
	}
}

func backupSetAge(t *testing.T, point string, createdAt time.Time) {
	t.Helper()
	path := filepath.Join(point, "manifest.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var manifest backupManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		t.Fatal(err)
	}
	manifest.CreatedAt = createdAt
	data, err = json.Marshal(manifest)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0600); err != nil {
		t.Fatal(err)
	}
}

func TestBackupPruningPreservesOtherRecoveryPoints(t *testing.T) {
	g := backupGraderFixture(t)
	a := photoSubmission(t, g)
	backupSubmit(t, g, a)
	image, err := os.ReadFile(filepath.Join(g.server.media.(DiskMedia).Root, a.Images[0]))
	if err != nil {
		t.Fatal(err)
	}
	backups := filepath.Join(t.TempDir(), "weekly backups")
	if err := os.Mkdir(backups, 0700); err != nil {
		t.Fatal(err)
	}
	now := time.Date(2026, 9, 20, 4, 0, 0, 0, time.UTC)
	createAt := func(at time.Time) string {
		point := filepath.Join(backups, "notebook-"+at.Format("20060102-150405"))
		if err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point); err != nil {
			t.Fatal(err)
		}
		backupSetAge(t, point, at)
		return point
	}
	pointA := createAt(now.Add(-43 * 24 * time.Hour))
	pointB := createAt(now.Add(-29 * 24 * time.Hour))
	if !g.step(context.Background()) {
		t.Fatal("expected pending grading work")
	}
	g.removeRetiredMedia()
	if _, err := os.Stat(filepath.Join(g.server.media.(DiskMedia).Root, a.Images[0])); !os.IsNotExist(err) {
		t.Fatalf("live retirement must remain independent of backups: %v", err)
	}
	pointC := createAt(now)
	if names := backupMediaNames(t, pointC); len(names) != 0 {
		t.Fatalf("post-transcription backup retained obsolete source images: %v", names)
	}
	restoreAndCheck := func(point string) {
		t.Helper()
		destination := filepath.Join(t.TempDir(), "restored")
		if err := restoreBackup(point, destination); err != nil {
			t.Fatal(err)
		}
		backupAssertMedia(t, filepath.Join(destination, "media"), map[string][]byte{a.Images[0]: image})
	}
	restoreAndCheck(pointA)
	restoreAndCheck(pointB)
	if err := pruneBackups(backups, now); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(pointA); !os.IsNotExist(err) {
		t.Fatalf("expired recovery point A remains: %v", err)
	}
	restoreAndCheck(pointB)
	if err := verifyBackup(pointC); err != nil {
		t.Fatal("pruning A invalidated C", err)
	}
	if err := pruneBackups(backups, now.Add(8*24*time.Hour)); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(pointB); !os.IsNotExist(err) {
		t.Fatalf("expired recovery point B remains: %v", err)
	}
	if err := verifyBackup(pointC); err != nil {
		t.Fatal("pruning B invalidated C", err)
	}
	entries, err := os.ReadDir(backups)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if entry.IsDir() {
			if _, err := os.Stat(filepath.Join(backups, entry.Name(), "media", a.Images[0])); !os.IsNotExist(err) {
				t.Fatalf("expired recovery points kept image %s: %v", a.Images[0], err)
			}
		}
	}
}

func TestLegacyBackupAuditReportsMediaLostAfterRetirement(t *testing.T) {
	g := backupGraderFixture(t)
	a := photoSubmission(t, g)
	backupSubmit(t, g, a)
	legacy := filepath.Join(t.TempDir(), "notebook-legacy.db")
	if _, err := g.server.db.Exec("VACUUM INTO ?", legacy); err != nil {
		t.Fatal(err)
	}
	if err := auditBackup(legacy, g.server.media.(DiskMedia).Root); err != nil {
		t.Fatal("intact legacy backup should audit successfully", err)
	}
	g.step(context.Background())
	g.removeRetiredMedia()
	err := auditBackup(legacy, g.server.media.(DiskMedia).Root)
	if err == nil || !strings.Contains(err.Error(), a.Images[0]) {
		t.Fatalf("legacy audit must identify the unrecoverable response hash: %v", err)
	}
}

func TestBackupPruningCleansAbandonedStagesAndRetainsUnrelatedFiles(t *testing.T) {
	g := backupGraderFixture(t)
	a := photoSubmission(t, g)
	backupSubmit(t, g, a)
	root := t.TempDir()
	now := time.Date(2026, 9, 20, 4, 0, 0, 0, time.UTC)
	point := filepath.Join(root, "notebook-"+now.Format("20060102-150405"))
	if err := createBackup(g.server.db, g.server.media.(DiskMedia).Root, point); err != nil {
		t.Fatal(err)
	}
	backupSetAge(t, point, now)
	for _, name := range []string{".backup-interrupted", ".pruning-interrupted"} {
		partial := filepath.Join(root, name)
		if err := os.Mkdir(partial, 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(partial, "notebook.db"), []byte("partial snapshot"), 0600); err != nil {
			t.Fatal(err)
		}
		if err := verifyBackup(partial); err == nil {
			t.Fatal("abandoned partial backup appeared valid")
		}
	}
	legacyOld := filepath.Join(root, "notebook-20260701-040000.db")
	legacyRecent := filepath.Join(root, "notebook-20260919-040000.db")
	unrelated := filepath.Join(root, "operator-notes.txt")
	for _, path := range []string{legacyOld, legacyRecent, unrelated} {
		if err := os.WriteFile(path, []byte("synthetic retained file"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	old := now.Add(-40 * 24 * time.Hour)
	if err := os.Chtimes(legacyOld, old, old); err != nil {
		t.Fatal(err)
	}
	if err := os.Chtimes(legacyRecent, now, now); err != nil {
		t.Fatal(err)
	}
	if err := pruneBackups(root, now); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{legacyOld, filepath.Join(root, ".backup-interrupted"), filepath.Join(root, ".pruning-interrupted")} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("expired/abandoned artifact was not removed: %s, %v", path, err)
		}
	}
	for _, path := range []string{legacyRecent, unrelated} {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("pruning touched an unexpired or unrelated file: %s, %v", path, err)
		}
	}
	if err := verifyBackup(point); err != nil {
		t.Fatal("cleanup invalidated the completed recovery point", err)
	}
}

// A separate test process owns the same flock used by the scheduled backup.
// Killing it exercises OS lock release, without touching a running service.
func TestBackupLockHolderProcess(t *testing.T) {
	root := os.Getenv("FOUNDATIONS_TEST_BACKUP_LOCK_ROOT")
	if root == "" {
		return
	}
	lock, err := lockDirectory(root, os.Getenv("FOUNDATIONS_TEST_BACKUP_LOCK_NAME"), false)
	if err != nil {
		t.Fatal(err)
	}
	defer lock.Close()
	fmt.Fprintln(os.Stdout, "locked")
	io.Copy(io.Discard, os.Stdin)
}

func backupHoldExternalLock(t *testing.T, root, name string) func() {
	t.Helper()
	cmd := exec.Command(os.Args[0], "-test.run=^TestBackupLockHolderProcess$")
	cmd.Env = append(os.Environ(), "FOUNDATIONS_TEST_BACKUP_LOCK_ROOT="+root, "FOUNDATIONS_TEST_BACKUP_LOCK_NAME="+name)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	in, err := cmd.StdinPipe()
	if err != nil {
		t.Fatal(err)
	}
	out, err := cmd.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	var once sync.Once
	stop := func() {
		once.Do(func() {
			cmd.Process.Kill()
			in.Close()
			cmd.Wait()
		})
	}
	t.Cleanup(stop)
	ready := make(chan error, 1)
	go func() {
		line, err := bufio.NewReader(out).ReadString('\n')
		if err == nil && line != "locked\n" {
			err = fmt.Errorf("unexpected lock helper response %q", line)
		}
		ready <- err
	}()
	select {
	case err := <-ready:
		if err != nil {
			stop()
			t.Fatalf("backup lock helper: %v; %s", err, stderr.String())
		}
	case <-time.After(5 * time.Second):
		stop()
		t.Fatalf("backup lock helper timed out; %s", stderr.String())
	}
	return stop
}

func TestBackupPruningWaitsForActiveCreationAndRecoversAfterExit(t *testing.T) {
	root := t.TempDir()
	stop := backupHoldExternalLock(t, root, ".backup.lock")
	partial := filepath.Join(root, ".backup-active")
	if err := os.Mkdir(partial, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(partial, "notebook.db"), []byte("snapshot still being constructed"), 0600); err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() { done <- pruneBackups(root, time.Now()) }()
	select {
	case err := <-done:
		t.Fatalf("pruning bypassed an active backup process: %v", err)
	case <-time.After(50 * time.Millisecond):
	}
	if _, err := os.Stat(partial); err != nil {
		t.Fatal("pruning deleted active staging data", err)
	}
	stop() // Simulate the creator exiting midway through a backup.
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("pruning did not recover after backup process exit")
	}
	if _, err := os.Stat(partial); !os.IsNotExist(err) {
		t.Fatalf("abandoned partial backup was not cleaned after lock release: %v", err)
	}
}

func TestBackupProcessLockPreventsLiveMediaRetirement(t *testing.T) {
	g := backupGraderFixture(t)
	a := photoSubmission(t, g)
	backupSubmit(t, g, a)
	mediaRoot := g.server.media.(DiskMedia).Root
	stop := backupHoldExternalLock(t, mediaRoot, ".retirement.lock")
	if !g.step(context.Background()) {
		t.Fatal("expected pending grading work")
	}
	saved, err := loadAttempt(g.server.db, a.ID)
	if err != nil || saved.Transcription != "p implies q" || len(saved.Images) != 0 {
		t.Fatalf("backup lock must not block retained transcription: %+v, %v", saved, err)
	}
	done := make(chan struct{})
	go func() {
		g.removeRetiredMedia()
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("retirement blocked behind a backup instead of skipping this cleanup pass")
	}
	if _, err := os.Stat(filepath.Join(mediaRoot, a.Images[0])); err != nil {
		t.Fatal("live retirement invalidated an in-progress backup", err)
	}
	stop()
	g.removeRetiredMedia()
	if _, err := os.Stat(filepath.Join(mediaRoot, a.Images[0])); !os.IsNotExist(err) {
		t.Fatalf("live media was not retired after backup lock release: %v", err)
	}
}

func TestBackupCreationWaitsForMediaRetentionLock(t *testing.T) {
	g := backupGraderFixture(t)
	a := photoSubmission(t, g)
	backupSubmit(t, g, a)
	mediaRoot := g.server.media.(DiskMedia).Root
	stop := backupHoldExternalLock(t, mediaRoot, ".retirement.lock")
	point := filepath.Join(t.TempDir(), "notebook-locked")
	done := make(chan error, 1)
	go func() { done <- createBackup(g.server.db, mediaRoot, point) }()
	select {
	case err := <-done:
		t.Fatalf("backup creation bypassed the media-retention lock: %v", err)
	case <-time.After(50 * time.Millisecond):
	}
	if _, err := os.Stat(point); !os.IsNotExist(err) {
		t.Fatalf("backup published before owning the media-retention lock: %v", err)
	}
	// The external process represents a collector already holding the media
	// lock. Finish its transcription and deletion while backup creation waits.
	// A snapshot taken before acquiring the lock would now contain a stale
	// reference and fail copying; a snapshot taken afterward needs no image.
	if !g.step(context.Background()) {
		t.Fatal("expected pending grading work")
	}
	if err := os.Remove(filepath.Join(mediaRoot, a.Images[0])); err != nil {
		t.Fatal(err)
	}
	stop()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("backup did not recover after media-lock holder exited")
	}
	if err := verifyBackup(point); err != nil {
		t.Fatal(err)
	}
	db, err := openBackupDatabase(filepath.Join(point, "notebook.db"), true)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	saved, err := loadAttempt(db, a.ID)
	if err != nil || saved.Status != "graded" || saved.Transcription != "p implies q" || len(saved.Images) != 0 || len(saved.Photos) != 0 {
		t.Fatalf("snapshot must reflect retirement completed before lock acquisition: %+v, %v", saved, err)
	}
	if hashes := backupMediaNames(t, point); len(hashes) != 0 {
		t.Fatalf("post-retirement snapshot retained obsolete media: %v", hashes)
	}
}
