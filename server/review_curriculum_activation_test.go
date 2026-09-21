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
		t.Skip("run npm run content:build first")
	}
	if err != nil {
		t.Fatal(err)
	}
	published := reviewFixture(t)
	if err := json.Unmarshal(raw, &published.catalog); err != nil {
		t.Fatal(err)
	}
	templates := map[string]ReviewTemplate{}
	for _, template := range published.reviewTemplates() {
		templates[template.ID] = template
	}
	targetFixture := func(t *testing.T, id string) (*Grading, ReviewTemplate) {
		t.Helper()
		target, ok := templates[id]
		if !ok {
			t.Fatalf("effective template %s missing", id)
		}
		g := reviewFixture(t)
		// Resolve eligibility from the full published catalog once, then replay
		// this target's actual definition without rebuilding unrelated exercises
		// on every summary call. Attempt evidence is supplied by its saved snapshot.
		g.catalog.Version = published.catalog.Version
		g.catalog.ReviewTemplates = []ReviewTemplate{target}
		return g, target
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
			g, target := targetFixture(t, tc.id)
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
		g, target := targetFixture(t, "recurrence-cold-evaluation-review")
		if target.Objective != "" {
			t.Fatal("routine recurrence substitution should reuse its existing target")
		}
		meta := json.RawMessage(`{"concepts":[{"concept":"recursive-definition","role":"primary"}],"skills":[{"skill":"compute","role":"primary"}]}`)
		storeReviewAttempt(t, g, "lesson-six-recursive-evaluation", reviewDay, "correct", meta, nil)
		_, states := summaryStates(t, g, 10*reviewDay)
		if _, active := states[target.key()]; !active {
			t.Fatal("lesson-six recurrence evidence did not activate the shared computation target")
		}
	})
}
