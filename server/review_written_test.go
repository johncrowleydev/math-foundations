package main

import (
	"context"
	"encoding/json"
	"reflect"
	"strings"
	"testing"
)

func TestReviewWrittenQuestionRestoresHistoricalTargets(t *testing.T) {
	for _, skill := range []string{"justify", "analyze", "recall"} {
		t.Run(skill, func(t *testing.T) {
			reply := `{"verdict":"correct","feedback":"Accepted synthetic work.","issue":"","improvement":"","transcription":""}`
			g := graderFixture(t, &reply)
			original := map[string]any{"instructions": "Write your explanation.", "prompt": "Explain this synthetic relationship.", "officialAnswer": "Original written explanation.", "table": map[string]any{"columns": []string{"p"}, "rows": 2}}
			meta := map[string]any{"concepts": []map[string]string{{"concept": "logic", "role": "primary"}}, "skills": []map[string]string{{"skill": skill, "role": "primary"}}, "attributes": map[string]any{"responseFormat": "open", "preserved": true}}
			item := map[string]any{"lesson": "Synthetic lesson", "lessonSlug": "lesson", "question": original, "analytics": meta, "teaching": []map[string]string{{"title": "Synthetic context", "markdown": "Context for original work."}}}
			publish := func() {
				raw, _ := json.Marshal(item)
				g.catalog.Exercises = map[string]json.RawMessage{"lesson-1": raw}
			}
			publish()
			analytics, _ := json.Marshal(meta)
			historical := storeReviewAttempt(t, g, "lesson-1", reviewDay, "correct", analytics, nil)
			_, initial := summaryStates(t, g, 10*reviewDay)
			key := "logic:" + skill + ":"
			baseline := initial[key]
			if baseline.DueAt == 0 {
				t.Fatal("historical review was not activated")
			}

			assessment := deterministicFixture(t)
			assessment.Evidence.Level = "recognition"
			item["assessment"], item["category"] = assessment, "multiple-choice"
			item["question"] = map[string]any{"instructions": "Choose the relationship.", "prompt": "Select the synthetic answer.", "officialAnswer": "Converted selection."}
			meta["attributes"] = map[string]any{"responseFormat": "structured", "evidenceLevel": "recognition", "interactionCost": "low", "preserved": true}
			publish()
			_, missing := summaryStates(t, g, 10*reviewDay)
			if !strings.Contains(missing[key].Reason, "no compatible question") || missing[key].DueAt != baseline.DueAt {
				t.Fatalf("expected retained blocked state: %+v", missing[key])
			}

			item["reviewQuestion"] = original
			publish()
			_, restored := summaryStates(t, g, 10*reviewDay)
			if !reflect.DeepEqual(restored[key], baseline) {
				t.Fatalf("restoration changed history: got %+v, want %+v", restored[key], baseline)
			}
			session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, 10*reviewDay)
			if err != nil || len(session.Instances) != 1 {
				t.Fatalf("restored question unavailable: %+v, %v", session, err)
			}
			instance := session.Instances[0]
			if !strings.HasSuffix(instance.Context.TemplateID, "-written") || instance.SourceTarget != "exercise:lesson-1" || instance.Question["prompt"] != original["prompt"] || instance.Question["answer"] != original["officialAnswer"] || instance.Question["table"] == nil || instance.Question["assessment"] != nil || instance.Question["choice"] != nil || instance.Category == "multiple-choice" {
				t.Fatalf("restored wrong representation: %+v", instance)
			}
			var frozen map[string]any
			json.Unmarshal(instance.Teaching, &frozen)
			attributes := frozen["analytics"].(map[string]any)["attributes"].(map[string]any)
			if frozen["assessment"] != nil || frozen["choice"] != nil || attributes["responseFormat"] != "open" || attributes["evidenceLevel"] != nil || attributes["interactionCost"] != nil || attributes["preserved"] != true || frozen["teaching"] == nil {
				t.Fatalf("written grading context inherited adapted metadata: %s", instance.Teaching)
			}
			_, planned := summaryStates(t, g, 10*reviewDay)
			if !reflect.DeepEqual(planned[key], baseline) {
				t.Fatal("planning advanced the preserved due work")
			}

			answer := Submission{ID: newID(), Exercise: instance.Exercise, Submitted: 10 * reviewDay, ContentVersion: instance.ContentVersion, Mode: "type", Text: "Synthetic written explanation.", Review: &instance.Context}
			if _, code, err := g.submit(answer); err != nil || code != 201 {
				t.Fatalf("written response not accepted: %d, %v", code, err)
			}
			g.step(context.Background())
			graded, err := loadAttempt(g.server.db, answer.ID)
			if err != nil || graded.Verdict != "correct" {
				t.Fatalf("written grading failed: %+v, %v", graded, err)
			}
			summary, after := summaryStates(t, g, 10*reviewDay)
			if summary["due"] != 0 || after[key].DueAt <= baseline.DueAt || after[key].LastReviewedAt == nil || after[key].EvidenceLevel != baseline.EvidenceLevel {
				t.Fatalf("written evidence did not satisfy the historical skill: %+v", after[key])
			}
			preserved, err := loadAttempt(g.server.db, historical.ID)
			if err != nil || preserved.Verdict != historical.Verdict || preserved.Text != historical.Text {
				t.Fatal("restoration changed a historical answer")
			}
		})
	}
}

