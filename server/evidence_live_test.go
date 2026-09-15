package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"testing"
	"time"
)

type evidenceCase struct{ ID, Prompt, Reference, Response, Mode, Want, Previous, Reason, Tag string }

func readEvidenceCases(t *testing.T) []evidenceCase {
	t.Helper()
	b, e := os.ReadFile("testdata/grading-v5.json")
	if e != nil {
		t.Fatal(e)
	}
	var cases []evidenceCase
	if e = json.Unmarshal(b, &cases); e != nil {
		t.Fatal(e)
	}
	return cases
}
func TestGradingV5CorpusIntegrity(t *testing.T) {
	cases := readEvidenceCases(t)
	seen := map[string]bool{}
	for _, c := range cases {
		if seen[c.ID] || c.Prompt == "" || c.Response == "" || !enum(c.Want, "correct", "incorrect", "not_graded") {
			t.Fatal(c.ID)
		}
		seen[c.ID] = true
	}
	if len(cases) < 11 {
		t.Fatal("Incomplete corpus")
	}
}
func TestLiveEvidenceV5(t *testing.T) {
	key := os.Getenv("FOUNDATIONS_LIVE_TEST_KEY")
	if key == "" {
		t.Skip("Explicit live evaluation opt-in only")
	}
	s := fixture(t)
	g := &Grading{server: s, key: key, endpoint: "https://openrouter.ai/api/v1/chat/completions", client: &http.Client{Timeout: 120 * time.Second}}
	for _, c := range readEvidenceCases(t) {
		t.Run(c.ID, func(t *testing.T) {
			a := Attempt{Submission: Submission{Mode: "type", Text: c.Response}}
			if c.Mode == "photo" {
				a.Mode = "photo"
				a.Transcription = c.Response
			}
			if c.Previous != "" {
				a.Grades = []Grade{{Verdict: c.Previous, Feedback: "Earlier assessment rejected this derivation."}}
			}
			contextData, _ := json.Marshal(map[string]any{"question": map[string]string{"prompt": c.Prompt, "officialAnswer": c.Reference}})
			result, e := g.evaluate(context.Background(), a, string(contextData), c.Reason)
			if e != nil {
				t.Fatal(e)
			}
			if result.Verdict != c.Want {
				t.Errorf("want %s, got %s: %s", c.Want, result.Verdict, result.Feedback)
			}
			if c.Tag != "" {
				found := false
				for _, d := range result.Diagnosis {
					for _, tag := range d.Tags {
						found = found || tag == c.Tag
					}
				}
				if !found {
					t.Error("Missing diagnostic tag", c.Tag)
				}
			}
		})
	}
}
