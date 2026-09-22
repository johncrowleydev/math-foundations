package main

import (
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"testing"
)

func TestReviewCoveragePublishedFactoring(t *testing.T) {
	raw, err := os.ReadFile("../output/grading-catalog.json")
	if os.IsNotExist(err) {
		t.Skip("run npm run content:build to test the published catalog")
	}
	if err != nil {
		t.Fatal(err)
	}
	for _, kind := range []string{"scheduled-review", "focused-practice"} {
		for _, first := range []string{"transform", "justify"} {
			t.Run(kind+"/"+first+" due first", func(t *testing.T) {
				g := reviewFixture(t)
				if err := json.Unmarshal(raw, &g.catalog); err != nil {
					t.Fatal(err)
				}
				exercises := map[string]json.RawMessage{}
				for _, id := range []string{"propositional-logic-108", "propositional-logic-109"} {
					if len(g.catalog.Exercises[id]) == 0 {
						t.Fatalf("published factoring exercise %s missing", id)
					}
					exercises[id] = g.catalog.Exercises[id]
				}
				g.catalog.Exercises, g.catalog.ReviewTemplates = exercises, nil
				// Scheduled deep work now requires a balanced time plan. Add
				// unrelated short applications, retaining the original coverage
				// assertion that factoring itself is asked exactly once.
				applicationCount := 0
				if kind == "scheduled-review" {
					applicationCount = 4
					for i := 0; i < applicationCount; i++ {
						id := fmt.Sprintf("application-%d", i)
						meta := json.RawMessage(fmt.Sprintf(`{"concepts":[{"concept":%q,"role":"primary"}],"skills":[{"skill":"construct","role":"primary"}]}`, id))
						g.catalog.ReviewTemplates = append(g.catalog.ReviewTemplates, ReviewTemplate{ID: id, Category: "short-application", ReviewTarget: ReviewTarget{Concept: id, Skill: "construct"}, EvidenceLevel: "production", Analytics: meta, Question: map[string]any{"prompt": id, "answer": "Synthetic"}})
						storeReviewAttempt(t, g, id, reviewDay, "correct", meta, nil)
					}
				}
				for _, skill := range []string{"transform", "justify"} {
					at := 2 * reviewDay
					if skill == first {
						at = reviewDay
					}
					meta, _ := json.Marshal(map[string]any{
						"concepts": []map[string]string{{"concept": "distribution", "role": "primary"}},
						"skills":   []map[string]string{{"skill": skill, "role": "primary"}},
					})
					storeReviewAttempt(t, g, "historical-"+skill, at, "correct", meta, nil)
				}
				_, before := summaryStates(t, g, 10*reviewDay)
				session, err := g.planReview(ReviewSessionRequest{Kind: kind, Mode: "regular"}, 10*reviewDay)
				if err != nil || len(session.Instances) != 1+applicationCount {
					t.Fatalf("factoring repeated for overlapping skills: got %d tasks, error %v", len(session.Instances), err)
				}
				instance := session.Instances[len(session.Instances)-1]
				if instance.Context.Skill != first || instance.EvidenceLevel != "reasoning" {
					t.Fatalf("lost due order or the task's actual evidence depth: %s, %s", instance.Context.Skill, instance.EvidenceLevel)
				}
				_, planned := summaryStates(t, g, 10*reviewDay)
				if !reflect.DeepEqual(before, planned) {
					t.Fatal("planning alone changed scheduling evidence")
				}
				for _, answered := range session.Instances {
					storeReviewAttempt(t, g, answered.Exercise, 10*reviewDay, "correct", answered.Analytics, &answered.Context)
				}
				summary, after := summaryStates(t, g, 10*reviewDay)
				if summary["due"] != 0 {
					t.Fatal("one factoring answer did not satisfy both authored skills")
				}
				if after["distribution:transform:"].EvidenceLevel != "production" {
					t.Fatal("actual task depth must not raise the transform target's required depth")
				}
				next, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular"}, 10*reviewDay)
				if err != nil || len(next.Instances) != 0 {
					t.Fatal("a newly started session repeated already reviewed factoring work")
				}
			})
		}
	}
}

