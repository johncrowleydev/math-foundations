package main

import (
	"database/sql"
	"fmt"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func backupReferenceDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := openDB(filepath.Join(t.TempDir(), "notebook.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func addBackupReferenceVersion(t *testing.T, db *sql.DB, id, key, payload string) {
	t.Helper()
	if _, err := db.Exec("INSERT INTO versions(id,key,payload,device,updated,retained) VALUES(?,?,?,'test',1,1)", id, key, payload); err != nil {
		t.Fatal(err)
	}
}

func addBackupReferenceAttempt(t *testing.T, db *sql.DB, id, payload string) {
	t.Helper()
	if _, err := db.Exec("INSERT INTO attempts(id,exercise,submitted,data,context,status) VALUES(?,'test',1,?,'{}','pending')", id, payload); err != nil {
		t.Fatal(err)
	}
}

func TestReferencedDatabaseMediaIncludesAllResponseRoots(t *testing.T) {
	db := backupReferenceDB(t)
	a, b, c, d, unrelated := strings.Repeat("a", 64), strings.Repeat("b", 64), strings.Repeat("c", 64), strings.Repeat("d", 64), strings.Repeat("e", 64)
	// Rendered/handwriting images and rotated original photos can be distinct.
	// Repeated hashes, and another attempt using the same hash, are one object.
	addBackupReferenceAttempt(t, db, "first", fmt.Sprintf(`{"images":[%q,%q,%q],"photos":[{"hash":%q,"rotation":90}],"text":%q,"contentVersion":%q}`, d, a, a, b, unrelated, unrelated))
	addBackupReferenceAttempt(t, db, "second", fmt.Sprintf(`{"images":[%q],"photos":[{"hash":%q,"rotation":270}]}`, b, b))
	// These stored historical/conflict versions deliberately have no records row.
	addBackupReferenceVersion(t, db, "old-attempt", "attempt/archived", fmt.Sprintf(`{"images":[%q],"photos":[]}`, c))
	addBackupReferenceVersion(t, db, "old-photo", "photos/draft", fmt.Sprintf(`{"photos":[{"id":"original","hash":%q,"rotation":180}]}`, a))
	addBackupReferenceVersion(t, db, "new-photo", "photos/draft", `{"photos":[]}`)
	addBackupReferenceVersion(t, db, "text", "text/draft", fmt.Sprintf(`{"text":%q,"photos":[{"hash":%q}]}`, unrelated, unrelated))
	addBackupReferenceVersion(t, db, "review", "review-instance/test", fmt.Sprintf(`{"images":[%q]}`, unrelated))
	if _, err := db.Exec("INSERT INTO retired_attempt_media(hash) VALUES(?)", unrelated); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec("INSERT INTO attempt_transcriptions(id,text,source_hash) VALUES('retired','retained',?)", unrelated); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec("INSERT INTO operations(id,request,response) VALUES('op',?,'photos/draft')", unrelated); err != nil {
		t.Fatal(err)
	}
	got, err := referencedDatabaseMedia(db)
	if err != nil {
		t.Fatal(err)
	}
	if want := []string{a, b, c, d}; !reflect.DeepEqual(got, want) {
		t.Fatalf("referenced hashes = %v, want %v", got, want)
	}
}

func TestReferencedDatabaseMediaHistoricalSchema(t *testing.T) {
	db := backupReferenceDB(t)
	if _, err := db.Exec("DROP TABLE attempts"); err != nil {
		t.Fatal(err)
	}
	hash := strings.Repeat("f", 64)
	addBackupReferenceVersion(t, db, "legacy", "photos/legacy", fmt.Sprintf(`{"photos":[{"id":"photo","hash":%q,"rotation":90}]}`, hash))
	got, err := referencedDatabaseMedia(db)
	if err != nil || !reflect.DeepEqual(got, []string{hash}) {
		t.Fatalf("pre-grading notebook references = %v, %v", got, err)
	}
	var tables int
	if err := db.QueryRow("SELECT COUNT(*) FROM sqlite_schema WHERE name='attempts'").Scan(&tables); err != nil || tables != 0 {
		t.Fatal("reference discovery must not migrate a historical notebook", tables, err)
	}
}

func TestReferencedDatabaseMediaAcceptsMediaFreeAttempts(t *testing.T) {
	db := backupReferenceDB(t)
	for i, payload := range []string{`{"images":[]}`, `{"images":null,"photos":null}`, `{"text":"historical typed response"}`} {
		addBackupReferenceAttempt(t, db, fmt.Sprint(i), payload)
	}
	addBackupReferenceVersion(t, db, "empty", "photos/draft", `{"photos":[]}`)
	got, err := referencedDatabaseMedia(db)
	if err != nil || got == nil || len(got) != 0 {
		t.Fatalf("media-free references = %v, %v", got, err)
	}
}

func TestReferencedDatabaseMediaRejectsMalformedRoots(t *testing.T) {
	for _, tc := range []struct {
		name, key, payload string
	}{
		{"invalid JSON", "attempt/test", `{"images":`},
		{"null record", "attempt/test", `null`},
		{"array record", "attempt/test", `[]`},
		{"non-array images", "attempt/test", `{"images":"not-an-array"}`},
		{"null image", "attempt/test", `{"images":[null]}`},
		{"short hash", "attempt/test", `{"images":["abc"]}`},
		{"uppercase hash", "attempt/test", fmt.Sprintf(`{"images":[%q]}`, strings.Repeat("A", 64))},
		{"path hash", "attempt/test", `{"photos":[{"hash":"../outside"}]}`},
		{"empty photo", "photos/test", `{"photos":[{}]}`},
		{"null photo", "photos/test", `{"photos":[null]}`},
		{"missing photo list", "photos/test", `{}`},
		{"null photo list", "photos/test", `{"photos":null}`},
		{"empty attempt key", "attempt/", `{"images":[]}`},
		{"empty photo key", "photos/", `{"photos":[]}`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			db := backupReferenceDB(t)
			addBackupReferenceVersion(t, db, "invalid", tc.key, tc.payload)
			if hashes, err := referencedDatabaseMedia(db); err == nil || hashes != nil {
				t.Fatalf("malformed version produced usable references: %v, %v", hashes, err)
			}
		})
	}
	t.Run("malformed attempts data", func(t *testing.T) {
		db := backupReferenceDB(t)
		addBackupReferenceAttempt(t, db, "test", `{"images":["bad"]}`)
		if hashes, err := referencedDatabaseMedia(db); err == nil || hashes != nil {
			t.Fatalf("malformed attempt produced usable references: %v, %v", hashes, err)
		}
	})
}

func TestReferencedDatabaseMediaRejectsUnsupportedSchema(t *testing.T) {
	for _, tc := range []struct{ name, change string }{
		{"missing versions", "DROP TABLE versions"},
		{"versions view", "DROP TABLE versions; CREATE VIEW versions AS SELECT 'photos/test' AS key, '{}' AS payload"},
		{"unknown versions layout", "DROP TABLE versions; CREATE TABLE versions(id TEXT)"},
		{"unknown attempts layout", "DROP TABLE attempts; CREATE TABLE attempts(id TEXT)"},
		{"attempts view", "DROP TABLE attempts; CREATE VIEW attempts AS SELECT 'test' AS id, '{}' AS data"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			db := backupReferenceDB(t)
			if _, err := db.Exec(tc.change); err != nil {
				t.Fatal(err)
			}
			if hashes, err := referencedDatabaseMedia(db); err == nil || hashes != nil {
				t.Fatalf("unsupported schema produced usable references: %v, %v", hashes, err)
			}
		})
	}
}
