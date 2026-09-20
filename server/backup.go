package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"
)

const backupRetention = 36 * 24 * time.Hour // Same cutoff as the former find -mtime +35.

var recoveryName = regexp.MustCompile(`^notebook-[0-9]{8}-[0-9]{6}$`)

type backupManifest struct {
	Version        int       `json:"version"`
	CreatedAt      time.Time `json:"createdAt"`
	Database       string    `json:"database"`
	DatabaseSHA256 string    `json:"databaseSha256"`
	MediaHashes    []string  `json:"mediaHashes"`
}

// No openDB: inspecting a recovery point must never migrate it. URI escaping
// keeps spaces, '?' and '#' in operator-supplied paths out of SQLite options.
func openBackupDatabase(path string, immutable bool) (*sql.DB, error) {
	if err := regularBackupFile(path); err != nil {
		return nil, err
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	u := url.URL{Scheme: "file", Path: abs, RawQuery: "mode=ro"}
	if immutable {
		// Final snapshots are standalone VACUUM output. Ignore unrelated WAL/SHM
		// files and never create SQLite sidecars while inspecting an archive.
		u.RawQuery += "&immutable=1"
	}
	db, err := sql.Open("sqlite", u.String())
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err = db.Exec("PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=10000"); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

func snapshotMedia(path string) ([]string, error) {
	db, err := openBackupDatabase(path, true)
	if err != nil {
		return nil, err
	}
	defer db.Close()
	var integrity string
	if err = db.QueryRow("PRAGMA quick_check").Scan(&integrity); err != nil {
		return nil, err
	}
	if integrity != "ok" {
		return nil, fmt.Errorf("database integrity check failed: %s", integrity)
	}
	return referencedDatabaseMedia(db)
}

func createBackup(db *sql.DB, mediaRoot, destination string) error {
	parent := filepath.Dir(destination)
	if err := os.MkdirAll(parent, 0700); err != nil {
		return err
	}
	// Creation and pruning share this lock so pruning can safely remove abandoned
	// staging directories. Neither ever removes the lock file itself.
	lock, err := lockDirectory(parent, ".backup.lock", false)
	if err != nil {
		return err
	}
	defer lock.Close()
	if err = requireNewDirectory(destination); err != nil {
		return err
	}
	// Take this BEFORE VACUUM: a later lock would leave a snapshot/copy race.
	mediaLock, err := lockDirectory(mediaRoot, ".retirement.lock", false)
	if err != nil {
		return err
	}
	defer mediaLock.Close()
	stage, err := os.MkdirTemp(parent, ".backup-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(stage)
	database := filepath.Join(stage, "notebook.db")
	if _, err = db.Exec("VACUUM INTO ?", database); err != nil {
		return fmt.Errorf("snapshot database: %w", err)
	}
	if err = os.Chmod(database, 0600); err != nil {
		return err
	}
	hashes, err := snapshotMedia(database)
	if err != nil {
		return err
	}
	if err = copyBackupMedia(mediaRoot, filepath.Join(stage, "media"), hashes); err != nil {
		return err
	}
	digest, err := hashBackupFile(database)
	if err != nil {
		return err
	}
	if err = syncBackupPath(database); err != nil {
		return err
	}
	manifest := backupManifest{1, time.Now().UTC(), "notebook.db", digest, hashes}
	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return err
	}
	if err = os.WriteFile(filepath.Join(stage, "manifest.json"), append(data, '\n'), 0600); err != nil {
		return err
	}
	if err = syncBackupPath(filepath.Join(stage, "manifest.json")); err != nil {
		return err
	}
	return publishBackupDirectory(stage, destination)
}

func readBackupManifest(directory string) (backupManifest, error) {
	var m backupManifest
	path := filepath.Join(directory, "manifest.json")
	if err := regularBackupFile(path); err != nil {
		return m, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return m, err
	}
	if err = json.Unmarshal(data, &m); err != nil {
		return m, err
	}
	if m.Version != 1 || m.CreatedAt.IsZero() || m.Database != "notebook.db" || !hashPattern.MatchString(m.DatabaseSHA256) || m.MediaHashes == nil {
		return m, errors.New("invalid or unsupported backup manifest")
	}
	for i, hash := range m.MediaHashes {
		if !hashPattern.MatchString(hash) || (i > 0 && m.MediaHashes[i-1] >= hash) {
			return m, errors.New("backup manifest requires sorted, unique SHA-256 media IDs")
		}
	}
	return m, nil
}

func verifyBackup(directory string) error {
	m, err := readBackupManifest(directory)
	if err != nil {
		return err
	}
	return verifyBackupContents(directory, m)
}

func verifyBackupContents(directory string, m backupManifest) error {
	database := filepath.Join(directory, m.Database)
	if err := checkBackupHash(database, m.DatabaseSHA256); err != nil {
		return err
	}
	hashes, err := snapshotMedia(database)
	if err != nil {
		return err
	}
	if !slices.Equal(hashes, m.MediaHashes) {
		return errors.New("backup manifest media IDs disagree with database references")
	}
	return checkBackupMedia(filepath.Join(directory, "media"), hashes)
}

func restoreBackup(source, destination string) error {
	if err := requireNewDirectory(destination); err != nil {
		return err
	}
	m, err := readBackupManifest(source)
	if err != nil {
		return err
	}
	// Check the source before copying and the staged result before publishing.
	if err = verifyBackupContents(source, m); err != nil {
		return err
	}
	stage, err := os.MkdirTemp(filepath.Dir(destination), ".restore-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(stage)
	if err = copyBackupFile(filepath.Join(source, m.Database), filepath.Join(stage, m.Database), m.DatabaseSHA256); err != nil {
		return err
	}
	if err = copyBackupMedia(filepath.Join(source, "media"), filepath.Join(stage, "media"), m.MediaHashes); err != nil {
		return err
	}
	if err = verifyBackupContents(stage, m); err != nil {
		return err
	}
	return publishBackupDirectory(stage, destination)
}

// Audit legacy DB-only snapshots against an explicitly supplied media directory.
// Report every unavailable object; neither the DB nor the media is repaired.
func auditBackup(databasePath, mediaRoot string) error {
	hashes, err := snapshotMedia(databasePath)
	if err == nil {
		err = checkBackupMedia(mediaRoot, hashes)
	}
	if err != nil {
		return fmt.Errorf("%s: %w", databasePath, err)
	}
	return nil
}

func pruneBackups(directory string, now time.Time) error {
	lock, err := lockDirectory(directory, ".backup.lock", false)
	if err != nil {
		return err
	}
	defer lock.Close()
	entries, err := os.ReadDir(directory)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		path := filepath.Join(directory, entry.Name())
		if entry.IsDir() && (strings.HasPrefix(entry.Name(), ".backup-") || strings.HasPrefix(entry.Name(), ".pruning-")) {
			// No creator/pruner is active while we hold the directory lock.
			if err = os.RemoveAll(path); err != nil {
				return err
			}
			continue
		}
		if entry.IsDir() && recoveryName.MatchString(entry.Name()) {
			m, err := readBackupManifest(path)
			if err != nil {
				return fmt.Errorf("prune %s: %w", path, err)
			}
			if now.Before(m.CreatedAt.Add(backupRetention)) {
				continue
			}
			retired, err := os.MkdirTemp(directory, ".pruning-")
			if err != nil {
				return err
			}
			if err = os.Remove(retired); err != nil {
				return err
			}
			if err = os.Rename(path, retired); err != nil {
				return err
			}
			if err = syncBackupPath(directory); err != nil {
				return err
			}
			if err = os.RemoveAll(retired); err != nil {
				return err
			}
		} else if entry.Type().IsRegular() && strings.HasPrefix(entry.Name(), "notebook-") && strings.HasSuffix(entry.Name(), ".db") {
			// Keep the existing legacy-file expiry policy during rollout. A raw DB
			// is never advertised as a media-complete version-1 recovery point.
			info, err := entry.Info()
			if err != nil {
				return err
			}
			if !now.Before(info.ModTime().Add(backupRetention)) {
				if err = os.Remove(path); err != nil {
					return err
				}
			}
		}
	}
	return syncBackupPath(directory)
}

func copyBackupMedia(source, destination string, hashes []string) error {
	if err := os.Mkdir(destination, 0700); err != nil {
		return err
	}
	for _, hash := range hashes {
		if err := copyBackupFile(filepath.Join(source, hash), filepath.Join(destination, hash), hash); err != nil {
			return err
		}
	}
	return syncBackupPath(destination)
}

func copyBackupFile(source, destination, expectedHash string) error {
	if err := regularBackupFile(source); err != nil {
		return err
	}
	in, err := os.Open(source)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(destination, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer out.Close()
	h := sha256.New()
	if _, err = io.Copy(io.MultiWriter(out, h), in); err != nil {
		return err
	}
	if hex.EncodeToString(h.Sum(nil)) != expectedHash {
		return fmt.Errorf("SHA-256 mismatch: %s", source)
	}
	if err = out.Sync(); err != nil {
		return err
	}
	return out.Close()
}

func regularBackupFile(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("expected regular backup file: %s", path)
	}
	return nil
}

func hashBackupFile(path string) (string, error) {
	if err := regularBackupFile(path); err != nil {
		return "", err
	}
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err = io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func checkBackupHash(path, expected string) error {
	hash, err := hashBackupFile(path)
	if err != nil {
		return err
	}
	if hash != expected {
		return fmt.Errorf("SHA-256 mismatch: %s", path)
	}
	return nil
}

func checkBackupMedia(directory string, hashes []string) error {
	var failures []error
	for _, hash := range hashes {
		if err := checkBackupHash(filepath.Join(directory, hash), hash); err != nil {
			failures = append(failures, err)
		}
	}
	return errors.Join(failures...)
}

func requireNewDirectory(path string) error {
	if _, err := os.Lstat(path); !os.IsNotExist(err) {
		if err != nil {
			return err
		}
		return fmt.Errorf("destination already exists: %s", path)
	}
	return nil
}

func publishBackupDirectory(stage, destination string) error {
	if err := syncBackupPath(stage); err != nil {
		return err
	}
	if err := requireNewDirectory(destination); err != nil {
		return err
	}
	if err := os.Rename(stage, destination); err != nil {
		return err
	}
	return syncBackupPath(filepath.Dir(destination))
}

func syncBackupPath(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return f.Sync()
}
