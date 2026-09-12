package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

func graderFixture(t *testing.T, reply *string) *Grading {
	t.Helper()
	s := fixture(t)
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var request map[string]any
		if json.NewDecoder(r.Body).Decode(&request) != nil {
			t.Error("bad provider request")
		}
		if request["model"] != gradingModel {
			t.Error("unexpected model")
		}
		writeJSON(w, 200, map[string]any{"model": gradingModel, "choices": []any{map[string]any{"message": map[string]any{"content": *reply}}}, "usage": map[string]any{"prompt_tokens": 10, "completion_tokens": 20, "cost": 0.001}})
	}))
	t.Cleanup(provider.Close)
	g := &Grading{server: s, catalog: Catalog{Version: "test-v1", Exercises: map[string]json.RawMessage{"logic-1": json.RawMessage(`{"question":"Is 7+5=12 a proposition? Explain.","answer":"Yes, a true proposition."}`)}}, key: "synthetic-key", endpoint: provider.URL, client: provider.Client()}
	s.grading = g
	return g
}

func TestGradingRestartRecoveryAndBackup(t *testing.T) {
	reply := `{"verdict":"correct","feedback":"Accepted synthetic work.","issue":"","improvement":"","transcription":""}`
	g := graderFixture(t, &reply)
	a := submission()
	if _, _, e := g.submit(a); e != nil {
		t.Fatal(e)
	}
	g.server.db.Exec("UPDATE grading_jobs SET status='running' WHERE attempt=?", a.ID)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan struct{})
	go func() { defer close(done); g.run(ctx) }()
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		v, _ := loadAttempt(g.server.db, a.ID)
		if v.Verdict == "correct" {
			break
		}
		time.Sleep(50 * time.Millisecond)
	}
	cancel()
	<-done
	v, _ := loadAttempt(g.server.db, a.ID)
	if v.Verdict != "correct" {
		t.Fatal("stranded running job")
	}
	backup := filepath.Join(t.TempDir(), "backup.db")
	if _, e := g.server.db.Exec("VACUUM INTO ?", backup); e != nil {
		t.Fatal(e)
	}
	db, e := openDB(backup)
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	restored, e := loadAttempt(db, a.ID)
	if e != nil || restored.Text != a.Text || len(restored.Grades) != 1 || restored.Verdict != "correct" {
		t.Fatal("backup lost attempt or grade", e)
	}
}
func submission() Submission {
	return Submission{ID: newID(), Exercise: "logic-1", Submitted: time.Now().UnixMilli(), ContentVersion: "test-v1", Mode: "type", Text: "Yes. It is a declarative statement with a definite truth value, true.", Images: []string{}}
}
func TestGradingImmutableAttemptsRechecksAndLock(t *testing.T) {
	reply := `{"verdict":"incorrect","feedback":"Explain why it has a truth value.","issue":"Missing justification","improvement":"","transcription":""}`
	g := graderFixture(t, &reply)
	a := submission()
	if _, code, e := g.submit(a); e != nil || code != 201 {
		t.Fatal(code, e)
	}
	if _, code, e := g.submit(a); e != nil || code != 200 {
		t.Fatal("retry not idempotent", code, e)
	}
	changed := a
	changed.Text = "changed"
	if _, code, _ := g.submit(changed); code != 409 {
		t.Fatal("mutable attempt")
	}
	if _, code, _ := g.submit(submission()); code != 409 {
		t.Fatal("allowed two pending attempts")
	}
	g.step(context.Background())
	first, _ := loadAttempt(g.server.db, a.ID)
	if first.Verdict != "incorrect" || len(first.Grades) != 1 {
		t.Fatalf("%+v", first)
	}
	reply = `{"verdict":"correct","feedback":"You identified a declarative statement and explained its truth value.","issue":"","improvement":"","transcription":""}`
	b := submission()
	b.Submitted++
	if _, _, e := g.submit(b); e != nil {
		t.Fatal(e)
	}
	g.step(context.Background())
	if _, code, _ := g.submit(submission()); code != 409 {
		t.Fatal("correct exercise not locked")
	}
	recheck := newID()
	reason := "The response was misread."
	if e := g.recheck(b.ID, recheck, reason); e != nil {
		t.Fatal(e)
	}
	if e := g.recheck(b.ID, recheck, reason); e != nil {
		t.Fatal("recheck retry", e)
	}
	reply = `{"verdict":"incorrect","feedback":"The justification is missing.","issue":"","improvement":"","transcription":""}`
	g.step(context.Background())
	updated, _ := loadAttempt(g.server.db, b.ID)
	if updated.Text != b.Text || len(updated.Grades) != 2 || updated.Verdict != "incorrect" || updated.Grades[1].Reason != reason {
		t.Fatalf("recheck lost history %+v", updated)
	}
	if _, _, e := g.submit(submission()); e != nil {
		t.Fatal("did not unlock", e)
	}
	r, e := record(g.server.db, "attempt/"+b.ID)
	if e != nil || len(r.Payload) == 0 {
		t.Fatal("missing change stream record", e)
	}
}
func TestGradingUnreadableAndInvalidResponsesAreNotIncorrect(t *testing.T) {
	reply := `{"verdict":"not_graded","feedback":"I cannot distinguish the handwritten variable.","issue":"","improvement":"","transcription":"[unclear]"}`
	g := graderFixture(t, &reply)
	a := submission()
	g.submit(a)
	g.step(context.Background())
	result, _ := loadAttempt(g.server.db, a.ID)
	if result.Status != "not_graded" || result.Verdict != "" {
		t.Fatal("unreadable marked incorrect")
	}
	if e := g.recheck(a.ID, newID(), "Please inspect the variable again."); e != nil {
		t.Fatal(e)
	}
	reply = "not JSON"
	for i := 0; i < 3; i++ {
		g.server.db.Exec("UPDATE grading_jobs SET next=0")
		g.step(context.Background())
	}
	result, _ = loadAttempt(g.server.db, a.ID)
	if result.Status != "error" || result.Verdict != "" || len(result.Grades) != 1 {
		t.Fatalf("provider failure lost result %+v", result)
	}
}
func TestGradingConcurrentSubmissionsAndCatalogValidation(t *testing.T) {
	reply := `{}`
	g := graderFixture(t, &reply)
	a := submission()
	a.ContentVersion = "wrong"
	if _, code, _ := g.submit(a); code != 409 {
		t.Fatal("accepted mismatched catalog")
	}
	var wg sync.WaitGroup
	var mu sync.Mutex
	accepted := 0
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, code, e := g.submit(submission())
			if e == nil && code == 201 {
				mu.Lock()
				accepted++
				mu.Unlock()
			}
		}()
	}
	wg.Wait()
	if accepted != 1 {
		t.Fatalf("accepted %d concurrent submissions", accepted)
	}
}
