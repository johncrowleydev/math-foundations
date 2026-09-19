package main

import (
	"errors"
	"regexp"
)

type sequencePairParams struct {
	Variable, Kind, Increment string
	Indices                   []string
}

func validateSequencePair(r AssessmentRequirement) error {
	var p sequencePairParams
	if jsonParams(r, &p) != nil || len(r.Fields) != 2 || !validIdentifier(p.Variable) || !enum(p.Kind, "same-recurrence", "prefix-counterexample") {
		return errors.New("Invalid sequence construction")
	}
	if p.Kind == "same-recurrence" {
		_, e := parseExact(p.Increment)
		return e
	}
	if len(p.Indices) < 1 || len(p.Indices) > 64 {
		return errors.New("Invalid prefix indices")
	}
	for _, s := range p.Indices {
		v, e := parseExact(s)
		if e != nil {
			return e
		}
		q, ok := v.rat()
		if !ok || !q.IsInt() {
			return errors.New("Prefix indices must be integers")
		}
	}
	return nil
}
func checkSequencePair(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p sequencePairParams
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	options := expressionParams{Variables: []string{p.Variable}, IntegerVariables: []string{p.Variable}}
	same, e := extendedExpressionEquivalent(xs[0], xs[1], options)
	if e != nil {
		return false, e
	}
	substitute := func(s, value string) string {
		return regexp.MustCompile(`\b`+p.Variable+`\b`).ReplaceAllStringFunc(s, func(string) string { return "(" + value + ")" })
	}
	all := !same
	if p.Kind == "same-recurrence" {
		for _, s := range xs {
			yes, e := extendedExpressionEquivalent("("+substitute(s, p.Variable+"+1")+")-("+s+")", p.Increment, options)
			if e != nil {
				return false, e
			}
			all = all && yes
		}
		return all, nil
	}
	for _, index := range p.Indices {
		a, e := parseExact(substitute(xs[0], index))
		if e != nil {
			return false, e
		}
		b, e := parseExact(substitute(xs[1], index))
		if e != nil {
			return false, e
		}
		all = all && a.equal(b)
	}
	return all, nil
}
