package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"
)

// Run the production command dispatcher in a child of the test binary. This
// keeps exit/error behavior and race instrumentation without rebuilding a CLI.
func TestBackupCLIHelper(t *testing.T) {
	if os.Getenv("FOUNDATIONS_BACKUP_TEST_CHILD") != "1" {
		return
	}
	for i, arg := range os.Args {
		if arg == "--" {
			os.Args = append([]string{os.Args[0]}, os.Args[i+1:]...)
			main()
			os.Exit(0)
		}
	}
	os.Exit(2)
}

func runBackupCLI(t *testing.T, root string, args ...string) ([]byte, error) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	return backupCLIProcess(t, ctx, root, args...).CombinedOutput()
}

func backupCLIProcess(t *testing.T, ctx context.Context, root string, args ...string) *exec.Cmd {
	t.Helper()
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	cmd := exec.CommandContext(ctx, executable, append([]string{"-test.run=^TestBackupCLIHelper$", "--"}, args...)...)
	cmd.Env = append(os.Environ(), "FOUNDATIONS_BACKUP_TEST_CHILD=1", "FOUNDATIONS_DATA="+root,
		"FOUNDATIONS_EMAIL=", "FOUNDATIONS_PASSWORD_HASH=", "FOUNDATIONS_ORIGIN=")
	return cmd
}

func TestBackupCLIInvalidArgumentsDoNotInitializeNotebook(t *testing.T) {
	for _, tc := range []struct {
		name string
		args []string
	}{
		{"missing destination", []string{"backup"}},
		{"extra argument", []string{"backup", filepath.Join(t.TempDir(), "destination"), "extra"}},
		{"verify missing directory", []string{"verify-backup"}},
		{"verify extra argument", []string{"verify-backup", "unused", "extra"}},
		{"restore missing destination", []string{"restore-backup", "unused"}},
		{"audit missing media directory", []string{"audit-backup", "unused"}},
		{"prune missing directory", []string{"prune-backups"}},
		{"unknown command", []string{"unknown-command"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			root := filepath.Join(t.TempDir(), "does not exist")
			if output, err := runBackupCLI(t, root, tc.args...); err == nil {
				t.Fatalf("invalid arguments succeeded: %s", output)
			}
			if _, err := os.Stat(root); !os.IsNotExist(err) {
				t.Fatalf("invalid arguments initialized live notebook state: %v", err)
			}
		})
	}
}

