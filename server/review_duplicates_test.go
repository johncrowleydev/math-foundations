package main

import (
	"crypto/sha256"
	"encoding/json"
	"os"
	"reflect"
	"testing"
)

func duplicateReviewTemplate(t *testing.T, g *Grading, id, concept, prompt string) ReviewTemplate {
	t.Helper()
	base := g.catalog.ReviewTemplates[0]
	base.ID = id
	base.Concept = concept
	base.SourceTarget = "exercise:" + id
	base.Analytics, _ = json.Marshal(map[string]any{
		"concepts": []map[string]string{{"concept": concept, "role": "primary"}},
		"skills":   []map[string]string{{"skill": base.Skill, "role": "primary"}},
	})
	raw, _ := json.Marshal(base.Question)
	base.Question = nil
	json.Unmarshal(raw, &base.Question)
	base.Question["prompt"] = prompt
	return base
}

func TestReviewDuplicatesThreeTargets(t *testing.T) {
	g := reviewFixture(t)
	a := duplicateReviewTemplate(t, g, "first", "a", "Evaluate exclusive OR.")
	b := duplicateReviewTemplate(t, g, "second", "b", "Evaluate exclusive OR.")
	c := duplicateReviewTemplate(t, g, "third", "c", "Evaluate exclusive OR.")
	g.catalog.ReviewTemplates = []ReviewTemplate{a, b, c}
	session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
	if err != nil || len(session.Instances) != 1 {
		t.Fatalf("three equivalent targets should present one question; got %d, %v", len(session.Instances), err)
	}
}

func TestReviewDuplicatesStructuredInputs(t *testing.T) {
	for _, variation := range []string{"hidden IDs and option order", "input label", "grid columns", "grid given value"} {
		t.Run(variation, func(t *testing.T) {
			g := reviewFixture(t)
			a := duplicateReviewTemplate(t, g, "first", "a", "Choose the relationship and assignment.")
			b := duplicateReviewTemplate(t, g, "second", "b", "Choose the relationship and assignment.")
			assessment := func() *Assessment {
				v := deterministicFixture(t)
				v.Inputs = []AssessmentInput{
					{ID: "relationship", Kind: "select", Label: "Relationship", Options: []AssessmentOption{{ID: "xor", Label: "Exactly one is true"}, {ID: "both", Label: "Both are true"}}},
					{ID: "assignment", Kind: "grid", Label: "Assignment", Columns: []string{"p", "q"}, Rows: []AssessmentRow{{Cells: []AssessmentCell{{ID: "p", Kind: "boolean"}, {ID: "q", Kind: "boolean"}}}}},
				}
				return v
			}
			aa, ab := assessment(), assessment()
			ab.Inputs[0].ID = "renamed-relationship"
			ab.Inputs[0].Options = []AssessmentOption{{ID: "renamed-both", Label: "Both are true"}, {ID: "renamed-xor", Label: "Exactly one is true"}}
			ab.Inputs[1].ID = "renamed-assignment"
			ab.Inputs[1].Rows[0].Cells[0].ID = "renamed-p"
			ab.Inputs[1].Rows[0].Cells[1].ID = "renamed-q"
			ab.Feedback.Correct = "Different hidden feedback"
			want := 2
			switch variation {
			case "hidden IDs and option order":
				want = 1
			case "input label":
				ab.Inputs[0].Label = "Different relationship"
			case "grid columns":
				ab.Inputs[1].Columns = []string{"r", "s"}
			case "grid given value":
				ab.Inputs[1].Rows[0].Cells[0].Given = json.RawMessage(`true`)
			}
			delete(a.Question, "choice")
			delete(b.Question, "choice")
			a.Question["assessment"], b.Question["assessment"] = aa, ab
			g.catalog.ReviewTemplates = []ReviewTemplate{a, b}
			session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
			if err != nil || len(session.Instances) != want {
				t.Fatalf("structured variation %s produced %d questions; want %d, error %v", variation, len(session.Instances), want, err)
			}
		})
	}
}

