package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

type cancelTransport func(*http.Request) (*http.Response, error)

func (f cancelTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestCancelPendingAndStaleRequest(t *testing.T) {
	reply := `{"verdict":"incorrect","feedback":"Try again"}`
	g := graderFixture(t, &reply)
	a := submission()
	g.submit(a)
	if e := g.cancelJob(a.ID, a.ID); e != nil {
		t.Fatal(e)
	}
	v, _ := loadAttempt(g.server.db, a.ID)
	if v.Status != "cancelled" || v.Text != a.Text || len(v.Grades) != 0 || v.ActiveJob != "" {
		t.Fatal("cancel lost attempt", v.Status)
	}
	if g.step(context.Background()) {
		t.Fatal("cancelled job ran")
	}
	job := newID()
	if e := g.recheck(a.ID, job, ""); e != nil {
		t.Fatal(e)
	}
	g.cancelJob(a.ID, a.ID)
	v, _ = loadAttempt(g.server.db, a.ID)
	if v.ActiveJob != job || v.Status != "pending" {
		t.Fatal("stale cancel affected retry")
	}
	g.step(context.Background())
	v, _ = loadAttempt(g.server.db, a.ID)
	if len(v.Grades) != 1 {
		t.Fatal("retry failed")
	}
	job = newID()
	g.recheck(a.ID, job, "Please reconsider.")
	g.cancelJob(a.ID, job)
	v, _ = loadAttempt(g.server.db, a.ID)
	if v.Verdict != "incorrect" || len(v.Grades) != 1 {
		t.Fatal("cancelled recheck lost history")
	}
}
func TestCancelActiveStopsRequestWithoutRetry(t *testing.T) {
	reply := `{"verdict":"correct","feedback":"Correct"}`
	g := graderFixture(t, &reply)
	a := submission()
	g.submit(a)
	started := make(chan struct{})
	done := make(chan struct{})
	g.client = &http.Client{Transport: cancelTransport(func(r *http.Request) (*http.Response, error) {
		close(started)
		<-r.Context().Done()
		return nil, r.Context().Err()
	})}
	go func() { g.step(context.Background()); close(done) }()
	select {
	case <-started:
	case <-time.After(time.Second * 3):
		t.Fatal("request did not start")
	}
	if e := g.cancelJob(a.ID, a.ID); e != nil {
		t.Fatal(e)
	}
	select {
	case <-done:
	case <-time.After(time.Second * 3):
		t.Fatal("request not cancelled")
	}
	v, _ := loadAttempt(g.server.db, a.ID)
	if v.Status != "cancelled" || len(v.Grades) != 0 || v.Verdict != "" {
		t.Fatal("cancel changed grade")
	}
	if g.step(context.Background()) {
		t.Fatal("cancelled request retried")
	}
}

func TestCancelledJobDiscardsLateSuccess(t *testing.T) {
	reply := `{"verdict":"correct","feedback":"Correct"}`
	g := graderFixture(t, &reply)
	a := submission()
	g.submit(a)
	started := make(chan struct{})
	release := make(chan struct{})
	done := make(chan struct{})
	g.client = &http.Client{Transport: cancelTransport(func(r *http.Request) (*http.Response, error) {
		close(started)
		<-release
		body, _ := json.Marshal(map[string]any{"choices": []any{map[string]any{"message": map[string]any{"content": v5FixtureReply(reply)}}}})
		return &http.Response{StatusCode: 200, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(string(body)))}, nil
	})}
	go func() { g.step(context.Background()); close(done) }()
	<-started
	g.cancelJob(a.ID, a.ID)
	close(release)
	<-done
	v, _ := loadAttempt(g.server.db, a.ID)
	if v.Status != "cancelled" || len(v.Grades) != 0 {
		t.Fatal("late result overwrote cancellation")
	}
}
