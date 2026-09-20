package main

import (
	"encoding/json"
	"errors"
	"math/big"
	"regexp"
	"sort"
	"strings"
)

type integerListParams struct {
	Length int             `json:"length"`
	Sum    json.RawMessage `json:"sum"`
	Min    json.RawMessage `json:"min"`
	Max    json.RawMessage `json:"max"`
	Mod    json.RawMessage `json:"distinctResiduesMod"`
}

func authoredInteger(raw json.RawMessage) (*big.Int, error) {
	var s string
	if json.Unmarshal(raw, &s) != nil {
		s = string(raw)
	}
	x, e := parseExact(s)
	if e != nil {
		return nil, e
	}
	v, ok := x.rat()
	if !ok || !v.IsInt() {
		return nil, errors.New("Use an exact integer parameter")
	}
	return v.Num(), nil
}
func validateIntegerList(r AssessmentRequirement) error {
	var p integerListParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if len(r.Fields) != 1 || p.Length < 1 || p.Length > 64 {
		return errors.New("Invalid integer-list length")
	}
	for _, v := range []json.RawMessage{p.Sum, p.Min, p.Max, p.Mod} {
		if len(v) > 0 {
			if _, e := authoredInteger(v); e != nil {
				return e
			}
		}
	}
	if len(p.Min) > 0 && len(p.Max) > 0 {
		a, _ := authoredInteger(p.Min)
		b, _ := authoredInteger(p.Max)
		if a.Cmp(b) > 0 {
			return errors.New("Invalid integer-list bounds")
		}
	}
	if len(p.Mod) > 0 {
		m, _ := authoredInteger(p.Mod)
		if m.Sign() <= 0 {
			return errors.New("Use a positive modulus")
		}
	}
	return nil
}
func checkIntegerList(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p integerListParams
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	entries, e := splitMathList(xs[0])
	if e != nil {
		return false, e
	}
	values := []exactNumber{}
	for _, s := range entries {
		x, e := parseExact(s)
		if e != nil {
			return false, e
		}
		values = append(values, x)
	}
	if len(values) != p.Length {
		return false, nil
	}
	sum := new(big.Int)
	residues := map[string]bool{}
	var minimum, maximum, modulus *big.Int
	if len(p.Min) > 0 {
		minimum, _ = authoredInteger(p.Min)
	}
	if len(p.Max) > 0 {
		maximum, _ = authoredInteger(p.Max)
	}
	if len(p.Mod) > 0 {
		modulus, _ = authoredInteger(p.Mod)
	}
	for _, x := range values {
		v, ok := x.rat()
		if !ok || !v.IsInt() {
			return false, nil
		}
		n := v.Num()
		if minimum != nil && n.Cmp(minimum) < 0 || maximum != nil && n.Cmp(maximum) > 0 {
			return false, nil
		}
		sum.Add(sum, n)
		if modulus != nil {
			key := new(big.Int).Mod(n, modulus).String()
			if residues[key] {
				return false, nil
			}
			residues[key] = true
		}
	}
	if len(p.Sum) > 0 {
		want, _ := authoredInteger(p.Sum)
		if sum.Cmp(want) != 0 {
			return false, nil
		}
	}
	return true, nil
}

type binomialSumParams struct {
	Terms [][]json.RawMessage `json:"terms"`
}

func validateBinomialSum(r AssessmentRequirement) error {
	var p binomialSumParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if len(r.Fields) != 1 || len(p.Terms) == 0 || len(p.Terms) > 16 {
		return errors.New("Invalid binomial decomposition")
	}
	for _, term := range p.Terms {
		if len(term) != 2 {
			return errors.New("Use binomial argument pairs")
		}
		n, e := authoredInteger(term[0])
		if e != nil {
			return e
		}
		k, e := authoredInteger(term[1])
		if e != nil {
			return e
		}
		if n.Sign() < 0 || n.Cmp(big.NewInt(1000)) > 0 || k.Sign() < 0 || k.Cmp(n) > 0 {
			return errors.New("Invalid binomial arguments")
		}
	}
	return nil
}
func mathGroupEnd(s string, start int) int {
	if start >= len(s) || s[start] != '(' {
		return -1
	}
	depth := 0
	for i := start; i < len(s); i++ {
		if s[i] == '(' {
			depth++
		}
		if s[i] == ')' {
			depth--
		}
		if depth == 0 {
			return i
		}
	}
	return -1
}

var binomialCall = regexp.MustCompile(`^(\\binom|binom|choose)\s*`)

func binomialTerms(source string) ([]string, error) {
	s := strings.TrimSpace(source)
	for strings.HasPrefix(s, "(") && mathGroupEnd(s, 0) == len(s)-1 {
		s = strings.TrimSpace(s[1 : len(s)-1])
	}
	if strings.HasPrefix(s, "+") {
		return binomialTerms(s[1:])
	}
	depth, start := 0, 0
	parts := []string{}
	for i := 0; i < len(s); i++ {
		if s[i] == '(' {
			depth++
		}
		if s[i] == ')' {
			depth--
		}
		if s[i] == '+' && depth == 0 {
			parts = append(parts, s[start:i])
			start = i + 1
		}
	}
	if len(parts) > 0 {
		parts = append(parts, s[start:])
		out := []string{}
		for _, part := range parts {
			terms, e := binomialTerms(part)
			if e != nil || terms == nil {
				return nil, e
			}
			out = append(out, terms...)
		}
		return out, nil
	}
	match := binomialCall.FindStringSubmatch(s)
	if match == nil {
		return nil, nil
	}
	at := len(match[0])
	end := mathGroupEnd(s, at)
	if end < 0 {
		return nil, nil
	}
	args := []string{}
	if match[1] == "\\binom" {
		first := s[at+1 : end]
		at = end + 1
		for at < len(s) && s[at] == ' ' {
			at++
		}
		end = mathGroupEnd(s, at)
		if end < 0 {
			return nil, nil
		}
		args = []string{first, s[at+1 : end]}
	} else {
		var e error
		args, e = splitMathList(s[at+1 : end])
		if e != nil {
			return nil, e
		}
	}
	if strings.TrimSpace(s[end+1:]) != "" || len(args) != 2 {
		return nil, nil
	}
	numbers := []string{}
	for _, s := range args {
		x, e := parseExact(s)
		if e != nil {
			return nil, e
		}
		v, ok := x.rat()
		if !ok || !v.IsInt() {
			return nil, errors.New("Use integer binomial arguments")
		}
		numbers = append(numbers, v.Num().String())
	}
	return []string{strings.Join(numbers, ",")}, nil
}
func checkBinomialSum(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p binomialSumParams
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	if _, e := parseExact(xs[0]); e != nil {
		return false, e
	}
	source := strings.NewReplacer("{", "(", "}", ")").Replace(normalizeMath(xs[0]))
	actual, e := binomialTerms(source)
	if e != nil || actual == nil {
		return false, e
	}
	expected := []string{}
	for _, term := range p.Terms {
		n, _ := authoredInteger(term[0])
		k, _ := authoredInteger(term[1])
		expected = append(expected, n.String()+","+k.String())
	}
	sort.Strings(actual)
	sort.Strings(expected)
	return strings.Join(actual, "|") == strings.Join(expected, "|"), nil
}
