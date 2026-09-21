package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
)

func TestApproximateConformance(t *testing.T) {
	testDeterministicCorpus(t, "../tests/grading/fixtures/approximate-fixtures.json")
}
func TestApproximateDefinitions(t *testing.T) {
	raw, e := os.ReadFile("../tests/grading/fixtures/approximate-definition-cases.json")
	if e != nil {
		t.Fatal(e)
	}
	var cases []struct {
		Name       string
		Assessment json.RawMessage
	}
	if e := json.Unmarshal(raw, &cases); e != nil {
		t.Fatal(e)
	}
	for _, c := range cases {
		t.Run(c.Name, func(t *testing.T) {
			var a Assessment
			if e := json.Unmarshal(c.Assessment, &a); e == nil && validateAssessment(&a) == nil {
				t.Fatal("Invalid approximate definition accepted")
			}
		})
	}
}

func TestApproximateMalformedInputAvoidsAttemptsAndProvider(t *testing.T) {
	raw, e := os.ReadFile("../tests/grading/fixtures/approximate-fixtures.json")
	if e != nil {
		t.Fatal(e)
	}
	var cases []deterministicHTTPFixture
	if e := json.Unmarshal(raw, &cases); e != nil {
		t.Fatal(e)
	}
	calls := atomic.Int64{}
	trap := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		http.Error(w, "Unexpected provider request", 500)
	}))
	defer trap.Close()
	reply := "unused"
	g := graderFixture(t, &reply)
	g.endpoint = trap.URL
	for _, c := range cases {
		if !c.Error {
			continue
		}
		t.Run(c.Name, func(t *testing.T) {
			g.catalog.Exercises["logic-1"] = structuredCatalog(t, &c.Assessment)
			s := structuredSubmission()
			s.Response = c.Response
			if _, code, e := g.submit(s); e == nil || code != 400 {
				t.Fatal("Malformed response did not return input guidance", code, e)
			}
		})
	}
	var attempts, jobs int
	if e := g.server.db.QueryRow("SELECT COUNT(*) FROM attempts").Scan(&attempts); e != nil {
		t.Fatal(e)
	}
	if e := g.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&jobs); e != nil {
		t.Fatal(e)
	}
	if attempts != 0 || jobs != 0 || g.step(context.Background()) || calls.Load() != 0 {
		t.Fatal("Malformed answer created grading work", attempts, jobs, calls.Load())
	}
}
