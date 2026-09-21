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

func TestQuantifiedRestrictedSetGrading(t *testing.T) {
	const negatedSubset = "exists x in U (A(x) and not B(x))"
	const restrictedUnique = "exists x in U (A(x) and P(x) and forall y in U ((A(y) and P(y)) -> y=x))"
	cases := []struct {
		name, answer, expected, verdict, form string
		domains                               []string
		sets                                  []string
		predicates                            map[string]int
		inputError                            bool
	}{
		{name: "existential TeX", answer: `$\exists x \in A (x \notin B)$`, verdict: "correct"},
		{name: "existential Unicode", answer: "∃z ∈ A (z ∉ B)", verdict: "correct"},
		{name: "screenshot universal is incorrect", answer: `$\forall x \in A (x \notin B)$`, verdict: "incorrect"},
		{name: "universal guards with implication", answer: "forall x in A (x in B)", expected: "forall y in U (A(y) -> B(y))", verdict: "correct"},
		{name: "universal does not assert conjunction", answer: "forall x in A (x in B)", expected: "forall y in U (A(y) and B(y))", verdict: "incorrect"},
		{name: "nested restricted quantifiers", answer: "forall x in A (exists y in B (x=y))", expected: "forall a in U (A(a) -> exists b in U (B(b) and a=b))", verdict: "correct"},
		{name: "nested shadowed variable", answer: "exists x in A (forall x in B P(x))", expected: "exists a in U (A(a) and forall b in U (B(b) -> P(b)))", verdict: "correct"},
		{name: "restricted uniqueness", answer: "exists! x in A P(x)", expected: restrictedUnique, verdict: "correct"},
		{name: "restricted uniqueness not global uniqueness", answer: "exists! x in A P(x)", expected: "exists x in U (A(x) and P(x) and forall y in U (P(y) -> y=x))", verdict: "incorrect"},
		{name: "unique nested shadowed binding", answer: "exists! x in A (forall x in B P(x))", expected: "exists a in U (A(a) and (forall b in U (B(b) -> P(b))) and forall c in U ((A(c) and forall d in U (B(d) -> P(d))) -> c=a))", verdict: "correct"},
		{name: "unbound variable", answer: "exists x in A (z notin B)", inputError: true},
		{name: "wrong explicit universe", answer: "exists x in R (A(x) and not B(x))", inputError: true},
		{name: "unknown set", answer: "exists x in C P(x)", inputError: true},
		{name: "predicate not declared set", answer: "exists x in P (x notin B)", inputError: true},
		{name: "set lacks unary predicate", answer: "exists x in A P(x)", predicates: map[string]int{"A": 2, "P": 1}, inputError: true},
		{name: "set lacks predicate", answer: "exists x in A P(x)", predicates: map[string]int{"P": 1}, inputError: true},
		{name: "ambiguous universe", answer: "exists x in A P(x)", domains: []string{"U", "D"}, inputError: true},
		{name: "no universe", answer: "exists x in A P(x)", domains: []string{}, inputError: true},
		{name: "configured domain has precedence", answer: "exists x in A P(x)", domains: []string{"A"}, expected: "exists y in A P(y)", verdict: "correct"},
		{name: "configured domain does not add guard", answer: "exists x in A P(x)", domains: []string{"A"}, expected: "exists y in A (A(y) and P(y))", verdict: "incorrect"},
		{name: "configured domain among multiple domains", answer: "exists x in A P(x)", domains: []string{"U", "A"}, expected: "exists y in A P(y)", verdict: "correct"},
		{name: "existential nnf", answer: "exists x in A (x notin B)", form: "nnf", verdict: "correct"},
		{name: "universal negations on atoms", answer: "forall x in A (x notin B)", expected: "forall x in U (A(x) -> not B(x))", form: "negations-on-atoms", verdict: "correct"},
		{name: "universal nnf", answer: "forall x in A (x notin B)", expected: "forall x in U (A(x) -> not B(x))", form: "nnf", verdict: "correct"},
		{name: "explicit implication fails nnf", answer: "forall x in A (P(x) -> B(x))", expected: "forall x in U (A(x) -> (P(x) -> B(x)))", form: "nnf", verdict: "incorrect"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if c.domains == nil {
				c.domains = []string{"U"}
			}
			if c.sets == nil {
				c.sets = []string{"A", "B"}
			}
			if c.predicates == nil {
				c.predicates = map[string]int{"A": 1, "B": 1, "P": 1}
			}
			if c.expected == "" {
				c.expected = negatedSubset
			}
			a := deterministicFixture(t)
			a.Requirements[0].Validator = "quantified-formula"
			params, err := json.Marshal(quantifiedParams{Expected: c.expected, Domains: c.domains, Sets: c.sets, Predicates: c.predicates, Form: c.form})
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
