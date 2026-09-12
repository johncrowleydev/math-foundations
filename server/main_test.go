package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

func fixture(t *testing.T) *Server {
	t.Helper()
	root := t.TempDir()
	db, e := openDB(filepath.Join(root, "db"))
	if e != nil {
		t.Fatal(e)
	}
	t.Cleanup(func() { db.Close() })
	h := sha256.Sum256([]byte("test-key"))
	return &Server{db, DiskMedia{root}, h[:]}
}
func edit(id, key, text string, base int64) Mutation {
	p, _ := json.Marshal(map[string]string{"text": text})
	return Mutation{ID: id, Key: key, Payload: p, Base: base, Device: id}
}
func must(t *testing.T, s *Server, m Mutation) Record {
	t.Helper()
	r, e := s.mutate(m)
	if e != nil {
		t.Fatal(e)
	}
	return r
}
func TestConflictsResolutionRetryAndIndependentRepresentations(t *testing.T) {
	s := fixture(t)
	a := must(t, s, edit("operation-tablet-1", "text/logic-1", "tablet", 0))
	b := must(t, s, edit("operation-phone-1", "text/logic-1", "phone", 0))
	if len(b.Conflicts) != 1 || len(b.Versions) != 2 || b.ID != a.ID {
		t.Fatalf("lost conflict: %+v", b)
	}
	retry := must(t, s, edit("operation-phone-1", "text/logic-1", "phone", 0))
	if retry.Revision != b.Revision {
		t.Fatal("retry applied twice")
	}
	c := edit("operation-resolve-1", "text/logic-1", "phone", b.Revision)
	c.Resolve = true
	r := must(t, s, c)
	if len(r.Conflicts) != 0 || len(r.Versions) < 2 {
		t.Fatal("resolution discarded copies")
	}
	ink := Mutation{ID: "operation-ink-001", Key: "ink/logic-1", Payload: json.RawMessage(`{"version":1,"height":520,"strokes":[]}`)}
	if len(must(t, s, ink).Conflicts) != 0 {
		t.Fatal("independent ink conflicted")
	}
	blank := must(t, s, edit("operation-clear-1", "text/logic-1", "", r.Revision))
	if string(blank.Payload) != `{"text":""}` {
		t.Fatal("clear not synchronized")
	}
	late := must(t, s, edit("operation-late-01", "text/logic-1", "offline", a.Revision))
	if len(late.Conflicts) == 0 {
		t.Fatal("late offline edit erased deletion")
	}
	if _, e := s.mutate(edit("operation-phone-1", "text/logic-1", "different", 0)); e == nil {
		t.Fatal("reused mutation accepted")
	}
}
func TestConcurrentOfflineDevices(t *testing.T) {
	s := fixture(t)
	var wg sync.WaitGroup
	for i := 0; i < 12; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			if _, e := s.mutate(edit(fmt.Sprintf("operation-%016d", i), "text/sets-1", fmt.Sprint(i), 0)); e != nil {
				t.Error(e)
			}
		}(i)
	}
	wg.Wait()
	r, e := record(s.db, "text/sets-1")
	if e != nil || len(r.Versions) != 12 || len(r.Conflicts) != 11 {
		t.Fatalf("missing versions: %v %+v", e, r)
	}
}
func call(s *Server, method, path string, body []byte, auth bool) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, bytes.NewReader(body))
	if auth {
		r.Header.Set("Authorization", "Bearer test-key")
	}
	w := httptest.NewRecorder()
	s.handler().ServeHTTP(w, r)
	return w
}
func TestHTTPAuthMediaValidationAndChanges(t *testing.T) {
	s := fixture(t)
	if call(s, "GET", "/api/v1/status", nil, false).Code != 401 {
		t.Fatal("unauthenticated access")
	}
	bytes := []byte("jpeg-test-bytes")
	h := sha256.Sum256(bytes)
	id := hex.EncodeToString(h[:])
	path := "/api/v1/media/" + id
	if call(s, "PUT", path, []byte("truncated"), true).Code != 400 {
		t.Fatal("bad hash accepted")
	}
	if call(s, "HEAD", path, nil, true).Code != 404 {
		t.Fatal("partial upload visible")
	}
	if call(s, "PUT", path, bytes, true).Code != 204 {
		t.Fatal("upload failed")
	}
	if w := call(s, "GET", path, nil, true); w.Code != 200 || w.Body.String() != string(bytes) {
		t.Fatal("media mismatch")
	}
	if call(s, "GET", path, nil, false).Code != 401 {
		t.Fatal("public photos")
	}
	m := edit("http-operation-0001", "text/logic-1", "hello", 0)
	b, _ := json.Marshal(m)
	if w := call(s, "POST", "/api/v1/mutations", b, true); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if call(s, "POST", "/api/v1/mutations", []byte(`{"id":"operation-invalid","key":"text/x","base":0,"payload":null}`), true).Code != 400 {
		t.Fatal("null accepted")
	}
	w := call(s, "GET", "/api/v1/changes?after=0", nil, true)
	var changes struct {
		Cursor  int
		Records []Record
	}
	json.Unmarshal(w.Body.Bytes(), &changes)
	if changes.Cursor != 1 || len(changes.Records) != 1 {
		t.Fatal(w.Body.String())
	}
	if call(s, "GET", "/api/v1/changes?after=-1", nil, true).Code != http.StatusBadRequest {
		t.Fatal("negative cursor accepted")
	}
}
func TestWeeklyBackupCanRestore(t *testing.T) {
	s := fixture(t)
	must(t, s, edit("backup-operation-1", "text/proofs-1", "saved", 0))
	path := filepath.Join(t.TempDir(), "backup.db")
	if _, e := s.db.Exec("VACUUM INTO ?", path); e != nil {
		t.Fatal(e)
	}
	db, e := openDB(path)
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	r, e := record(db, "text/proofs-1")
	if e != nil || string(r.Payload) != `{"text":"saved"}` {
		t.Fatal("restore failed", e)
	}
	if _, e = os.Stat(path); e != nil {
		t.Fatal(e)
	}
}