func TestReviewDuplicatesPublishedExclusiveOR(t *testing.T) {
	raw, err := os.ReadFile("../output/grading-catalog.json")
	if os.IsNotExist(err) {
		t.Skip("run npm run content to test the published catalog")
	}
	if err != nil {
		t.Fatal(err)
	}
	g := reviewFixture(t)
	if err := json.Unmarshal(raw, &g.catalog); err != nil {
		t.Fatal(err)
	}
	const exercise = "propositional-logic-146"
	original, ok := g.catalog.Exercises[exercise]
	if !ok {
		t.Fatal("published exclusive OR exercise missing")
	}
	g.catalog.Exercises = map[string]json.RawMessage{exercise: original}
	g.catalog.ReviewTemplates = nil
	templates := g.reviewTemplates()
	if len(templates) != 4 {
		t.Fatalf("expected XOR's two concepts by two skills, got %d target mappings", len(templates))
	}
	session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Lesson: "propositional-logic"}, reviewDay)
	if err != nil || len(session.Instances) != 1 {
		t.Fatalf("published XOR repeated across target mappings: got %d questions, %v", len(session.Instances), err)
	}
	instance := session.Instances[0]
	assessment := assessmentFromQuestion(instance.Question)
	if instance.SourceTarget != "exercise:"+exercise || assessment == nil || len(assessment.Inputs) != 2 || assessment.Inputs[0].Kind != "select" || assessment.Inputs[1].Kind != "grid" || len(assessment.Inputs[0].Options) != 4 || !reflect.DeepEqual(assessment.Inputs[1].Columns, []string{"p", "q"}) {
		t.Fatal("deduplicating published XOR lost its source, relationship choices, or assignment grid")
	}
}

func TestReviewDuplicatesSameSourceAcrossTargets(t *testing.T) {
	for _, kind := range []string{"scheduled-review", "focused-practice"} {
		for _, mode := range []string{"quick", "regular"} {
			t.Run(kind+"/"+mode, func(t *testing.T) {
				g := reviewFixture(t)
				a := duplicateReviewTemplate(t, g, "xor-construct", "a-connectives", "Give a satisfying assignment for exclusive OR.")
				b := duplicateReviewTemplate(t, g, "xor-interpret", "b-models", "Give a satisfying assignment for exclusive OR.")
				b.SourceTarget = a.SourceTarget
				g.catalog.ReviewTemplates = []ReviewTemplate{a, b}
				if kind == "scheduled-review" {
					for _, template := range g.catalog.ReviewTemplates {
						storeReviewAttempt(t, g, template.SourceTarget, reviewDay, "correct", template.Analytics, nil)
					}
				}
				_, before := summaryStates(t, g, 10*reviewDay)
				session, err := g.planReview(ReviewSessionRequest{Kind: kind, Mode: mode}, 10*reviewDay)
				if err != nil {
					t.Fatal(err)
				}
				if len(session.Instances) != 1 {
					t.Fatalf("same source appeared %d times across concept targets", len(session.Instances))
				}
				_, after := summaryStates(t, g, 10*reviewDay)
				if kind == "scheduled-review" && !reflect.DeepEqual(before, after) {
					t.Fatal("planning duplicate-free review changed due states")
				}
				if kind == "focused-practice" && len(after) != 1 {
					t.Fatalf("skipped duplicate activated an unpresented target: %+v", after)
				}
				instance := session.Instances[0]
				storeReviewAttempt(t, g, instance.Exercise, 10*reviewDay, "correct", instance.Analytics, &instance.Context)
				_, after = summaryStates(t, g, 10*reviewDay)
				if kind == "scheduled-review" && !reflect.DeepEqual(before[b.key()], after[b.key()]) {
					t.Fatal("answering the presented target cleared the skipped target's due state")
				}
			})
		}
	}
}

