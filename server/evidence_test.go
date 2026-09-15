package main

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
)

// Existing lifecycle tests use terse mock results. Supply the new mandatory
// fields, without making malformed verdict/feedback mocks valid.
func v5FixtureReply(s string) string {
	var v map[string]any
	if json.Unmarshal([]byte(s), &v) != nil {
		return s
	}
	v["requirements"] = []Requirement{{ID: "answer", Description: "Answer the stated question", Satisfied: v["verdict"] == "correct"}}
	v["diagnosis"] = []Diagnosis{}
	for _, k := range []string{"issue", "improvement", "transcription"} {
		if _, ok := v[k]; !ok {
			v[k] = ""
		}
	}
	v["confidence"] = "high"
	v["notGradedReason"] = ""
	if v["verdict"] == "not_graded" {
		v["notGradedReason"] = "unreadable"
	}
	b, _ := json.Marshal(v)
	return string(b)
}
func TestGradeEvidenceValidation(t *testing.T) {
	if _, e := parseV5Grade(`{"verdict":"correct","feedback":"Accepted"}`); e == nil {
		t.Fatal("Missing mandatory v5 fields")
	}
	if _, e := parseV5Grade(v5FixtureReply(`{"verdict":"correct","feedback":"Accepted","issue":"","improvement":"","transcription":""}`)); e != nil {
		t.Fatal(e)
	}
	var g Grade
	json.Unmarshal([]byte(v5FixtureReply(`{"verdict":"correct"}`)), &g)
	if e := validateGradeEvidence(g); e != nil {
		t.Fatal(e)
	}
	g.Requirements[0].Satisfied = false
	if validateGradeEvidence(g) == nil {
		t.Fatal("accepted inconsistent verdict")
	}
	g.Requirements[0].Satisfied = true
	g.Diagnosis = []Diagnosis{{Class: "conceptual", Severity: "substantive"}}
	if validateGradeEvidence(g) == nil {
		t.Fatal("invented error on correct response")
	}
	g.Verdict = "not_graded"
	g.Diagnosis = nil
	if validateGradeEvidence(g) == nil {
		t.Fatal("missing reason")
	}
	g.NotGradedReason = "ambiguous-problem"
	if e := validateGradeEvidence(g); e != nil {
		t.Fatal(e)
	}
	g.Confidence = "83%"
	if validateGradeEvidence(g) == nil {
		t.Fatal("numeric confidence")
	}
	var legacy Grade
	if e := json.Unmarshal([]byte(`{"verdict":"correct","feedback":"Accepted"}`), &legacy); e != nil {
		t.Fatal(e)
	}
}
func TestEvidenceSnapshotAndEffortRoundTrip(t *testing.T) {
	reply := `{"verdict":"correct","feedback":"Accepted"}`
	g := graderFixture(t, &reply)
	g.catalog.Exercises["logic-1"] = json.RawMessage(`{"question":{"prompt":"Answer"},"analytics":{"version":"v1","concepts":[{"concept":"generic","role":"primary"}]}}`)
	a := submission()
	start := a.Submitted - 5000
	duration := int64(3000)
	a.StartedAt = &start
	a.ActiveDurationMs = &duration
	a.Unsure = new(bool)
	*a.Unsure = true
	a.Assistance = &Assistance{CopiedFromRetry: true}
	if _, _, e := g.submit(a); e != nil {
		t.Fatal(e)
	}
	g.catalog.Exercises["logic-1"] = json.RawMessage(`{"analytics":{"version":"v2"}}`)
	saved, e := loadAttempt(g.server.db, a.ID)
	if e != nil || !strings.Contains(string(saved.Analytics), "v1") || saved.StartedAt == nil || *saved.ActiveDurationMs != 3000 || !saved.Assistance.CopiedFromRetry {
		t.Fatalf("Snapshot lost: %+v %v", saved, e)
	}
	if _, _, e := g.submit(a); e != nil {
		t.Fatal("idempotent retry", e)
	}
	g.step(context.Background())
	saved, _ = loadAttempt(g.server.db, a.ID)
	if len(saved.Grades) != 1 || saved.Grades[0].Confidence != "high" {
		t.Fatal("lost structured grade")
	}
}
func TestPromptV5Policies(t *testing.T) {
	for _, p := range []string{"Determine the mathematical verdict first", "missing-requested-justification", "false intermediate equality", "ambiguous-problem", "GRADING DECISION"} {
		if !strings.Contains(evidenceInstruction, p) {
			t.Fatal("Missing policy", p)
		}
	}
	for _, p := range []string{"historical context, not evidence", "fresh mathematical evaluation", "new verdict plainly"} {
		if !strings.Contains(recheckEvidenceInstruction, p) {
			t.Fatal("Missing recheck policy", p)
		}
	}
	if promptVersion != "foundations-grading-5" {
		t.Fatal(promptVersion)
	}
}

func TestBackfillMatchesOriginalTaskAndIsIdempotent(t *testing.T) {
	reply := `{"verdict":"correct","feedback":"Accepted"}`
	g := graderFixture(t, &reply)
	g.catalog.Exercises["logic-1"] = json.RawMessage(`{"question":{"prompt":"Evaluate x+1 at x=2"}}`)
	a := submission()
	if _, _, e := g.submit(a); e != nil {
		t.Fatal(e)
	}
	g.catalog.Exercises["logic-1"] = json.RawMessage(`{"question":{"prompt":"Evaluate x+1 at x=2"},"analytics":{"version":"one","concepts":[]}}`)
	if e := g.backfillEvidence(); e != nil {
		t.Fatal(e)
	}
	saved, _ := loadAttempt(g.server.db, a.ID)
	if !strings.Contains(string(saved.Analytics), "historical-backfill") {
		t.Fatal("Missing labeled backfill")
	}
	var before, after int
	g.server.db.QueryRow("SELECT count(*) FROM changes").Scan(&before)
	g.backfillEvidence()
	g.server.db.QueryRow("SELECT count(*) FROM changes").Scan(&after)
	if before != after {
		t.Fatal("Repeated backfill emitted another change")
	}
	g.catalog.Exercises["logic-2"] = json.RawMessage(`{"question":{"prompt":"Different task"}}`)
	b := submission()
	b.Exercise = "logic-2"
	if _, _, e := g.submit(b); e != nil {
		t.Fatal(e)
	}
	g.catalog.Exercises["logic-2"] = json.RawMessage(`{"question":{"prompt":"Evaluate x+1 at x=2"},"analytics":{"version":"one"}}`)
	g.backfillEvidence()
	saved, _ = loadAttempt(g.server.db, b.ID)
	if len(saved.Analytics) > 0 {
		t.Fatal("Changed task was backfilled")
	}
}
