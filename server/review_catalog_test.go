package main

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"
)

func TestReviewLessonLocationIsSeparateFromExerciseIdentity(t *testing.T) {
	g := reviewFixture(t)
	g.catalog.ReviewTemplates = nil
	g.catalog.Exercises = map[string]json.RawMessage{
		"linear-algebra-bases-41": json.RawMessage(`{
			"lesson":"Rank, Nullity, Determinants, and Inverses",
			"lessonSlug":"linear-algebra-rank-inverses",
			"question":{"prompt":"Name the dimension of the null space.","officialAnswer":"Nullity"},
			"analytics":{"concepts":[{"concept":"nullity","role":"primary"}],"skills":[{"skill":"recall","role":"primary"}]}
		}`),
		"legacy-2": json.RawMessage(`{
			"lesson":"Legacy","question":{"prompt":"Recall a definition.","officialAnswer":"A definition"},
			"analytics":{"concepts":[{"concept":"legacy","role":"primary"}],"skills":[{"skill":"recall","role":"primary"}]}
		}`),
	}
	catalog := g.reviewCatalog()
	if len(catalog.Items) != 2 {
		t.Fatalf("effective templates: %d", len(catalog.Items))
	}
	for _, item := range catalog.Items {
		if item.Concept == "legacy" {
			if item.Lesson != "legacy" {
				t.Fatal("older catalog lost namespace fallback")
			}
			continue
		}
		if item.Lesson != "linear-algebra-rank-inverses" || item.Origin != "lesson:linear-algebra-rank-inverses" || item.OriginalExercise != "linear-algebra-bases-41" || item.SourceTarget != "exercise:linear-algebra-bases-41" || item.ID != "exercise-linear-algebra-bases-41-nullity-recall" {
			t.Fatalf("lesson location changed stable exercise identity: %+v", item)
		}
	}
	now := time.Now().UnixMilli()
	session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular", Lesson: "linear-algebra-rank-inverses"}, now)
	if err != nil || len(session.Instances) != 1 || session.Instances[0].SourceTarget != "exercise:linear-algebra-bases-41" {
		t.Fatalf("practice could not select relocated lesson: %+v %v", session, err)
	}
	oldLesson, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular", Lesson: "linear-algebra-bases"}, now)
	if err != nil || len(oldLesson.Instances) != 0 {
		t.Fatalf("old namespace still acts as lesson location: %+v %v", oldLesson, err)
	}
}

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

func TestPublishedDoubleNegationReviewUsesRecognitionChoices(t *testing.T) {
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
	found := false
	for _, item := range g.reviewCatalog().Items {
		if item.OriginalExercise != "propositional-logic-55" {
			continue
		}
		found = true
		if item.Skill != "recognize" || item.EvidenceLevel != "recognition" {
			t.Fatalf("selecting double negation must not certify written justification: %+v", item)
		}
		if len(item.InputCapabilities) != 1 || item.InputCapabilities[0] != "tap" || item.Question["choice"] == nil {
			t.Fatalf("double negation must offer selectable answers: %+v", item)
		}
		if item.SourceTarget != "exercise:propositional-logic-55" {
			t.Fatalf("double negation lost its stable exercise identity: %+v", item)
		}
	}
	if !found {
		t.Fatal("published double negation exercise missing from review catalog")
	}
}