func TestReviewCoverageUsesPrimaryTagsAndPreservesObjectivesAndDepth(t *testing.T) {
	for _, variation := range []string{"primary", "supporting concept", "supporting skill", "objective", "deeper requirement"} {
		t.Run(variation, func(t *testing.T) {
			g := reviewFixture(t)
			a := duplicateReviewTemplate(t, g, "first", "a", "First task")
			b := duplicateReviewTemplate(t, g, "second", "b", "Second task")
			conceptRole, skillRole := "primary", "primary"
			switch variation {
			case "supporting concept":
				conceptRole = "supporting"
			case "supporting skill":
				b.Skill, skillRole = "interpret", "supporting"
			case "objective":
				b.Objective = "definition"
			case "deeper requirement":
				b.Skill, b.EvidenceLevel = "justify", "reasoning"
				delete(b.Question, "choice")
			}
			a.Analytics, _ = json.Marshal(map[string]any{
				"concepts": []map[string]string{{"concept": "a", "role": "primary"}, {"concept": "b", "role": conceptRole}},
				"skills":   []map[string]string{{"skill": a.Skill, "role": "primary"}, {"skill": b.Skill, "role": skillRole}},
			})
			g.catalog.ReviewTemplates = []ReviewTemplate{a, b}
			session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
			want := 2
			if variation == "primary" {
				want = 1
			}
			if err != nil || len(session.Instances) != want {
				t.Fatalf("got %d tasks, want %d, error %v", len(session.Instances), want, err)
			}
			if variation == "primary" {
				_, planned := summaryStates(t, g, reviewDay)
				if len(planned) != 1 {
					t.Fatal("covered but unselected target was activated without an answer")
				}
				instance := session.Instances[0]
				storeReviewAttempt(t, g, instance.Exercise, reviewDay, "correct", instance.Analytics, &instance.Context)
				summary, after := summaryStates(t, g, reviewDay)
				if len(after) != 2 || summary["due"] != 0 {
					t.Fatal("answer did not supply the coverage used by the planner")
				}
			}
		})
	}
}

func TestReviewCoverageLaterReasoningReplacesRedundantProduction(t *testing.T) {
	for _, uniqueTarget := range []bool{false, true} {
		name := "fully subsumed"
		if uniqueTarget {
			name = "earlier task retains unique coverage"
		}
		t.Run(name, func(t *testing.T) {
			g := reviewFixture(t)
			production := duplicateReviewTemplate(t, g, "production", "a", "Produce a result.")
			production.Skill, production.EvidenceLevel = "transform", "production"
			delete(production.Question, "choice")
			reasoning := duplicateReviewTemplate(t, g, "reasoning", "b", "Produce and justify a result.")
			reasoning.Skill, reasoning.EvidenceLevel = "justify", "reasoning"
			delete(reasoning.Question, "choice")
			production.Analytics = json.RawMessage(`{"concepts":[{"concept":"a","role":"primary"},{"concept":"c","role":"primary"}],"skills":[{"skill":"transform","role":"primary"}]}`)
			reasoning.Analytics = json.RawMessage(`{"concepts":[{"concept":"a","role":"primary"},{"concept":"b","role":"primary"}],"skills":[{"skill":"transform","role":"primary"},{"skill":"justify","role":"primary"}]}`)
			g.catalog.ReviewTemplates = []ReviewTemplate{production, reasoning}
			if uniqueTarget {
				third := production
				third.Concept, third.ID = "c", "unique"
				g.catalog.ReviewTemplates = append(g.catalog.ReviewTemplates, third)
			}
			session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
			want := 1
			if uniqueTarget {
				want = 2
			}
			if err != nil || len(session.Instances) != want || session.Instances[want-1].Context.TemplateID != reasoning.ID {
				t.Fatalf("got %d tasks, want %d ending with reasoning; error %v", len(session.Instances), want, err)
			}
			_, states := summaryStates(t, g, reviewDay)
			if len(states) != want {
				t.Fatal("unissued tasks left activation records")
			}
			var persisted int
			if err := g.server.db.QueryRow("SELECT COUNT(*) FROM records WHERE key LIKE 'review-instance/%'").Scan(&persisted); err != nil || persisted != want {
				t.Fatalf("persisted %d tasks, want %d; error %v", persisted, want, err)
			}
			for _, instance := range session.Instances {
				storeReviewAttempt(t, g, instance.Exercise, reviewDay, "correct", instance.Analytics, &instance.Context)
			}
			summary, _ := summaryStates(t, g, reviewDay)
			if summary["due"] != 0 {
				t.Fatal("pruning lost planned target coverage")
			}
		})
	}
}

