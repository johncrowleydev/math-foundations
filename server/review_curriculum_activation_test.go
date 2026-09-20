package main

import (
	"encoding/json"
	"os"
	"testing"
)

// These mixed review families use terminology introduced after their earlier
// component. Replay activates on the target concept as well as explicit aliases,
// so verify actual state rather than treating activationConcepts as a gate.
func TestPublishedCurriculumReviewPrerequisiteActivation(t *testing.T) {
	raw, err := os.ReadFile("../output/grading-catalog.json")
	if os.IsNotExist(err) {
		t.Skip("run npm run content first")
	}
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct{ id, earlier, ready string }{
		{"df-function-type-classification-review", "function-definition", "bijection"},
		{"la-fit-null-space-transfer-review", "orthogonal-projection", "least-squares"},
		{"counting-model-distinction-review", "counting-principles", "combinations"},
		{"big-o-constants-review", "big-o", "big-omega-theta"},
		{"graph-scan-growth-transfer-review", "cost-model", "big-omega-theta"},
		{"dominant-growth-recognition-review", "growth-comparison", "little-o"},
		{"well-ordering-boundary-review", "well-ordering", "recursive-correctness"},
	} {
		t.Run(tc.id, func(t *testing.T) {
			g := reviewFixture(t)
			if err := json.Unmarshal(raw, &g.catalog); err != nil {
				t.Fatal(err)
			}
			var target *ReviewTemplate
			for _, template := range g.reviewTemplates() {
				if template.ID == tc.id {
					copy := template
					target = &copy
					break
				}
			}
			if target == nil {
				t.Fatalf("effective template %s missing", tc.id)
			}
			if target.Objective == "" {
				t.Fatal("later retrieval family needs its own objective")
			}
			meta := func(concept string) json.RawMessage {
				b, _ := json.Marshal(map[string]any{"concepts": []map[string]string{{"concept": concept, "role": "primary"}}, "skills": []map[string]string{{"skill": "compute", "role": "primary"}}})
				return b
			}
			storeReviewAttempt(t, g, "earlier-content", reviewDay, "correct", meta(tc.earlier), nil)
			_, states := summaryStates(t, g, 10*reviewDay)
			if _, active := states[target.key()]; active {
				t.Fatalf("%s activated before %s was taught", tc.id, tc.ready)
			}
			storeReviewAttempt(t, g, "prerequisite-content", 2*reviewDay, "correct", meta(tc.ready), nil)
			_, states = summaryStates(t, g, 10*reviewDay)
			if _, active := states[target.key()]; !active {
				t.Fatalf("%s did not activate after %s practice", tc.id, tc.ready)
			}
		})
	}
	t.Run("recurrence evaluation reuses lesson-six preparation", func(t *testing.T) {
		g := reviewFixture(t)
		if err := json.Unmarshal(raw, &g.catalog); err != nil {
			t.Fatal(err)
		}
		for _, template := range g.reviewTemplates() {
			if template.ID != "recurrence-cold-evaluation-review" {
				continue
			}
			if template.Objective != "" {
				t.Fatal("routine recurrence substitution should reuse its existing target")
			}
			meta := json.RawMessage(`{"concepts":[{"concept":"recursive-definition","role":"primary"}],"skills":[{"skill":"compute","role":"primary"}]}`)
			storeReviewAttempt(t, g, "lesson-six-recursive-evaluation", reviewDay, "correct", meta, nil)
			_, states := summaryStates(t, g, 10*reviewDay)
			if _, active := states[template.key()]; !active {
				t.Fatal("lesson-six recurrence evidence did not activate the shared computation target")
			}
			return
		}
		t.Fatal("recurrence computation template missing")
	})
}
