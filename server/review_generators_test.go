package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
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
	template := canonicalReviewTemplate(t, "generated-connective-truth-value")
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
		if result != expected {
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
	template := canonicalReviewTemplate(t, "generated-integer-conditional-counterexample")
	seen, positions := map[[2]int]bool{}, map[int]bool{}
	original, _ := json.Marshal(template.Question)
	for n := 0; n < 4096; n++ {
		seed := fmt.Sprintf("conditional-counterexample-%d", n)
		_, params, choice := generatedReviewQuestion(t, template, seed)
		a, b, gap := params["a"], params["b"], params["gap"]
		if len(params) != 5 || b < -10 || b > 10 || gap < 1 || gap > 5 || a-b != gap || params["below"] != b-1 || params["above"] != a+1 {
			t.Fatalf("invalid conditional parameters: %v", params)
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

func canonicalReviewCatalog(t *testing.T) Catalog {
	t.Helper()
	root := os.Getenv("FOUNDATIONS_TEST_CONTENT_ROOT")
	if root == "" {
		root = ".."
	}
	var catalog Catalog
	for path, target := range map[string]any{"content/review-templates.json": &catalog.ReviewTemplates, "content/review-variants.json": &catalog.ReviewVariants} {
		raw, err := os.ReadFile(filepath.Join(root, path))
		if err != nil {
			t.Fatal(err)
		}
		if err = json.Unmarshal(raw, target); err != nil {
			t.Fatal(err)
		}
	}
	if err := validateReviewVariantBanks(catalog); err != nil {
		t.Fatal(err)
	}
	return catalog
}
func canonicalReviewTemplate(t *testing.T, id string) ReviewTemplate {
	t.Helper()
	catalog := canonicalReviewCatalog(t)
	for _, template := range catalog.ReviewTemplates {
		if template.ID == id {
			bank := catalog.ReviewVariants[id]
			template.ParameterVariants = &bank
			return template
		}
	}
	t.Fatal("Missing canonical review template", id)
	return ReviewTemplate{}
}
func TestReviewMigrationPreservesEveryLegacySeedCase(t *testing.T) {
	raw, err := os.ReadFile("testdata/review-migration.json")
	if err != nil {
		t.Fatal(err)
	}
	var fixture struct {
		Cases []struct {
			Template, Seed, Variant, SHA256 string
			Rotation                        int
		}
	}
	if err = json.Unmarshal(raw, &fixture); err != nil {
		t.Fatal(err)
	}
	catalog := canonicalReviewCatalog(t)
	templates := map[string]ReviewTemplate{}
	for _, template := range catalog.ReviewTemplates {
		if bank, ok := catalog.ReviewVariants[template.ID]; ok {
			template.ParameterVariants = &bank
			templates[template.ID] = template
		}
	}
	seen := map[string]bool{}
	for _, tc := range fixture.Cases {
		template, ok := templates[tc.Template]
		if !ok {
			t.Fatal("Unknown fixture template", tc.Template)
		}
		question, params := instantiateReviewQuestion(template, tc.Seed)
		snapshot, _ := json.Marshal(map[string]any{"question": question, "parameters": params})
		if got := fmt.Sprintf("%x", sha256.Sum256(snapshot)); got != tc.SHA256 {
			t.Fatalf("Legacy output changed for %s seed %s: %s", tc.Template, tc.Seed, snapshot)
		}
		instance := instantiateReview(template, ReviewState{}, "scheduled-review", "id", tc.Seed, "v", 1)
		if !reflect.DeepEqual(instance.Question, question) || !reflect.DeepEqual(instance.Context.Parameters, params) {
			t.Fatal("Preview/instance parity lost")
		}
		seen[fmt.Sprintf("%s/%s/%d", tc.Template, tc.Variant, tc.Rotation)] = true
	}
	expected := 0
	for id, template := range templates {
		bank := template.ParameterVariants
		for _, variant := range bank.Variants {
			rotations := 1
			if bank.Selection.ChoiceRotationByte != nil {
				rotations = len(variant.Question["choice"].(map[string]any)["options"].([]any))
			}
			for rotation := 0; rotation < rotations; rotation++ {
				expected++
				if !seen[fmt.Sprintf("%s/%s/%d", id, variant.ID, rotation)] {
					t.Fatalf("Legacy fixture misses %s/%s/%d", id, variant.ID, rotation)
				}
			}
		}
	}
	if len(fixture.Cases) != 747 || len(seen) != expected {
		t.Fatalf("Incomplete legacy coverage: %d/%d", len(seen), expected)
	}
}

func TestReviewWitnessVariantsAreIndependentlyCorrect(t *testing.T) {
	template := canonicalReviewTemplate(t, "integer-witness-selection")
	for _, variant := range template.ParameterVariants.Variants {
		p := variant.Parameters
		if p["a"] < 1 || p["a"] > 20 || p["sum"] < 1 || p["sum"] > 20 || p["witness"]+p["a"] != p["sum"] || p["witnessPlusOne"] != p["witness"]+1 || p["witnessMinusOne"] != p["witness"]-1 {
			t.Fatal("Invalid saved witness parameters", p)
		}
		raw, _ := json.Marshal(variant.Question)
		var question struct{ Choice ChoiceAssessment }
		if err := json.Unmarshal(raw, &question); err != nil {
			t.Fatal(err)
		}
		for _, option := range question.Choice.Options {
			value, err := strconv.Atoi(strings.Trim(option.Text, "$"))
			if err != nil {
				t.Fatal(err)
			}
			if (value+p["a"] == p["sum"]) != (option.ID == question.Choice.CorrectOption) {
				t.Fatal("Incorrect witness choice", variant.ID, option)
			}
		}
	}
}
func TestReviewVariantSelectionRejectsMalformedCatalogs(t *testing.T) {
	for name, mutate := range map[string]func(*Catalog){
		"missing": func(c *Catalog) { delete(c.ReviewVariants, "integer-witness-selection") },
		"out of bounds": func(c *Catalog) {
			bank := c.ReviewVariants["integer-witness-selection"]
			bank.Selection.HashBytes[0] = 32
		},
		"missing variant": func(c *Catalog) {
			bank := c.ReviewVariants["integer-witness-selection"]
			bank.Variants = bank.Variants[:1]
			c.ReviewVariants["integer-witness-selection"] = bank
		},
		"reordered": func(c *Catalog) {
			bank := c.ReviewVariants["integer-witness-selection"]
			bank.Variants[0], bank.Variants[1] = bank.Variants[1], bank.Variants[0]
		},
	} {
		t.Run(name, func(t *testing.T) {
			catalog := canonicalReviewCatalog(t)
			mutate(&catalog)
			if err := validateReviewVariantBanks(catalog); err == nil {
				t.Fatal("Invalid variant catalog accepted")
			}
		})
	}
}
