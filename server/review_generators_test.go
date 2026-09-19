package main

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"
	"testing"
)

func generatedReviewQuestion(t *testing.T, template ReviewTemplate, seed string) (map[string]any, map[string]int, ChoiceAssessment) {
	t.Helper()
	question, params := instantiateReviewQuestion(template, seed)
	instance := instantiateReview(template, ReviewState{}, "scheduled-review", "id", seed, "v", 1)
	if !reflect.DeepEqual(question, instance.Question) || !reflect.DeepEqual(params, instance.Context.Parameters) {
		t.Fatalf("preview and issued instance differ for seed %q", seed)
	}
	raw, err := json.Marshal(question)
	if err != nil || strings.Contains(string(raw), "{{") || strings.Contains(string(raw), "}}") {
		t.Fatalf("invalid or unexpanded generated question for seed %q: %s (%v)", seed, raw, err)
	}
	var rendered struct{ Choice ChoiceAssessment }
	if err := json.Unmarshal(raw, &rendered); err != nil {
		t.Fatal(err)
	}
	ids, texts := map[string]bool{}, map[string]bool{}
	for _, option := range rendered.Choice.Options {
		if ids[option.ID] || texts[option.Text] || option.Text == "" || option.Feedback == "" {
			t.Fatalf("duplicate or empty generated choice for seed %q: %+v", seed, option)
		}
		ids[option.ID], texts[option.Text] = true, true
	}
	if !ids[rendered.Choice.CorrectOption] {
		t.Fatalf("missing generated answer key for seed %q", seed)
	}
	return question, params, rendered.Choice
}

func TestReviewTruthValuesGenerator(t *testing.T) {
	template := ReviewTemplate{ID: "truth-values", Generator: "propositional-truth-values", Question: map[string]any{
		"prompt": "Given $p={{pTruth}}$ and $q={{qTruth}}$, is ${{formula}}$ true or false?",
		"math":   "{{formula}}",
		"answer": "{{resultText}}. {{explanation}}",
		"choice": ChoiceAssessment{CorrectOption: "result", Options: []ChoiceOption{
			{ID: "result", Text: "{{resultText}}", Feedback: "{{explanation}}"},
			{ID: "opposite", Text: "{{oppositeText}}", Feedback: "{{explanation}}"},
		}},
	}}
	// Independently tabulate each connective in FF, FT, TF, TT row order.
	want := [4][4]int{{0, 0, 0, 1}, {0, 1, 1, 1}, {1, 1, 0, 1}, {1, 0, 0, 1}}
	formulas := []string{`p\land q`, `p\lor q`, `p\to q`, `p\leftrightarrow q`}
	words, symbols := []string{"False", "True"}, []string{"F", "T"}
	seen, positions := map[[3]int]bool{}, map[int]bool{}
	original, _ := json.Marshal(template.Question)
	for n := 0; n < 2048; n++ {
		seed := fmt.Sprintf("truth-values-%d", n)
		question, params, choice := generatedReviewQuestion(t, template, seed)
		p, q, op, result := params["p"], params["q"], params["operation"], params["result"]
		if len(params) != 4 || p < 0 || p > 1 || q < 0 || q > 1 || op < 0 || op > 3 || result < 0 || result > 1 {
			t.Fatalf("invalid generated truth-value parameters: %v", params)
		}
		expected := want[op][2*p+q]
		if result != expected || question["math"] != formulas[op] {
			t.Fatalf("incorrect truth table row or escaped formula: %v %+v", params, question)
		}
		prompt := fmt.Sprintf("Given $p=%s$ and $q=%s$, is $%s$ true or false?", symbols[p], symbols[q], formulas[op])
		if question["prompt"] != prompt || !strings.HasPrefix(question["answer"].(string), words[expected]+". ") {
			t.Fatalf("rendered question disagrees with saved parameters: %+v", question)
		}
		if len(choice.Options) != 2 || choice.CorrectOption != "result" {
			t.Fatal("invalid truth-value choices", choice)
		}
		for i, option := range choice.Options {
			if (option.Text == words[expected]) != (option.ID == choice.CorrectOption) {
				t.Fatalf("incorrect generated truth-value answer: %v %+v", params, choice)
			}
			if option.ID == choice.CorrectOption {
				positions[i] = true
			}
		}
		seen[[3]int{p, q, op}] = true
	}
	if len(seen) != 16 || len(positions) != 2 {
		t.Fatalf("seeds did not cover every truth table row and answer position: %d rows, %d positions", len(seen), len(positions))
	}
	after, _ := json.Marshal(template.Question)
	if string(original) != string(after) {
		t.Fatal("generation mutated the source template")
	}
}