func TestReviewQuestionDepthKeepsResponseEvidenceAuthoritative(t *testing.T) {
	g := reviewFixture(t)
	template := duplicateReviewTemplate(t, g, "both-skills", "logic", "Select a result.")
	template.Analytics = json.RawMessage(`{"concepts":[{"concept":"logic","role":"primary"}],"skills":[{"skill":"recognize","role":"primary"},{"skill":"justify","role":"primary"}]}`)
	if got := template.questionEvidence(template.Question).Level; got != "recognition" {
		t.Fatalf("choice evidence inflated to %s by primary tags", got)
	}
	delete(template.Question, "choice")
	assessment := deterministicFixture(t)
	assessment.Evidence.Level = "production"
	template.Question["assessment"] = assessment
	if got := template.questionEvidence(template.Question).Level; got != "production" {
		t.Fatalf("structured evidence inflated to %s by primary tags", got)
	}
}

func TestReviewCoverageHistoricalInstanceUsesFrozenPrimarySkills(t *testing.T) {
	g := reviewFixture(t)
	production := duplicateReviewTemplate(t, g, "production", "logic", "Produce a result.")
	production.Skill, production.EvidenceLevel = "transform", "production"
	delete(production.Question, "choice")
	reasoning := production
	reasoning.Skill, reasoning.EvidenceLevel, reasoning.ID = "justify", "reasoning", "reasoning"
	// The current templates deliberately lack the old question's skill mappings.
	// Replay must use the frozen instance, not infer evidence from today's task.
	g.catalog.ReviewTemplates = []ReviewTemplate{production, reasoning}
	issued := production
	issued.Analytics = json.RawMessage(`{"concepts":[{"concept":"logic","role":"primary"}],"skills":[{"skill":"transform","role":"primary"},{"skill":"justify","role":"primary"}]}`)
	instance := instantiateReview(issued, ReviewState{}, "scheduled-review", newID(), "old-seed", "old-version", reviewDay)
	instance.EvidenceLevel = "production" // Persisted by the old planner.
	tx, err := g.server.db.Begin()
	if err != nil {
		t.Fatal(err)
	}
	if err := reviewPut(tx, "review-instance/"+instance.ID, instance); err != nil {
		t.Fatal(err)
	}
	if err := tx.Commit(); err != nil {
		t.Fatal(err)
	}
	storeReviewAttempt(t, g, instance.Exercise, reviewDay, "correct", instance.Analytics, &instance.Context)
	summary, states := summaryStates(t, g, reviewDay)
	if len(states) != 2 || summary["due"] != 0 || states[reasoning.key()].LastReviewedAt == nil {
		t.Fatal("historical written justification was lost under a production target")
	}
	tx, err = g.server.db.Begin()
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback()
	var saved ReviewInstance
	if err := reviewLoad(tx, "review-instance/"+instance.ID, &saved); err != nil {
		t.Fatal(err)
	}
	before, _ := json.Marshal(instance)
	after, _ := json.Marshal(saved)
	if string(before) != string(after) {
		t.Fatal("replaying evidence changed the original issued question or context")
	}
}
