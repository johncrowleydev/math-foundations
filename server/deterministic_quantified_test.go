package main

import (
	"encoding/json"
	"testing"
)

func TestQuantifiedImplicitDomainGrading(t *testing.T) {
	const expected = "exists x in D (P(x) and forall y in D (P(y) -> y=x))"
	cases := []struct {
		name, answer, verdict string
		domains               []string
		inputError            bool
	}{
		{name: "screenshot TeX", answer: `$\exists x (P(x) \land \forall y (P(y) \to y = x))$`, verdict: "correct"},
		{name: "plain text", answer: "exists x (P(x) and forall y (P(y) -> y=x))", verdict: "correct"},
		{name: "Unicode", answer: "∃x (P(x) ∧ ∀y (P(y) → y=x))", verdict: "correct"},
		{name: "renamed variables", answer: "exists a (P(a) and forall b (P(b) -> b=a))", verdict: "correct"},
		{name: "omitted outer domain", answer: "exists x (P(x) and forall y in D (P(y) -> y=x))", verdict: "correct"},
		{name: "omitted inner domain", answer: "exists x in D (P(x) and forall y (P(y) -> y=x))", verdict: "correct"},
		{name: "explicit domains", answer: expected, verdict: "correct"},
		{name: "wrong explicit outer domain", answer: "exists x in R (P(x) and forall y (P(y) -> y=x))", inputError: true},
		{name: "wrong explicit inner domain", answer: "exists x (P(x) and forall y in R (P(y) -> y=x))", inputError: true},
		{name: "missing explicit domain value", answer: "exists x in (P(x) and forall y (P(y) -> y=x))", inputError: true},
		{name: "ambiguous outer domain", answer: "exists x (P(x) and forall y in D (P(y) -> y=x))", domains: []string{"D", "R"}, inputError: true},
		{name: "ambiguous inner domain", answer: "exists x in D (P(x) and forall y (P(y) -> y=x))", domains: []string{"D", "R"}, inputError: true},
		{name: "multiple explicit domains", answer: expected, domains: []string{"D", "R"}, verdict: "correct"},
		{name: "different allowed domain", answer: "exists x in R (P(x) and forall y in R (P(y) -> y=x))", domains: []string{"D", "R"}, verdict: "incorrect"},
		{name: "no configured domain", answer: "exists x (P(x) and forall y (P(y) -> y=x))", domains: []string{}, inputError: true},
		{name: "existence only", answer: "exists x P(x)", verdict: "incorrect"},
		{name: "at most one only", answer: "forall x (forall y ((P(x) and P(y)) -> x=y))", verdict: "incorrect"},
		{name: "unbound predicate variable", answer: "exists x (P(z) and forall y (P(y) -> y=x))", inputError: true},
		{name: "unbound equality variable", answer: "exists x (P(x) and forall y (P(y) -> y=z))", inputError: true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			domains := c.domains
			if domains == nil {
				domains = []string{"D"}
			}
			a := deterministicFixture(t)
			a.Requirements[0].Validator = "quantified-formula"
			params, err := json.Marshal(quantifiedParams{Expected: expected, Domains: domains, Predicates: map[string]int{"P": 1}})
			if err != nil {
				t.Fatal(err)
			}
			a.Requirements[0].Params = params
			grade, err := gradeAssessment(a, StructuredResponse{"answer": c.answer})
			if c.inputError {
				if err == nil {
					t.Fatalf("expected input error, got %+v", grade)
				}
				return
			}
			if err != nil || grade.Verdict != c.verdict {
				t.Fatalf("grade %q error %v; want %s", grade.Verdict, err, c.verdict)
			}
		})
	}
}
