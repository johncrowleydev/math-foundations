package main

import (
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"strings"
)

type symbolicFormParams struct {
	Expected             string         `json:"expected"`
	Variables            []string       `json:"variables"`
	Sequences            map[string]int `json:"sequences"`
	AllowFiniteExpansion bool           `json:"allowFiniteExpansion"`
}
type sumNode struct {
	kind, source, variable, lower, upper string
	body, left, right                    *sumNode
	parts                                []*sumNode
}

var symbolicName = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9]*$`)
var symbolicWord = regexp.MustCompile(`\b[A-Za-z][A-Za-z0-9_]*\b`)

func cleanSymbolic(source string) (string, error) {
	if len(source) > 4096 || regexp.MustCompile(`\bsumBound[0-9]+\b|\bfunctionValue[0-9]+\b`).MatchString(source) {
		return "", errors.New("Use a shorter formula with the variables named in the question")
	}
	source = strings.TrimSpace(source)
	source = regexp.MustCompile(`^\$\$?|\$\$?$`).ReplaceAllString(source, "")
	source = regexp.MustCompile(`\\(?:left|right)\b`).ReplaceAllString(source, "")
	source = regexp.MustCompile(`\\(?:,|;|!|quad|qquad| )`).ReplaceAllString(source, " ")
	return strings.TrimSpace(source), nil
}
func symbolicGroup(s string, start int) (string, int, error) {
	for start < len(s) && strings.ContainsRune(" \t\n\r", rune(s[start])) {
		start++
	}
	if start >= len(s) {
		return "", 0, errors.New("Include the formula group")
	}
	open := s[start]
	close := byte(0)
	if open == '{' {
		close = '}'
	} else if open == '(' {
		close = ')'
	}
	if close == 0 {
		m := regexp.MustCompile(`^(?:[A-Za-z][A-Za-z0-9]*|[0-9]+)`).FindString(s[start:])
		if m == "" {
			return "", 0, errors.New("Use braces or parentheses around each sum bound")
		}
		return m, start + len(m), nil
	}
	depth, end := 1, start+1
	for end < len(s) && depth > 0 {
		if s[end] == open {
			depth++
		}
		if s[end] == close {
			depth--
		}
		if depth > 0 {
			end++
		}
	}
	if depth > 0 {
		return "", 0, errors.New("Close every formula delimiter")
	}
	return s[start+1 : end], end + 1, nil
}
func symbolicParts(s string, sep byte) ([]string, error) {
	depth, start := 0, 0
	parts := []string{}
	for i := 0; i < len(s); i++ {
		c := s[i]
		if strings.ContainsRune("({[", rune(c)) {
			depth++
		}
		if strings.ContainsRune(")}]", rune(c)) {
			depth--
		}
		if depth < 0 {
			return nil, errors.New("Check the formula delimiters")
		}
		if c == sep && depth == 0 {
			parts = append(parts, strings.TrimSpace(s[start:i]))
			start = i + 1
		}
	}
	if depth != 0 {
		return nil, errors.New("Close every formula delimiter")
	}
	return append(parts, strings.TrimSpace(s[start:])), nil
}
func symbolicUnwrap(s string) (string, error) {
	s = strings.TrimSpace(s)
	for strings.HasPrefix(s, "(") {
		g, end, e := symbolicGroup(s, 0)
		if e != nil {
			return "", e
		}
		if end != len(s) {
			break
		}
		s = strings.TrimSpace(g)
	}
	return s, nil
}
func indexedCalls(s string, sequences map[string]int) (string, error) {
	result := ""
	re := regexp.MustCompile(`^([A-Za-z][A-Za-z0-9]*?)_`)
	for at := 0; at < len(s); {
		m := re.FindStringSubmatch(s[at:])
		if m == nil || sequences[m[1]] == 0 {
			result += s[at : at+1]
			at++
			continue
		}
		indices, end, e := symbolicGroup(s, at+len(m[0]))
		if e != nil {
			return "", e
		}
		parts, e := symbolicParts(indices, ',')
		if e != nil {
			return "", e
		}
		if len(parts) != sequences[m[1]] {
			return "", fmt.Errorf("Use %d indices for %s", sequences[m[1]], m[1])
		}
		result += m[1] + "(" + strings.Join(parts, ",") + ")"
		at = end
	}
	return result, nil
}
func symbolicAlpha(s string, bound []string) string {
	return symbolicWord.ReplaceAllStringFunc(s, func(v string) string {
		for i := len(bound) - 1; i >= 0; i-- {
			if bound[i] == v {
				return fmt.Sprintf("sumBound%d", i)
			}
		}
		return v
	})
}
func symbolicEquivalent(a, b string, ab, bb, variables []string, sequences map[string]int) (bool, error) {
	vs := append([]string{}, variables...)
	for i := range ab {
		vs = append(vs, fmt.Sprintf("sumBound%d", i))
	}
	a, e := indexedCalls(a, sequences)
	if e != nil {
		return false, e
	}
	b, e = indexedCalls(b, sequences)
	if e != nil {
		return false, e
	}
	registry := []functionTerm{}
	x, e := logicalExpression(symbolicAlpha(a, ab), vs, sequences, &registry, 0)
	if e != nil {
		return false, e
	}
	y, e := logicalExpression(symbolicAlpha(b, bb), vs, sequences, &registry, 0)
	if e != nil {
		return false, e
	}
	x, y = commonPolynomials(x, y)
	if !x.equal(y) {
		return false, nil
	}
	return samePolynomialDomain(x, y, nil)
}
func parseSum(s string, depth int) (*sumNode, error) {
	if depth > 32 {
		return nil, errors.New("Use fewer nested sums")
	}
	s, e := symbolicUnwrap(s)
	if e != nil {
		return nil, e
	}
	equations, e := symbolicParts(s, '=')
	if e != nil {
		return nil, e
	}
	if len(equations) > 2 {
		return nil, errors.New("Use one equality between the requested expressions")
	}
	if len(equations) == 2 {
		l, e := parseSum(equations[0], depth+1)
		if e != nil {
			return nil, e
		}
		r, e := parseSum(equations[1], depth+1)
		return &sumNode{kind: "equation", left: l, right: r}, e
	}
	additions, e := symbolicParts(s, '+')
	if e != nil {
		return nil, e
	}
	hasSum := false
	for _, x := range additions {
		u, e := symbolicUnwrap(x)
		if e != nil {
			return nil, e
		}
		if regexp.MustCompile(`^\\?sum[_\(\s]`).MatchString(u) {
			hasSum = true
		}
	}
	if len(additions) > 1 && hasSum {
		n := &sumNode{kind: "add"}
		for _, x := range additions {
			p, e := parseSum(x, depth+1)
			if e != nil {
				return nil, e
			}
			n.parts = append(n.parts, p)
		}
		return n, nil
	}
	match := regexp.MustCompile(`^(?:\\sum|sum)\s*`).FindString(s)
	if match == "" {
		return &sumNode{kind: "expression", source: s}, nil
	}
	at := len(match)
	var variable, lower, upper, body string
	if at < len(s) && s[at] == '(' {
		args, end, e := symbolicGroup(s, at)
		if e != nil {
			return nil, e
		}
		parts, e := symbolicParts(args, ',')
		if e != nil {
			return nil, e
		}
		if len(parts) != 4 || end != len(s) {
			return nil, errors.New("Use sum(index,lower,upper,summand)")
		}
		variable, lower, upper, body = parts[0], parts[1], parts[2], parts[3]
	} else {
		if at >= len(s) || s[at] != '_' {
			return nil, errors.New("Give the sum lower bound")
		}
		decl, end, e := symbolicGroup(s, at+1)
		if e != nil {
			return nil, e
		}
		at = end
		eq := strings.Index(decl, "=")
		if eq < 1 {
			return nil, errors.New("Start a sum with an index assignment")
		}
		variable, lower = strings.TrimSpace(decl[:eq]), strings.TrimSpace(decl[eq+1:])
		for at < len(s) && strings.ContainsRune(" \n\t\r", rune(s[at])) {
			at++
		}
		if at >= len(s) || s[at] != '^' {
			return nil, errors.New("Give the sum upper bound")
		}
		upper, at, e = symbolicGroup(s, at+1)
		if e != nil {
			return nil, e
		}
		body = strings.TrimSpace(s[at:])
	}
	if !symbolicName.MatchString(variable) || lower == "" || upper == "" || body == "" {
		return nil, errors.New("Include a sum index, both bounds, and its summand")
	}
	b, e := parseSum(body, depth+1)
	return &sumNode{kind: "sum", variable: variable, lower: lower, upper: upper, body: b}, e
}
func sameSum(a, b *sumNode, ab, bb, variables []string, sequences map[string]int) (bool, error) {
	if a.kind != b.kind {
		return false, nil
	}
	switch a.kind {
	case "expression":
		return symbolicEquivalent(a.source, b.source, ab, bb, variables, sequences)
	case "equation":
		for _, pair := range [][2]*sumNode{{b.left, b.right}, {b.right, b.left}} {
			ok, e := sameSum(a.left, pair[0], ab, bb, variables, sequences)
			if e != nil {
				return false, e
			}
			if ok {
				ok, e = sameSum(a.right, pair[1], ab, bb, variables, sequences)
				if e != nil {
					return false, e
				}
				if ok {
					return true, nil
				}
			}
		}
		return false, nil
	case "sum":
		for _, pair := range [][2]string{{a.lower, b.lower}, {a.upper, b.upper}} {
			ok, e := symbolicEquivalent(pair[0], pair[1], ab, bb, variables, nil)
			if e != nil || !ok {
				return false, e
			}
		}
		return sameSum(a.body, b.body, append(append([]string{}, ab...), a.variable), append(append([]string{}, bb...), b.variable), variables, sequences)
	case "add":
		var flatten func(*sumNode) []*sumNode
		flatten = func(n *sumNode) []*sumNode {
			if n.kind != "add" {
				return []*sumNode{n}
			}
			out := []*sumNode{}
			for _, x := range n.parts {
				out = append(out, flatten(x)...)
			}
			return out
		}
		left, remaining := flatten(a), flatten(b)
		if len(left) != len(remaining) {
			return false, nil
		}
		for _, x := range left {
			found := -1
			for i, y := range remaining {
				ok, e := sameSum(x, y, ab, bb, variables, sequences)
				if e != nil {
					return false, e
				}
				if ok {
					found = i
					break
				}
			}
			if found < 0 {
				return false, nil
			}
			remaining = append(remaining[:found], remaining[found+1:]...)
		}
		return true, nil
	}
	return false, nil
}
func validateSumNode(n *sumNode, bound, variables []string, sequences map[string]int) error {
	expression := func(s string, symbols map[string]int) error {
		s, e := indexedCalls(s, symbols)
		if e != nil {
			return e
		}
		_, e = logicalExpression(s, append(append([]string{}, variables...), bound...), symbols, new([]functionTerm), 0)
		return e
	}
	switch n.kind {
	case "equation":
		if e := validateSumNode(n.left, bound, variables, sequences); e != nil {
			return e
		}
		return validateSumNode(n.right, bound, variables, sequences)
	case "expression":
		return expression(n.source, sequences)
	case "add":
		for _, x := range n.parts {
			if e := validateSumNode(x, bound, variables, sequences); e != nil {
				return e
			}
		}
		return nil
	default:
		if e := expression(n.lower, nil); e != nil {
			return e
		}
		if e := expression(n.upper, nil); e != nil {
			return e
		}
		return validateSumNode(n.body, append(append([]string{}, bound...), n.variable), variables, sequences)
	}
}
func expandFiniteSum(n *sumNode, variables []string, sequences map[string]int, budget *int) (*sumNode, error) {
	*budget--
	if *budget < 0 {
		return nil, errors.New("Use fewer finite sum terms")
	}
	copy := *n
	switch n.kind {
	case "expression":
		return n, nil
	case "equation":
		var e error
		copy.left, e = expandFiniteSum(n.left, variables, sequences, budget)
		if e != nil {
			return nil, e
		}
		copy.right, e = expandFiniteSum(n.right, variables, sequences, budget)
		return &copy, e
	case "add":
		copy.parts = nil
		for _, x := range n.parts {
			p, e := expandFiniteSum(x, variables, sequences, budget)
			if e != nil {
				return nil, e
			}
			copy.parts = append(copy.parts, p)
		}
		return &copy, nil
	}
	if n.body.kind != "expression" {
		var e error
		copy.body, e = expandFiniteSum(n.body, append(append([]string{}, variables...), n.variable), sequences, budget)
		return &copy, e
	}
	bound := func(s string) (*big.Int, error) {
		p, e := parsePolynomial(s, variables)
		if e != nil {
			return nil, e
		}
		v, e := p.constant()
		if e != nil {
			return nil, e
		}
		r, ok := v.rat()
		if !ok || !r.IsInt() {
			return nil, errors.New("Use integer bounds")
		}
		return r.Num(), nil
	}
	lower, e := bound(n.lower)
	if e != nil {
		return n, nil
	}
	upper, e := bound(n.upper)
	if e != nil {
		return n, nil
	}
	diff := new(big.Int).Sub(upper, lower)
	if diff.Sign() < 0 || diff.Cmp(big.NewInt(63)) > 0 {
		return n, nil
	}
	body, e := indexedCalls(n.body.source, sequences)
	if e != nil {
		return nil, e
	}
	out := &sumNode{kind: "add"}
	pattern := regexp.MustCompile(`\b` + regexp.QuoteMeta(n.variable) + `\b`)
	for value := new(big.Int).Set(lower); value.Cmp(upper) <= 0; value.Add(value, big.NewInt(1)) {
		*budget--
		if *budget < 0 {
			return nil, errors.New("Use fewer finite sum terms")
		}
		out.parts = append(out.parts, &sumNode{kind: "expression", source: pattern.ReplaceAllString(body, "("+value.String()+")")})
	}
	return out, nil
}
func collectSumTerms(n *sumNode) *sumNode {
	c := *n
	switch n.kind {
	case "expression":
		return n
	case "sum":
		c.body = collectSumTerms(n.body)
		return &c
	case "equation":
		c.left = collectSumTerms(n.left)
		c.right = collectSumTerms(n.right)
		return &c
	}
	var flatten func(*sumNode) []*sumNode
	flatten = func(x *sumNode) []*sumNode {
		if x.kind != "add" {
			return []*sumNode{collectSumTerms(x)}
		}
		out := []*sumNode{}
		for _, p := range x.parts {
			out = append(out, flatten(p)...)
		}
		return out
	}
	others := []*sumNode{}
	expressions := []string{}
	for _, p := range n.parts {
		for _, x := range flatten(p) {
			if x.kind == "expression" {
				expressions = append(expressions, "("+x.source+")")
			} else {
				others = append(others, x)
			}
		}
	}
	if len(expressions) > 0 {
		others = append(others, &sumNode{kind: "expression", source: strings.Join(expressions, "+")})
	}
	if len(others) == 1 {
		return others[0]
	}
	return &sumNode{kind: "add", parts: others}
}
func validateSymbolicForm(r AssessmentRequirement) error {
	var p symbolicFormParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if len(r.Fields) != 1 || p.Variables == nil || len(p.Variables) > 8 {
		return errors.New("Invalid symbolic input definition")
	}
	for _, v := range p.Variables {
		if !symbolicName.MatchString(v) {
			return errors.New("Invalid symbolic variable")
		}
	}
	for name, n := range p.Sequences {
		if !symbolicName.MatchString(name) || n < 1 || n > 4 {
			return errors.New("Invalid indexed sequence definition")
		}
	}
	expected, e := cleanSymbolic(p.Expected)
	if e != nil {
		return e
	}
	if r.Validator == "indexed-expression" {
		_, e := symbolicEquivalent(expected, expected, nil, nil, p.Variables, p.Sequences)
		return e
	}
	n, e := parseSum(expected, 0)
	if e != nil {
		return e
	}
	if n.kind == "expression" {
		return errors.New("A summation definition requires sum notation")
	}
	return validateSumNode(n, nil, p.Variables, p.Sequences)
}
func checkSymbolicForm(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p symbolicFormParams
	if e := jsonParams(r, &p); e != nil {
		return false, e
	}
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	actual, e := cleanSymbolic(xs[0])
	if e != nil {
		return false, e
	}
	expected, e := cleanSymbolic(p.Expected)
	if e != nil {
		return false, e
	}
	if r.Validator == "indexed-expression" {
		return symbolicEquivalent(actual, expected, nil, nil, p.Variables, p.Sequences)
	}
	left, e := parseSum(actual, 0)
	if e != nil {
		return false, e
	}
	right, e := parseSum(expected, 0)
	if e != nil {
		return false, e
	}
	if e = validateSumNode(left, nil, p.Variables, p.Sequences); e != nil {
		return false, e
	}
	if p.AllowFiniteExpansion {
		budget := 256
		left, e = expandFiniteSum(left, p.Variables, p.Sequences, &budget)
		if e != nil {
			return false, e
		}
		budget = 256
		right, e = expandFiniteSum(right, p.Variables, p.Sequences, &budget)
		if e != nil {
			return false, e
		}
		left, right = collectSumTerms(left), collectSumTerms(right)
	}
	return sameSum(left, right, nil, nil, p.Variables, p.Sequences)
}