func TestReviewDuplicatesIgnoreHiddenMetadataAndChoiceOrdering(t *testing.T) {
	g := reviewFixture(t)
	a := duplicateReviewTemplate(t, g, "first", "a", "Find a [satisfying assignment](ref:satisfiability).")
	b := duplicateReviewTemplate(t, g, "second", "b", "Find a satisfying   assignment.")
	b.Question["id"] = 99
	b.Question["section"] = "another section"
	b.Question["answer"] = "A differently worded explanation"
	b.Question["choice"] = map[string]any{"correctOption": "positive", "options": []map[string]string{
		{"id": "negative", "text": "No", "feedback": "Different feedback"},
		{"id": "positive", "text": "Yes", "feedback": "Different correct feedback"},
	}}
	g.catalog.ReviewTemplates = []ReviewTemplate{a, b}
	session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
	if err != nil {
		t.Fatal(err)
	}
	if len(session.Instances) != 1 {
		t.Fatalf("identical visible questions survived under different source/template IDs: %d", len(session.Instances))
	}
}

func TestReviewDuplicatesTryAlternativeCandidate(t *testing.T) {
	g := reviewFixture(t)
	a := duplicateReviewTemplate(t, g, "first", "a", "Evaluate exclusive OR.")
	b := duplicateReviewTemplate(t, g, "duplicate", "b", "Evaluate exclusive OR.")
	c := duplicateReviewTemplate(t, g, "alternative", "b", "Evaluate conjunction.")
	g.catalog.ReviewTemplates = []ReviewTemplate{a, b, c}
	for n := 0; n < 64; n++ {
		session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
		if err != nil {
			t.Fatal(err)
		}
		if len(session.Instances) != 2 || session.Instances[1].Context.TemplateID != c.ID {
			t.Fatal("did not retain target using its unique alternative")
		}
		hash := sha256.Sum256([]byte(session.ID + ":" + b.key()))
		if int(hash[0])%2 == 1 {
			return // The duplicate was preferred, so this exercised candidate scanning.
		}
	}
	t.Fatal("never exercised a duplicate preferred candidate")
}

func TestReviewDuplicatesKeepDistinctVisibleQuestions(t *testing.T) {
	for _, field := range []string{"prompt", "instructions", "math", "table", "choice", "assessment"} {
		t.Run(field, func(t *testing.T) {
			g := reviewFixture(t)
			a := duplicateReviewTemplate(t, g, "first", "a", "Evaluate this expression.")
			b := duplicateReviewTemplate(t, g, "second", "b", "Evaluate this expression.")
			switch field {
			case "table":
				b.Question[field] = map[string]any{"headers": []string{"p", "q"}, "rows": [][]string{{"T", "F"}}}
			case "choice":
				b.Question[field] = map[string]any{"correctOption": "yes", "options": []map[string]string{{"id": "yes", "text": "Always true"}, {"id": "no", "text": "Always false"}}}
			case "assessment":
				delete(b.Question, "choice")
				b.Question[field] = deterministicFixture(t)
			default:
				b.Question[field] = "A distinct mathematical task: p \\land q"
			}
			g.catalog.ReviewTemplates = []ReviewTemplate{a, b}
			session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
			if err != nil {
				t.Fatal(err)
			}
			if len(session.Instances) != 2 {
				t.Fatalf("distinct %s was incorrectly deduplicated", field)
			}
		})
	}
}

func TestReviewDuplicatesStayWithinFocusedScope(t *testing.T) {
	g := reviewFixture(t)
	a := duplicateReviewTemplate(t, g, "first", "a", "Evaluate exclusive OR.")
	b := duplicateReviewTemplate(t, g, "second", "b", "Evaluate exclusive OR.")
	g.catalog.ReviewTemplates = []ReviewTemplate{a, b}
	for _, concept := range []string{"a", "b"} {
		session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Concept: concept}, reviewDay)
		if err != nil || len(session.Instances) != 1 || session.Instances[0].Context.Concept != concept {
			t.Fatalf("deduplication crossed focused session scope: %+v, %v", session, err)
		}
	}
}