func commandBackupFixture(t *testing.T) (string, string, []byte) {
	t.Helper()
	root := filepath.Join(t.TempDir(), "live data with spaces")
	if err := os.MkdirAll(filepath.Join(root, "media"), 0700); err != nil {
		t.Fatal(err)
	}
	data := []byte("synthetic response image for command integration")
	digest := sha256.Sum256(data)
	hash := hex.EncodeToString(digest[:])
	if err := os.WriteFile(filepath.Join(root, "media", hash), data, 0600); err != nil {
		t.Fatal(err)
	}
	db, err := openDB(filepath.Join(root, "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	// Keep this connection open: the committed version remains in WAL, so the
	// command must snapshot the running notebook rather than its main file alone.
	t.Cleanup(func() { db.Close() })
	addBackupReferenceVersion(t, db, "photo-version", "photos/synthetic", fmt.Sprintf(`{"photos":[{"id":"photo","hash":%q,"rotation":90}]}`, hash))
	return root, hash, data
}

func TestBackupCLIRoundTripAndReadOnlyAudit(t *testing.T) {
	root, hash, data := commandBackupFixture(t)
	if wal, err := os.Stat(filepath.Join(root, "notebook.db-wal")); err != nil || wal.Size() == 0 {
		t.Fatalf("fixture must have committed data in WAL: %v", err)
	}
	point := filepath.Join(t.TempDir(), "recovery point ?# with spaces")
	if output, err := runBackupCLI(t, root, "backup", point); err != nil {
		t.Fatalf("backup command: %s: %v", output, err)
	}
	before, err := os.ReadFile(filepath.Join(point, "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	unusedLiveRoot := filepath.Join(t.TempDir(), "must remain absent")
	for _, args := range [][]string{
		{"verify-backup", point},
		{"audit-backup", filepath.Join(point, "notebook.db"), filepath.Join(point, "media")},
	} {
		if output, err := runBackupCLI(t, unusedLiveRoot, args...); err != nil {
			t.Fatalf("%s: %s: %v", args[0], output, err)
		}
	}
	// The restore command must work after the entire live source is unavailable.
	if err := os.RemoveAll(root); err != nil {
		t.Fatal(err)
	}
	restored := filepath.Join(t.TempDir(), "restored data with spaces")
	if output, err := runBackupCLI(t, unusedLiveRoot, "restore-backup", point, restored); err != nil {
		t.Fatalf("restore command: %s: %v", output, err)
	}
	got, err := os.ReadFile(filepath.Join(restored, "media", hash))
	if err != nil || !bytes.Equal(got, data) {
		t.Fatalf("restored response bytes differ: %v", err)
	}
	digest := sha256.Sum256(got)
	if hex.EncodeToString(digest[:]) != hash {
		t.Fatal("restored bytes do not match their media ID")
	}
	db, err := sql.Open("sqlite", filepath.Join(restored, "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var payload string
	if err = db.QueryRow("SELECT payload FROM versions WHERE id='photo-version'").Scan(&payload); err != nil || !strings.Contains(payload, `"rotation":90`) || !strings.Contains(payload, hash) {
		t.Fatalf("restore lost photo metadata or identity: %v", err)
	}
	if _, err = os.Stat(unusedLiveRoot); !os.IsNotExist(err) {
		t.Fatalf("verify/audit/restore initialized unrelated live database: %v", err)
	}
	after, err := os.ReadFile(filepath.Join(point, "notebook.db"))
	if err != nil || !bytes.Equal(before, after) {
		t.Fatalf("inspection or restore changed the source database: %v", err)
	}
	for _, suffix := range []string{"-wal", "-shm"} {
		if _, err = os.Stat(filepath.Join(point, "notebook.db") + suffix); !os.IsNotExist(err) {
			t.Fatalf("read-only snapshot inspection created SQLite %s: %v", suffix, err)
		}
	}
	if err = os.Remove(filepath.Join(point, "media", hash)); err != nil {
		t.Fatal(err)
	}
	output, err := runBackupCLI(t, unusedLiveRoot, "audit-backup", filepath.Join(point, "notebook.db"), filepath.Join(point, "media"))
	if err == nil || !bytes.Contains(output, []byte(hash)) || !bytes.Contains(output, []byte(filepath.Join(point, "notebook.db"))) {
		t.Fatalf("historical audit did not identify database and missing hash: %s: %v", output, err)
	}
}

func TestBackupCLIMissingSourceDoesNotCreateNotebook(t *testing.T) {
	root := filepath.Join(t.TempDir(), "missing live root")
	destination := filepath.Join(t.TempDir(), "recovery")
	if output, err := runBackupCLI(t, root, "backup", destination); err == nil {
		t.Fatalf("backup without a source succeeded: %s", output)
	}
	for _, path := range []string{root, destination} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("missing-source backup created %s: %v", path, err)
		}
	}
}

func TestBackupCLIKilledCreatorReleasesLocks(t *testing.T) {
	root, _, _ := commandBackupFixture(t)
	mediaLock, err := os.OpenFile(filepath.Join(root, "media", ".retirement.lock"), os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		t.Fatal(err)
	}
	defer mediaLock.Close()
	if err = syscall.Flock(int(mediaLock.Fd()), syscall.LOCK_EX); err != nil {
		t.Fatal(err)
	}
	parent := t.TempDir()
	destination := filepath.Join(parent, "interrupted recovery")
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	cmd := backupCLIProcess(t, ctx, root, "backup", destination)
	var output bytes.Buffer
	cmd.Stdout, cmd.Stderr = &output, &output
	if err = cmd.Start(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { cmd.Process.Kill(); cmd.Wait() })
	// The backup directory lock proves the child entered creation and is now
	// waiting for retirement exclusion. Probe it independently with flock.
	deadline := time.Now().Add(5 * time.Second)
	for {
		probe, err := os.OpenFile(filepath.Join(parent, ".backup.lock"), os.O_RDWR, 0600)
		if err == nil {
			err = syscall.Flock(int(probe.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
			probe.Close()
			if errors.Is(err, syscall.EWOULDBLOCK) {
				break
			}
		}
		if time.Now().After(deadline) {
			t.Fatal("child did not acquire creation lock")
		}
		time.Sleep(10 * time.Millisecond)
	}
	if err = cmd.Process.Kill(); err != nil {
		t.Fatal(err)
	}
	if err = cmd.Wait(); err == nil {
		t.Fatal("killed command unexpectedly succeeded")
	}
	if _, err = os.Stat(destination); !os.IsNotExist(err) {
		t.Fatalf("interrupted command published recovery point: %v", err)
	}
	if err = mediaLock.Close(); err != nil {
		t.Fatal(err)
	}
	if output, err := runBackupCLI(t, root, "backup", destination); err != nil {
		t.Fatalf("killed creator stranded the backup lock: %s: %v", output, err)
	}
}

func deploymentBackupScript(t *testing.T) string {
	t.Helper()
	release := filepath.Join(t.TempDir(), "release with spaces")
	if err := os.Mkdir(release, 0700); err != nil {
		t.Fatal(err)
	}
	script, err := os.ReadFile(filepath.Join("deploy", "backup.sh"))
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(release, "backup.sh")
	if err = os.WriteFile(path, script, 0700); err != nil {
		t.Fatal(err)
	}
	wrapper := "#!/bin/sh\nset -eu\nexec \"$FOUNDATIONS_TEST_EXECUTABLE\" -test.run='^TestBackupCLIHelper$' -- \"$@\"\n"
	if err = os.WriteFile(filepath.Join(release, "foundations-server"), []byte(wrapper), 0700); err != nil {
		t.Fatal(err)
	}
	return path
}

func runDeploymentBackupScript(t *testing.T, script, root string) ([]byte, error) {
	t.Helper()
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, script)
	cmd.Env = append(os.Environ(), "FOUNDATIONS_BACKUP_TEST_CHILD=1", "FOUNDATIONS_TEST_EXECUTABLE="+executable,
		"FOUNDATIONS_DATA="+root, "FOUNDATIONS_SERVER=", "FOUNDATIONS_EMAIL=", "FOUNDATIONS_PASSWORD_HASH=", "FOUNDATIONS_ORIGIN=")
	return cmd.CombinedOutput()
}

func seedExpiredBackupArtifacts(t *testing.T, root string) []string {
	t.Helper()
	backups := filepath.Join(root, "backups")
	expired := filepath.Join(backups, "notebook-20000101-000000")
	if output, err := runBackupCLI(t, root, "backup", expired); err != nil {
		t.Fatalf("prepare expired recovery point: %s: %v", output, err)
	}
	path := filepath.Join(expired, "manifest.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var manifest map[string]any
	if err = json.Unmarshal(data, &manifest); err != nil {
		t.Fatal(err)
	}
	old := time.Now().Add(-40 * 24 * time.Hour)
	manifest["createdAt"] = old.UTC().Format(time.RFC3339Nano)
	data, err = json.Marshal(manifest)
	if err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(path, data, 0600); err != nil {
		t.Fatal(err)
	}
	legacy := filepath.Join(backups, "notebook-20000101-000001.db")
	if err = os.WriteFile(legacy, []byte("synthetic legacy snapshot"), 0600); err != nil {
		t.Fatal(err)
	}
	if err = os.Chtimes(legacy, old, old); err != nil {
		t.Fatal(err)
	}
	staging := filepath.Join(backups, ".backup-abandoned")
	if err = os.Mkdir(staging, 0700); err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(filepath.Join(staging, "notebook.db"), []byte("interrupted write"), 0600); err != nil {
		t.Fatal(err)
	}
	return []string{expired, legacy, staging}
}

func TestDeploymentBackupScriptCreatesAndPrunes(t *testing.T) {
	root, hash, data := commandBackupFixture(t)
	expired := seedExpiredBackupArtifacts(t, root)
	recentLegacy := filepath.Join(root, "backups", "notebook-20000101-000002.db")
	if err := os.WriteFile(recentLegacy, []byte("recent legacy snapshot"), 0600); err != nil {
		t.Fatal(err)
	}
	if output, err := runDeploymentBackupScript(t, deploymentBackupScript(t), root); err != nil {
		t.Fatalf("production deployment script: %s: %v", output, err)
	}
	for _, path := range expired {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("script retained expired/abandoned artifact %s: %v", path, err)
		}
	}
	if _, err := os.Stat(recentLegacy); err != nil {
		t.Fatalf("script pruned unexpired legacy snapshot: %v", err)
	}
	entries, err := os.ReadDir(filepath.Join(root, "backups"))
	if err != nil {
		t.Fatal(err)
	}
	points := 0
	for _, entry := range entries {
		if !entry.IsDir() || !strings.HasPrefix(entry.Name(), "notebook-") {
			continue
		}
		points++
		point := filepath.Join(root, "backups", entry.Name())
		if _, err := os.Stat(filepath.Join(point, "manifest.json")); err != nil {
			t.Fatal("script did not publish manifest", err)
		}
		got, err := os.ReadFile(filepath.Join(point, "media", hash))
		if err != nil || !bytes.Equal(got, data) {
			t.Fatal("script backup is missing response media", err)
		}
	}
	if points != 1 {
		t.Fatalf("script published %d recovery directories, want 1", points)
	}
}

func TestDeploymentBackupScriptFailureDoesNotPrune(t *testing.T) {
	root, hash, _ := commandBackupFixture(t)
	expired := seedExpiredBackupArtifacts(t, root)
	if err := os.Remove(filepath.Join(root, "media", hash)); err != nil {
		t.Fatal(err)
	}
	if output, err := runDeploymentBackupScript(t, deploymentBackupScript(t), root); err == nil || !bytes.Contains(output, []byte(hash)) {
		t.Fatalf("script did not fail for missing referenced media: %s: %v", output, err)
	}
	for _, path := range expired {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("failed backup pruned previous artifact %s: %v", path, err)
		}
	}
	entries, err := os.ReadDir(filepath.Join(root, "backups"))
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		if entry.Name() != ".backup.lock" && entry.Name() != filepath.Base(expired[0]) && entry.Name() != filepath.Base(expired[1]) && entry.Name() != filepath.Base(expired[2]) {
			t.Fatalf("failed backup left a new artifact: %s", entry.Name())
		}
	}
}
