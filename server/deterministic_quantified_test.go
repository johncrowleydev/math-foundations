package main

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"testing"
)

func TestQuantifiedGroupedDomains(t *testing.T) {
	cases := []struct {
		name, answer, expanded string
		domains                []string
	}{
		{name: "issue 43", answer: `\exists x,y\in A\,(x\ne y\land f(x)=f(y))`, expanded: "exists x in A exists y in A (x!=y and f(x)=f(y))", domains: []string{"A", "B"}},
		{name: "universal Unicode", answer: "∀x,y∈U: P(x) ∧ P(y)", expanded: "forall x in U forall y in U (P(x) and P(y))"},
		{name: "three variables", answer: "exists x,y,z in U. (x=y and y=z)", expanded: "exists x in U exists y in U exists z in U (x=y and y=z)"},
		{name: "mixed quantifiers", answer: "forall x,y in U exists z in U (x=z and y=z)", expanded: "forall x in U forall y in U exists z in U (x=z and y=z)"},
		{name: "nested groups", answer: "forall x,y in U (exists z,w in U (x=z and y=w))", expanded: "forall x in U forall y in U (exists z in U exists w in U (x=z and y=w))"},
		{name: "existential restricted guards", answer: "exists x,y in A P(x)", expanded: "exists x in U (A(x) and exists y in U (A(y) and P(x)))"},
		{name: "universal restricted guards", answer: "forall x,y in A P(x)", expanded: "forall x in U (not A(x) or forall y in U (not A(y) or P(x)))"},
		{name: "restricted shadowing", answer: "exists x,x in A P(x)", expanded: "exists x in U (A(x) and exists x in U (A(x) and P(x)))"},
		{name: "implicit comma predicate", answer: "forall x, P(x)", expanded: "forall x in U P(x)"},
		{name: "implicit comma comparison", answer: "forall x, x=x", expanded: "forall x in U x=x"},
		{name: "implicit comma membership", answer: "forall x, x in A", expanded: "forall x in U A(x)"},
		{name: "implicit comma membership conjunction", answer: "forall x, x in A and P(x)", expanded: "forall x in U (A(x) and P(x))"},
		{name: "parenthesized comma membership", answer: "(forall x, x in A)", expanded: "forall x in U A(x)"},
		{name: "missing shared domain", answer: "exists x,y (x=y)"},
		{name: "unknown shared domain", answer: "exists x,y in V (x=y)"},
		{name: "missing domain value", answer: "exists x,y in (x=y)"},
		{name: "missing body", answer: "exists x,y in U"},
		{name: "empty binder", answer: "exists x,,y in U (x=y)"},
		{name: "trailing comma", answer: "exists x,y, in U (x=y)"},
		{name: "nonidentifier binder", answer: "exists x,2 in U (x=x)"},
		{name: "unbound body variable", answer: "exists x,y in U (x=z)"},
		{name: "grouped unique", answer: "exists! x,y in U (x=y)"},
		{name: "restricted grouped unique", answer: "exists! x,y in A (x=y)"},
		{name: "ambiguous restricted universe", answer: "exists x,y in A (x=y)", domains: []string{"U", "D"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if c.domains == nil {
				c.domains = []string{"U"}
			}
			options := quantifiedParams{Sets: []string{"A"}, Functions: map[string]int{"f": 1}}
			predicates := map[string]int{"A": 1, "P": 1}
			actual, err := parseQuantified(c.answer, c.domains, predicates, options)
			if c.expanded == "" {
				if err == nil {
					t.Fatal("expected input error")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			expected, err := parseQuantified(c.expanded, c.domains, predicates, options)
			if err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(actual, expected) {
				t.Fatalf("group does not match explicit expansion %q", c.expanded)
			}
		})
	}
}

func TestQuantifiedGroupedDomainNestingLimit(t *testing.T) {
	for _, count := range []int{62, 63, 64} {
		for _, outer := range []string{"", "exists z in U "} {
			t.Run(fmt.Sprintf("count=%d/outer=%s", count, outer), func(t *testing.T) {
				variables := make([]string, count)
				for i := range variables {
					variables[i] = fmt.Sprintf("x%d", i)
				}
				_, err := parseQuantified(outer+"exists "+strings.Join(variables, ",")+" in U P(x0)", []string{"U"}, map[string]int{"P": 1})
				depth := count + 1 // Include the predicate body.
				if outer != "" {
					depth++
				}
				if depth <= 64 && err != nil {
					t.Fatal(err)
				}
				if depth > 64 && (err == nil || err.Error() != "Formula is nested too deeply") {
					t.Fatalf("expected nesting limit error; got %v", err)
				}
			})
		}
	}
}

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