func TestReviewWrittenQuestionPreservesAdaptedIDsAndSourceDeduplication(t *testing.T) {
	g := reviewFixture(t)
	g.catalog.ReviewTemplates = nil
	g.catalog.Exercises = map[string]json.RawMessage{"lesson-1": json.RawMessage(`{
 "lessonSlug":"lesson",
 "question":{"prompt":"Choose a relationship.","officialAnswer":"A"},
 "choice":{"correctOption":"a","options":[{"id":"a","text":"A"},{"id":"b","text":"B"}]},
 "reviewQuestion":{"prompt":"Describe a relationship.","officialAnswer":"An explanation."},
 "analytics":{"concepts":[{"concept":"logic","role":"primary"}],"skills":[{"skill":"interpret","role":"primary"},{"skill":"justify","role":"primary"}],"attributes":{"responseFormat":"choice"}}
 }`)}
	ids := map[string]bool{}
	for _, template := range g.reviewTemplates() {
		ids[template.ID] = true
	}
	for _, id := range []string{"exercise-lesson-1-logic-interpret", "exercise-lesson-1-logic-interpret-written", "exercise-lesson-1-logic-justify-written"} {
		if !ids[id] {
			t.Errorf("missing representation %s", id)
		}
	}
	if ids["exercise-lesson-1-logic-justify"] {
		t.Fatal("choice was accepted as justification")
	}
	session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
	if err != nil || len(session.Instances) != 1 || session.Instances[0].SourceTarget != "exercise:lesson-1" {
		t.Fatalf("adapted/written representations repeated the same exercise: %+v, %v", session, err)
	}
}

