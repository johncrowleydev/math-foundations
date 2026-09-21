package main

import (
	"encoding/json"
	"os"
	"testing"
)

// Identical materialized cases and independent expected outcomes run in the
// browser checker (tests/grading/deterministic-adversarial.test.ts) and this server.
func TestAdversarialConformance(t *testing.T) {
	data, err := os.ReadFile("../tests/grading/fixtures/deterministic-adversarial-corpus.json")
	if err != nil {
		t.Fatal(err)
	}
	var corpus struct {
		Definitions map[string]Assessment `json:"definitions"`
		Cases       []struct {
			Name       string             `json:"name"`
			Definition string             `json:"definition"`
			Response   StructuredResponse `json:"response"`
			Outcome    string             `json:"outcome"`
		} `json:"cases"`
	}
	if err = json.Unmarshal(data, &corpus); err != nil {
		t.Fatal(err)
	}
	for _, c := range corpus.Cases {
		t.Run(c.Name, func(t *testing.T) {
			definition, ok := corpus.Definitions[c.Definition]
			if !ok {
				t.Fatalf("missing definition %s", c.Definition)
			}
			result, err := gradeAssessment(&definition, c.Response)
			if c.Outcome == "input-error" {
				if err == nil {
					t.Fatalf("expected input error, got %s", result.Verdict)
				}
			} else if err != nil || result.Verdict != c.Outcome {
				t.Fatalf("grade %q error %v; want %s", result.Verdict, err, c.Outcome)
			}
		})
	}
}
