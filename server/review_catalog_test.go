package main

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"
)

// CI builds the real catalog before Go tests. Keep standalone Go development
// possible, while exercising the TypeScript-authoring/Go-grading boundary there.
func TestPublishedReviewCatalogPlanningAndDeterministicGrading(t *testing.T) {
	raw, err := os.ReadFile("../output/grading-catalog.json")
	if os.IsNotExist(err) {
		t.Skip("run npm run content to test the published catalog")
	}
	if err != nil {
		t.Fatal(err)
	}
	g := reviewFixture(t)
	if err = json.Unmarshal(raw, &g.catalog); err != nil {
		t.Fatal(err)
	}
	now := time.Now().UnixMilli()
	session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Lesson: "predicates-and-quantifiers", Concept: "existential-quantification", Skill: "interpret"}, now)
	if err != nil {
		t.Fatal(err)
	}
	var instance *ReviewInstance
	for i := range session.Instances {
		if session.Instances[i].Context.TemplateID == "integer-witness-selection" {
			instance = &session.Instances[i]
		}
	}
	if instance == nil {
		t.Fatal("published generated witness template missing from focused Quick practice")
	}
	if strings.Contains(string(instance.Teaching), "{{") || len(instance.Analytics) == 0 || instance.SourceTarget != "review:integer-witness-selection" {
		t.Fatal("published instance lost generation, evidence, or source metadata")
	}
	params := instance.Context.Parameters
	if params["witness"]+params["a"] != params["sum"] {
		t.Fatal("generated witness does not satisfy the question")
	}
	var teaching struct{ Choice ChoiceAssessment }
	if err = json.Unmarshal(instance.Teaching, &teaching); err != nil {
		t.Fatal(err)
	}
	answer := ""
	for _, option := range teaching.Choice.Options {
		if option.ID == teaching.Choice.CorrectOption {
			answer = option.Text
		}
	}
	a, _, err := g.submit(Submission{ID: newID(), Exercise: instance.Exercise, Submitted: now + 1000, ContentVersion: instance.ContentVersion, Mode: "choice", ChoiceID: teaching.Choice.CorrectOption, Text: answer, Review: &instance.Context})
	if err != nil || a.Verdict != "correct" || len(a.Grades) != 1 || a.Grades[0].Model != "deterministic" {
		t.Fatalf("published review grading: %+v %v", a, err)
	}
	var jobs int
	if err = g.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&jobs); err != nil || jobs != 0 {
		t.Fatalf("deterministic review queued provider work: %d %v", jobs, err)
	}
}
