package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestBackupCopyWriteFailureDoesNotPublish(t *testing.T) {
	const childMarker = "FOUNDATIONS_BACKUP_ATOMICITY_TEST_CHILD"
	const fileSizeLimit = 1 << 20
	if root := os.Getenv(childMarker); root != "" {
		// Limit only the child process. The small SQLite snapshot can complete,
		// but writing the larger media object must fail in the real copy path.
		db, err := openBackupDatabase(filepath.Join(root, "notebook.db"), false)
		if err != nil {
			t.Fatal(err)
		}
		defer db.Close()
		var limit syscall.Rlimit
		if err = syscall.Getrlimit(syscall.RLIMIT_FSIZE, &limit); err != nil {
			t.Fatal(err)
		}
		limit.Cur = fileSizeLimit
		signal.Ignore(syscall.SIGXFSZ)
		if err = syscall.Setrlimit(syscall.RLIMIT_FSIZE, &limit); err != nil {
			t.Fatal(err)
		}
		err = createBackup(db, filepath.Join(root, "media"), filepath.Join(root, "backups", "notebook-20260920-040000"))
		var writeError *os.PathError
		if !errors.Is(err, syscall.EFBIG) || !errors.As(err, &writeError) || writeError.Op != "write" || filepath.Base(filepath.Dir(writeError.Path)) != "media" {
			t.Fatalf("wanted a media-copy write failure after database snapshot, got %v", err)
		}
		t.Logf("Expected real media-copy failure: %v", err)
		return
	}

	root := t.TempDir()
	mediaRoot := filepath.Join(root, "media")
	if err := os.Mkdir(mediaRoot, 0700); err != nil {
		t.Fatal(err)
	}
	db, err := openDB(filepath.Join(root, "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	backups := filepath.Join(root, "backups")
	prior := filepath.Join(backups, "notebook-20260913-040000")
	if err = createBackup(db, mediaRoot, prior); err != nil {
		t.Fatal(err)
	}
	data := bytes.Repeat([]byte("synthetic media\n"), fileSizeLimit/8)
	if len(data) <= fileSizeLimit {
		t.Fatal("fixture must exceed the child's file-size limit")
	}
	hash := contentHash(data)
	if err = (DiskMedia{Root: mediaRoot}).Put(hash, bytes.NewReader(data)); err != nil {
		t.Fatal(err)
	}
	payload, err := json.Marshal(map[string]any{"photos": []SubmittedPhoto{{Hash: hash}}})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec("INSERT INTO versions(id,key,payload,device,updated) VALUES(?,?,?,?,?)", "large-photo-version", "photos/large-photo", string(payload), "synthetic", 1); err != nil {
		t.Fatal(err)
	}

	child := exec.Command(os.Args[0], "-test.run=^TestBackupCopyWriteFailureDoesNotPublish$", "-test.v")
	child.Env = append(os.Environ(), childMarker+"="+root)
	output, err := child.CombinedOutput()
	if err != nil {
		t.Fatalf("limited child failed: %v\n%s", err, output)
	}
	if !bytes.Contains(output, []byte("Expected real media-copy failure:")) {
		t.Fatalf("child did not exercise the file-size failure: %s", output)
	}
	t.Logf("%s", output)
	destination := filepath.Join(backups, "notebook-20260920-040000")
	if _, err = os.Lstat(destination); !os.IsNotExist(err) {
		t.Fatalf("failed backup published a destination: %v", err)
	}
	entries, err := os.ReadDir(backups)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".backup-") {
			t.Fatalf("failed media copy left staging directory %q", entry.Name())
		}
	}
	if err = verifyBackup(prior); err != nil {
		t.Fatalf("media-copy failure damaged the previous recovery point: %v", err)
	}
	if err = pruneBackups(backups, time.Now().UTC()); err != nil {
		t.Fatalf("prune after failed backup: %v", err)
	}
	if err = verifyBackup(prior); err != nil {
		t.Fatalf("pruning after a failed backup damaged retained history: %v", err)
	}
	// An unrestricted retry proves that the failure released locks and preserved
	// the live source, rather than merely returning the expected error string.
	if err = createBackup(db, mediaRoot, destination); err != nil {
		t.Fatalf("retry after write failure: %v", err)
	}
	if err = verifyBackup(destination); err != nil {
		t.Fatal(err)
	}
}

func TestBackupFinalizationPreservesCollidingDestination(t *testing.T) {
	s := fixture(t)
	mediaRoot := s.media.(DiskMedia).Root
	data := []byte("synthetic response object")
	hash := contentHash(data)
	if err := s.media.Put(hash, bytes.NewReader(data)); err != nil {
		t.Fatal(err)
	}
	payload, err := json.Marshal(map[string]any{"photos": []SubmittedPhoto{{Hash: hash}}})
	if err != nil {
		t.Fatal(err)
	}
	must(t, s, Mutation{ID: "photo-finalization", Key: "photos/finalization", Payload: payload, Device: "synthetic"})
	parent := t.TempDir()
	destination := filepath.Join(parent, "notebook-20260913-040000")
	if err = createBackup(s.db, mediaRoot, destination); err != nil {
		t.Fatal(err)
	}
	originals := map[string][]byte{}
	for _, name := range []string{"notebook.db", "manifest.json", filepath.Join("media", hash)} {
		originals[name], err = os.ReadFile(filepath.Join(destination, name))
		if err != nil {
			t.Fatal(err)
		}
	}
	must(t, s, edit("newer-finalization", "text/finalization", "newer synthetic answer", 0))
	stage := filepath.Join(parent, ".backup-ready-finalization-test")
	if err = createBackup(s.db, mediaRoot, stage); err != nil {
		t.Fatal(err)
	}
	if err = verifyBackup(stage); err != nil {
		t.Fatalf("stage must be complete before finalization failure: %v", err)
	}
	stagedDatabase, err := os.ReadFile(filepath.Join(stage, "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Equal(stagedDatabase, originals["notebook.db"]) {
		t.Fatal("stage and existing destination need distinguishable histories")
	}
	if err = publishBackupDirectory(stage, destination); err == nil || !strings.Contains(err.Error(), "destination already exists") {
		t.Fatalf("expected finalization collision after complete media copy, got %v", err)
	}
	for name, original := range originals {
		current, err := os.ReadFile(filepath.Join(destination, name))
		if err != nil || !bytes.Equal(current, original) {
			t.Fatalf("finalization failure changed destination %s: %v", name, err)
		}
	}
	if err = verifyBackup(destination); err != nil {
		t.Fatalf("previous destination no longer verifies: %v", err)
	}
	if err = verifyBackup(stage); err != nil {
		t.Fatalf("finalization failure unexpectedly changed staged contents: %v", err)
	}
}