func TestPublishedReviewCoversEveryAuthoredSkill(t *testing.T) {
	g := &Grading{catalog: publishedCatalog(t)}
	required := map[string]int{}
	for exercise, raw := range g.catalog.Exercises {
		var item struct {
			Choice     *ChoiceAssessment
			Assessment *Assessment
			Analytics  reviewAnalytics
		}
		if err := json.Unmarshal(raw, &item); err != nil {
			t.Fatalf("decode %s: %v", exercise, err)
		}
		for _, concept := range item.Analytics.Concepts {
			if concept.Role != "primary" {
				continue
			}
			for _, skill := range item.Analytics.Skills {
				if skill.Role != "primary" {
					continue
				}
				level := depth(skillDepth(skill.Skill))
				if skill.Skill == "recall" && item.Choice == nil {
					level = depth("production")
				}
				if item.Assessment != nil {
					level = max(level, depth(item.Assessment.Evidence.Level))
				}
				key := (ReviewTarget{Concept: concept.Concept, Skill: skill.Skill}).key()
				required[key] = max(required[key], level)
			}
		}
	}
	for _, template := range g.catalog.ReviewTemplates {
		required[template.key()] = max(required[template.key()], depth(template.EvidenceLevel))
	}
	available := map[string]int{}
	for _, template := range g.reviewTemplates() {
		questions := template.Variants
		if len(questions) == 0 {
			questions = []map[string]any{template.Question}
		}
		for _, question := range questions {
			available[template.key()] = max(available[template.key()], min(depth(template.EvidenceLevel), depth(template.questionEvidence(question).Level)))
		}
	}
	for key, level := range required {
		if available[key] < level {
			t.Errorf("review target %s requires depth %d but only has %d", key, level, available[key])
		}
	}
	t.Logf("Validated compatible review coverage for %d authored targets", len(required))
}

func TestPublishedReviewRestoresReportedMissingQuestions(t *testing.T) {
	catalog := publishedCatalog(t)
	effective := (&Grading{catalog: catalog}).reviewTemplates()
	for _, target := range []ReviewTarget{
		{Concept: "negation", Skill: "evaluate"},
		{Concept: "truth-classification", Skill: "analyze"},
		{Concept: "truth-classification", Skill: "justify"},
		{Concept: "propositions", Skill: "justify"},
		{Concept: "implication", Skill: "evaluate"},
		{Concept: "biconditional", Skill: "recall"},
		{Concept: "quantifier-laws", Skill: "evaluate"},
		{Concept: "quantifier-laws", Skill: "justify"},
		{Concept: "logical-equivalence", Skill: "justify"},
	} {
		t.Run(target.key(), func(t *testing.T) {
			g := reviewFixture(t)
			g.catalog.Exercises = nil
			g.catalog.ReviewTemplates = nil
			for _, template := range effective {
				if template.key() == target.key() {
					g.catalog.ReviewTemplates = append(g.catalog.ReviewTemplates, template)
				}
			}
			if len(g.catalog.ReviewTemplates) == 0 {
				t.Fatal("reported target still has no compatible question")
			}
			restoredTemplates := g.catalog.ReviewTemplates
			meta, _ := json.Marshal(map[string]any{"concepts": []map[string]string{{"concept": target.Concept, "role": "primary"}}, "skills": []map[string]string{{"skill": target.Skill, "role": "primary"}}})
			storeReviewAttempt(t, g, "historical-source", reviewDay, "correct", meta, nil)
			_, initial := summaryStates(t, g, 10*reviewDay)
			g.catalog.ReviewTemplates = nil
			_, blocked := summaryStates(t, g, 10*reviewDay)
			if !strings.Contains(blocked[target.key()].Reason, "no compatible question") {
				t.Fatal("missing-question migration fixture did not preserve blocked work")
			}
			g.catalog.ReviewTemplates = restoredTemplates
			_, restored := summaryStates(t, g, 10*reviewDay)
			if !reflect.DeepEqual(initial[target.key()], restored[target.key()]) {
				t.Fatal("restoring published coverage changed historical scheduling")
			}
			session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular", Concept: target.Concept, Skill: target.Skill}, 10*reviewDay)
			if err != nil || len(session.Instances) != 1 {
				t.Fatalf("reported target cannot produce a question: %d, %v", len(session.Instances), err)
			}
			instance := session.Instances[0]
			if depth(instance.EvidenceLevel) < depth(initial[target.key()].EvidenceLevel) {
				t.Fatal("replacement question is too shallow")
			}
			storeReviewAttempt(t, g, instance.Exercise, 10*reviewDay, "correct", instance.Analytics, &instance.Context)
			_, after := summaryStates(t, g, 10*reviewDay)
			if after[target.key()].DueAt <= 10*reviewDay {
				t.Fatal("compatible written answer did not satisfy reported overdue work")
			}
		})
	}
}