func TestReviewConditionalCounterexampleGenerator(t *testing.T) {
	template := ReviewTemplate{ID: "conditional-counterexample", Generator: "integer-conditional-counterexample", Question: map[string]any{
		"prompt": "Which integer disproves the claim: for every integer $x$, if $x<{{a}}$, then $x<{{b}}$?",
		"math":   "x<{{a}} \\to x<{{b}}",
		"answer": "At $x={{b}}$, the antecedent is true and the consequent is false.",
		"choice": ChoiceAssessment{CorrectOption: "counterexample", Options: []ChoiceOption{
			{ID: "counterexample", Text: "${{b}}$", Feedback: "${{b}}<{{a}}$ is true; ${{b}}<{{b}}$ is false."},
			{ID: "below", Text: "${{below}}$", Feedback: "${{below}}<{{b}}$ is true."},
			{ID: "above", Text: "${{above}}$", Feedback: "${{above}}<{{a}}$ is false."},
		}},
	}}
	seen, positions := map[[2]int]bool{}, map[int]bool{}
	original, _ := json.Marshal(template.Question)
	for n := 0; n < 4096; n++ {
		seed := fmt.Sprintf("conditional-counterexample-%d", n)
		question, params, choice := generatedReviewQuestion(t, template, seed)
		a, b, gap := params["a"], params["b"], params["gap"]
		if len(params) != 5 || b < -10 || b > 10 || gap < 1 || gap > 5 || a-b != gap || params["below"] != b-1 || params["above"] != a+1 {
			t.Fatalf("invalid conditional parameters: %v", params)
		}
		if question["math"] != fmt.Sprintf(`x<%d \to x<%d`, a, b) {
			t.Fatal("rendered formula disagrees with saved parameters", question)
		}
		if len(choice.Options) != 3 || choice.CorrectOption != "counterexample" {
			t.Fatal("invalid counterexample choices", choice)
		}
		falseCases := 0
		for i, option := range choice.Options {
			x, err := strconv.Atoi(strings.Trim(option.Text, "$"))
			if err != nil {
				t.Fatal("noninteger generated option", option)
			}
			// Evaluate the implication independently, including false antecedents.
			claimHolds := x >= a || x < b
			if !claimHolds {
				falseCases++
			}
			if (!claimHolds) != (option.ID == choice.CorrectOption) {
				t.Fatalf("incorrect conditional counterexample: %v %+v", params, choice)
			}
			if option.ID == choice.CorrectOption {
				if x != b {
					t.Fatal("boundary counterexample is missing", option)
				}
				positions[i] = true
			}
		}
		if falseCases != 1 {
			t.Fatal("counterexample choices are ambiguous", choice)
		}
		seen[[2]int{b, gap}] = true
	}
	// Every possible threshold/gap pair was instantiated and independently
	// checked above, including negative and zero boundaries and both endpoints.
	if len(seen) != 21*5 || len(positions) != 3 {
		t.Fatalf("seeds did not cover every threshold pair and answer position: %d pairs, %d positions", len(seen), len(positions))
	}
	after, _ := json.Marshal(template.Question)
	if string(original) != string(after) {
		t.Fatal("generation mutated the source template")
	}
}

func TestReviewWitnessGeneratorKeepsLegacySeedOutput(t *testing.T) {
	template := ReviewTemplate{Generator: "integer-witness-sum", Question: map[string]any{
		"prompt": "x + {{a}} = {{sum}}", "answer": "{{witness}}",
		"choice": ChoiceAssessment{CorrectOption: "witness", Options: []ChoiceOption{
			{ID: "witness", Text: "{{witness}}", Feedback: "Correct"},
			{ID: "above", Text: "{{witnessPlusOne}}", Feedback: "One above"},
			{ID: "below", Text: "{{witnessMinusOne}}", Feedback: "One below"},
		}},
	}}
	for _, tc := range []struct {
		seed, question, params string
	}{
		{"0", `{"answer":"1","choice":{"correctOption":"witness","options":[{"feedback":"Correct","id":"witness","text":"1"},{"feedback":"One above","id":"above","text":"2"},{"feedback":"One below","id":"below","text":"0"}]},"prompt":"x + 16 = 17"}`, `{"a":16,"sum":17,"witness":1,"witnessMinusOne":0,"witnessPlusOne":2}`},
		{"42", `{"answer":"-4","choice":{"correctOption":"witness","options":[{"feedback":"Correct","id":"witness","text":"-4"},{"feedback":"One above","id":"above","text":"-3"},{"feedback":"One below","id":"below","text":"-5"}]},"prompt":"x + 16 = 12"}`, `{"a":16,"sum":12,"witness":-4,"witnessMinusOne":-5,"witnessPlusOne":-3}`},
	} {
		question, params := instantiateReviewQuestion(template, tc.seed)
		qJSON, _ := json.Marshal(question)
		pJSON, _ := json.Marshal(params)
		if string(qJSON) != tc.question || string(pJSON) != tc.params {
			t.Fatalf("legacy seed %s changed: %s %s", tc.seed, qJSON, pJSON)
		}
	}
}
