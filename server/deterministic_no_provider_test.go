package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"sync/atomic"
	"testing"
)

type deterministicHTTPFixture struct {
	Name       string             `json:"name"`
	Assessment Assessment         `json:"assessment"`
	Response   StructuredResponse `json:"response"`
	Verdict    string             `json:"verdict"`
	Error      bool               `json:"error"`
}

// Exercise the actual submission boundary for every active checker family. Each
// family supplies its own complete mathematical answer from the shared corpus;
// invalid notation and wrong answers must remain on the same local-only path.
func TestEveryDeterministicValidatorAvoidsProviderAndJobs(t *testing.T) {
	paths, e := filepath.Glob("../shared/*fixtures.json")
	if e != nil {
		t.Fatal(e)
	}
	correct := map[string]deterministicHTTPFixture{}
	wrong := map[string]deterministicHTTPFixture{}
	for _, path := range paths {
		raw, e := os.ReadFile(path)
		if e != nil {
			t.Fatal(e)
		}
		var cases []deterministicHTTPFixture
		if e = json.Unmarshal(raw, &cases); e != nil {
			t.Fatal(e)
		}
		for _, f := range cases {
			for _, r := range f.Assessment.Requirements {
				if f.Verdict == "correct" {
					if _, ok := correct[r.Validator]; !ok {
						correct[r.Validator] = f
					}
				} else if f.Verdict == "incorrect" || f.Error {
					old, ok := wrong[r.Validator]
					if !ok || old.Error && !f.Error {
						wrong[r.Validator] = f
					}
				}
			}
		}
	}
	active := []string{"asymptotic-bound", "binomial-sum", "boolean", "boolean-formula", "boolean-model", "boolean-property", "composition", "elementary-expression", "exact", "expression", "finite-map", "finite-relation", "graph", "indexed-expression", "inequality", "integer-class", "integer-list", "interval", "linear", "matrix", "nested-object", "quantified-formula", "recurrence", "selection", "sequence-pair", "set", "set-expression", "set-model", "square-inverse", "summation", "term", "tuple", "witness"}
	if len(correct) != len(active) {
		t.Fatalf("Update provider-trap coverage for checker families: corpus=%d active=%d", len(correct), len(active))
	}
	sort.Strings(active)
	for _, validator := range active {
		t.Run(validator, func(t *testing.T) {
			good, ok := correct[validator]
			if !ok {
				t.Fatal("No correct corpus fixture")
			}
			bad, ok := wrong[validator]
			if !ok {
				t.Fatal("No incorrect or invalid corpus fixture")
			}
			calls := atomic.Int64{}
			trap := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				calls.Add(1)
				http.Error(w, "A deterministic path reached the provider", 500)
			}))
			defer trap.Close()
			reply := "unused"
			g := graderFixture(t, &reply)
			g.endpoint = trap.URL
			g.key = "synthetic-provider-key"
			assertNoProvider := func(grading *Grading) {
				t.Helper()
				var jobs int
				if e := grading.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&jobs); e != nil {
					t.Fatal(e)
				}
				if jobs != 0 || grading.step(context.Background()) || calls.Load() != 0 {
					t.Fatalf("provider work: jobs=%d calls=%d", jobs, calls.Load())
				}
			}
			g.catalog.Exercises["logic-1"] = structuredCatalog(t, &bad.Assessment)
			s := structuredSubmission()
			s.Response = bad.Response
			got, code, e := g.submit(s)
			if bad.Error {
				if e == nil || code != 400 {
					t.Fatalf("Invalid corpus response: status=%d err=%v", code, e)
				}
				var attempts int
				g.server.db.QueryRow("SELECT COUNT(*) FROM attempts").Scan(&attempts)
				if attempts != 0 {
					t.Fatal("Invalid response created an attempt")
				}
			} else {
				if e != nil || code != 201 || got.Verdict != "incorrect" {
					t.Fatalf("Wrong corpus response: status=%d verdict=%s err=%v", code, got.Verdict, e)
				}
				duplicate, code, e := g.submit(s)
				if e != nil || code != 200 || duplicate.ID != got.ID {
					t.Fatal("Duplicate changed immutable attempt", code, e)
				}
				if e := g.recheck(got.ID, newID(), "Please reconsider"); e == nil {
					t.Fatal("Wrong deterministic answer accepted provider recheck")
				}
			}
			assertNoProvider(g)
			g.catalog.Exercises["logic-1"] = structuredCatalog(t, &good.Assessment)
			s = structuredSubmission()
			s.Response = StructuredResponse{}
			if _, code, e := g.submit(s); e == nil || code != 400 {
				t.Fatal("Incomplete response escaped input validation", code, e)
			}
			s.Response = good.Response
			s.Submitted++
			got, code, e = g.submit(s)
			if e != nil || code != 201 || got.Verdict != "correct" || len(got.Grades) != 1 || got.Grades[0].Model != "deterministic" {
				t.Fatalf("Correct response: status=%d verdict=%s err=%v", code, got.Verdict, e)
			}
			duplicate, code, e := g.submit(s)
			if e != nil || code != 200 || duplicate.ID != got.ID {
				t.Fatal("Correct duplicate changed immutable attempt", code, e)
			}
			if e := g.recheck(got.ID, newID(), "Please reconsider"); e == nil {
				t.Fatal("Correct answer accepted provider recheck")
			}
			if _, e := g.evaluate(context.Background(), got, string(g.catalog.Exercises["logic-1"]), ""); e == nil {
				t.Fatal("Worker bypass accepted deterministic attempt")
			}
			// Catalog context must also block a forged legacy mode before any request.
			forged := got
			forged.Mode = "type"
			forged.Response = nil
			if _, e := g.evaluate(context.Background(), forged, string(g.catalog.Exercises["logic-1"]), ""); e == nil {
				t.Fatal("Trusted checker context permitted provider fallback")
			}
			assertNoProvider(g)
			// Frozen Review questions and their checker remain usable after catalog
			// replacement; restoring that history must not create provider work either.
			review := reviewFixture(t)
			review.endpoint = trap.URL
			review.key = ""
			template := structuredTemplate(t, review, good.Assessment.Evidence.Level)
			template.Question["assessment"] = &good.Assessment
			review.catalog.ReviewTemplates = []ReviewTemplate{template}
			session, e := review.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
			if e != nil || len(session.Instances) != 1 {
				t.Fatal("Review plan", e, len(session.Instances))
			}
			instance := session.Instances[0]
			s = structuredSubmission()
			s.Exercise = instance.Exercise
			s.Review = &instance.Context
			s.ContentVersion = instance.ContentVersion
			s.Submitted = reviewDay + 1
			s.Response = good.Response
			saved, code, e := review.submit(s)
			if e != nil || code != 201 || saved.Verdict != "correct" {
				t.Fatal("Frozen Review submission", code, e)
			}
			assertNoProvider(review)
			archived := reviewFixture(t)
			archived.endpoint = trap.URL
			archived.key = ""
			archived.catalog.Version = "future-catalog"
			raw, _ := json.Marshal(instance)
			records := []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}
			if e := archived.importReview(ReviewImport{Records: records, Attempts: []Attempt{saved}}); e != nil {
				t.Fatal("Archived Review restoration", e)
			}
			restored, e := loadAttempt(archived.server.db, saved.ID)
			if e != nil || restored.Presentation == nil || restored.Presentation.Assessment == nil {
				t.Fatal("Restore lost frozen checker", e)
			}
			if e := archived.recheck(saved.ID, newID(), "Please reconsider"); e == nil {
				t.Fatal("Restored checker accepted provider recheck")
			}
			assertNoProvider(archived)
		})
	}
}

func TestInvalidDeterministicDefinitions(t *testing.T) {
	raw, e := os.ReadFile("../shared/deterministic-definition-cases.json")
	if e != nil {
		t.Fatal(e)
	}
	var cases []struct {
		Name       string          `json:"name"`
		Assessment json.RawMessage `json:"assessment"`
	}
	if e = json.Unmarshal(raw, &cases); e != nil {
		t.Fatal(e)
	}
	for _, c := range cases {
		t.Run(c.Name, func(t *testing.T) {
			var a Assessment
			if e := json.Unmarshal(c.Assessment, &a); e == nil && validateAssessment(&a) == nil {
				t.Fatal("Invalid authored checker accepted")
			}
		})
	}
}
