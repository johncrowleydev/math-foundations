package main

import (
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"strconv"
	"strings"
)

type quantifiedNode struct {
	kind, quantifier, variable, domain, name, op, leftText, rightText string
	body, left, right                                                 *quantifiedNode
	args                                                              []string
}
type quantifiedParser struct {
	tokens     []string
	at, depth  int
	domains    []string
	predicates map[string]int
}

var quantifiedToken = regexp.MustCompile(`[A-Za-z][A-Za-z_0-9]*|\d+(?:\.\d+)?|<=|>=|!=|[!&|@#(),.:+*/^=<>-]|\S`)
var quantifiedDomain = regexp.MustCompile(`\\mathbb\{([NZQRDC])\}`)
var identifierToken = regexp.MustCompile(`[A-Za-z][A-Za-z_0-9]*`)

func quantifiedTokens(s string) ([]string, error) {
	if len(s) > 4096 {
		return nil, errors.New("Use a shorter quantified formula")
	}
	s = quantifiedDomain.ReplaceAllString(strings.Trim(strings.TrimSpace(s), "$"), " $1 ")
	s = strings.NewReplacer("\\left", "", "\\right", "", "\\forall", " forall ", "∀", " forall ", "\\exists", " exists ", "∃", " exists ", "\\in", " in ", "∈", " in ", "\\neg", " ! ", "\\lnot", " ! ", "¬", " ! ", "~", " ! ", "\\land", " & ", "\\wedge", " & ", "∧", " & ", "&&", " & ", "\\lor", " | ", "\\vee", " | ", "∨", " | ", "||", " | ", "\\leftrightarrow", " @ ", "\\iff", " @ ", "↔", " @ ", "<->", " @ ", "<=>", " @ ", "\\rightarrow", " # ", "\\implies", " # ", "\\to", " # ", "→", " # ", "->", " # ", "=>", " # ", "\\leq", " <= ", "\\le", " <= ", "≤", " <= ", "\\geq", " >= ", "\\ge", " >= ", "≥", " >= ", "\\neq", " != ", "\\ne", " != ", "≠", " != ", "\\,", " ", "\\;", " ", "\\!", " ", "\\quad", " ", "\\qquad", " ", "\\ ", " ", "{", "(", "[", "(", "}", ")", "]", ")", "−", "-").Replace(s)
	ts := quantifiedToken.FindAllString(s, -1)
	if len(ts) > 1024 {
		return nil, errors.New("Use a shorter quantified formula")
	}
	for i, t := range ts {
		switch t {
		case "not":
			ts[i] = "!"
		case "and":
			ts[i] = "&"
		case "or":
			ts[i] = "|"
		}
	}
	return ts, nil
}
func (p *quantifiedParser) peek() string {
	if p.at >= len(p.tokens) {
		return ""
	}
	return p.tokens[p.at]
}
func (p *quantifiedParser) take(s string) bool {
	if p.peek() == s {
		p.at++
		return true
	}
	return false
}
func (p *quantifiedParser) binary(min int) (*quantifiedNode, error) {
	n, e := p.unary()
	if e != nil {
		return nil, e
	}
	levels := map[string]int{"@": 1, "#": 2, "|": 3, "&": 4}
	for {
		op := p.peek()
		level := levels[op]
		if level == 0 || level < min {
			break
		}
		p.at++
		next := level + 1
		if op == "#" {
			next = level
		}
		right, e := p.binary(next)
		if e != nil {
			return nil, e
		}
		kind := map[string]string{"@": "iff", "#": "implies", "|": "or", "&": "and"}[op]
		n = &quantifiedNode{kind: kind, left: n, right: right}
	}
	return n, nil
}
func (p *quantifiedParser) unary() (*quantifiedNode, error) {
	p.depth++
	defer func() { p.depth-- }()
	if p.depth > 64 {
		return nil, errors.New("Formula is nested too deeply")
	}
	if enum(p.peek(), "forall", "exists") {
		q := p.peek()
		p.at++
		if q == "exists" && p.take("!") {
			q = "unique"
		}
		v := p.peek()
		p.at++
		if !regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]*$`).MatchString(v) {
			return nil, errors.New("Name the quantified variable")
		}
		if !p.take("in") {
			return nil, errors.New("Include each quantified variable domain")
		}
		domain := p.peek()
		p.at++
		if !contains(p.domains, domain) {
			return nil, errors.New("Use a stated variable domain")
		}
		if enum(p.peek(), ".", ":", ",") {
			p.at++
		}
		body, e := p.binary(1)
		return &quantifiedNode{kind: "quantifier", quantifier: q, variable: v, domain: domain, body: body}, e
	}
	if p.take("!") {
		body, e := p.unary()
		return &quantifiedNode{kind: "not", body: body}, e
	}
	if p.take("(") {
		n, e := p.binary(1)
		if e != nil {
			return nil, e
		}
		if !p.take(")") {
			return nil, errors.New("Close the quantified formula parentheses")
		}
		return n, nil
	}
	return p.atom()
}
func (p *quantifiedParser) atom() (*quantifiedNode, error) {
	first := p.peek()
	if arity, ok := p.predicates[first]; ok && p.at+1 < len(p.tokens) && p.tokens[p.at+1] == "(" {
		p.at += 2
		start, nesting := p.at, 0
		args := []string{}
		closed := false
		for p.at < len(p.tokens) {
			t := p.peek()
			if t == ")" && nesting == 0 {
				args = append(args, strings.Join(p.tokens[start:p.at], " "))
				p.at++
				closed = true
				break
			}
			if t == "," && nesting == 0 {
				args = append(args, strings.Join(p.tokens[start:p.at], " "))
				p.at++
				start = p.at
				continue
			}
			if t == "(" {
				nesting++
			}
			if t == ")" {
				nesting--
			}
			p.at++
		}
		if !closed || len(args) != arity {
			return nil, errors.New("Use the predicate's stated number of arguments")
		}
		for _, s := range args {
			if s == "" {
				return nil, errors.New("Complete each predicate argument")
			}
		}
		return &quantifiedNode{kind: "predicate", name: first, args: args}, nil
	}
	start, nesting := p.at, 0
	for p.at < len(p.tokens) {
		t := p.peek()
		if nesting == 0 && enum(t, "&", "|", "#", "@", ")") {
			break
		}
		if t == "(" {
			nesting++
		}
		if t == ")" {
			nesting--
		}
		p.at++
	}
	raw := p.tokens[start:p.at]
	at := -1
	for i, t := range raw {
		if enum(t, "<", "<=", "=", "!=", ">", ">=") {
			if at >= 0 {
				return nil, errors.New("Use one comparison per condition")
			}
			at = i
		}
	}
	if at < 0 {
		return nil, errors.New("Use a predicate or comparison")
	}
	return &quantifiedNode{kind: "comparison", op: raw[at], leftText: strings.Join(raw[:at], " "), rightText: strings.Join(raw[at+1:], " ")}, nil
}
func validateQuantified(n *quantifiedNode, bound []string) error {
	switch n.kind {
	case "quantifier":
		return validateQuantified(n.body, append(append([]string{}, bound...), n.variable))
	case "not":
		return validateQuantified(n.body, bound)
	case "predicate":
		for _, s := range n.args {
			if _, e := parsePolynomial(s, bound); e != nil {
				return e
			}
		}
		return nil
	case "comparison":
		if _, e := parsePolynomial(n.leftText, bound); e != nil {
			return e
		}
		_, e := parsePolynomial(n.rightText, bound)
		return e
	default:
		if e := validateQuantified(n.left, bound); e != nil {
			return e
		}
		return validateQuantified(n.right, bound)
	}
}
func replaceQuantifiedVariable(n *quantifiedNode, old, replacement string) *quantifiedNode {
	result := *n
	swap := func(s string) string {
		return identifierToken.ReplaceAllStringFunc(s, func(v string) string {
			if v == old {
				return replacement
			}
			return v
		})
	}
	switch n.kind {
	case "quantifier":
		if n.variable != old {
			result.body = replaceQuantifiedVariable(n.body, old, replacement)
		}
	case "not":
		result.body = replaceQuantifiedVariable(n.body, old, replacement)
	case "predicate":
		result.args = []string{}
		for _, s := range n.args {
			result.args = append(result.args, swap(s))
		}
	case "comparison":
		result.leftText = swap(n.leftText)
		result.rightText = swap(n.rightText)
	default:
		result.left = replaceQuantifiedVariable(n.left, old, replacement)
		result.right = replaceQuantifiedVariable(n.right, old, replacement)
	}
	return &result
}
func expandUnique(n *quantifiedNode, tokens []string, fresh *int) *quantifiedNode {
	result := *n
	switch n.kind {
	case "quantifier":
		result.body = expandUnique(n.body, tokens, fresh)
		if n.quantifier == "unique" {
			other := ""
			for {
				other = "uniqueBound" + strconv.Itoa(*fresh)
				*fresh++
				if !contains(tokens, other) {
					break
				}
			}
			result.quantifier = "exists"
			result.body = &quantifiedNode{kind: "and", left: result.body, right: &quantifiedNode{kind: "quantifier", quantifier: "forall", variable: other, domain: n.domain, body: &quantifiedNode{kind: "implies", left: replaceQuantifiedVariable(result.body, n.variable, other), right: &quantifiedNode{kind: "comparison", op: "=", leftText: other, rightText: n.variable}}}}
		}
	case "not":
		result.body = expandUnique(n.body, tokens, fresh)
	case "and", "or", "implies", "iff":
		result.left = expandUnique(n.left, tokens, fresh)
		result.right = expandUnique(n.right, tokens, fresh)
	}
	return &result
}
func parseQuantified(s string, domains []string, predicates map[string]int, fixed ...[]string) (*quantifiedNode, error) {
	ts, e := quantifiedTokens(s)
	if e != nil {
		return nil, e
	}
	p := quantifiedParser{tokens: ts, domains: domains, predicates: predicates}
	n, e := p.binary(1)
	if e != nil {
		return nil, e
	}
	if p.at != len(ts) {
		return nil, errors.New("Check quantified formula syntax")
	}
	n = expandUnique(n, ts, new(int))
	available := []string{}
	for _, xs := range fixed {
		available = append(available, xs...)
	}
	return n, validateQuantified(n, available)
}
func (n *quantifiedNode) nnf() bool {
	switch n.kind {
	case "quantifier":
		return n.body.nnf()
	case "not":
		return enum(n.body.kind, "predicate", "comparison")
	case "iff", "implies":
		return false
	case "and", "or":
		return n.left.nnf() && n.right.nnf()
	}
	return true
}
func renamedExpression(s string, bound []string, fixed []string) (rationalPoly, error) {
	vars := []string{}
	for i := range bound {
		vars = append(vars, "v"+strconv.Itoa(i))
	}
	for _, v := range fixed {
		vars = append(vars, "fixed_"+v)
	}
	missing := false
	s = identifierToken.ReplaceAllStringFunc(s, func(v string) string {
		for i := len(bound) - 1; i >= 0; i-- {
			if bound[i] == v {
				return "v" + strconv.Itoa(i)
			}
		}
		if contains(fixed, v) {
			return "fixed_" + v
		}
		missing = true
		return v
	})
	if missing {
		return rationalPoly{}, errors.New("Bind every variable with a quantifier")
	}
	return parsePolynomial(s, vars)
}
func integerComparison(op string, v rationalPoly) (string, rationalPoly) {
	if !enum(op, "<", "<=") || len(v.d) != 1 {
		return op, v
	}
	zero := zeroMonomial(len(v.variables))
	den, ok := v.d[zero]
	if !ok {
		return op, v
	}
	coefs := map[string]*big.Int{}
	gcd := new(big.Int)
	for k, c := range v.n {
		x, e := c.div(den)
		if e != nil {
			return op, v
		}
		q, ok := x.rat()
		if !ok || !q.IsInt() {
			return op, v
		}
		coefs[k] = q.Num()
		if k != zero {
			gcd.GCD(nil, nil, gcd, q.Num())
		}
	}
	if gcd.Sign() == 0 {
		return op, v
	}
	threshold := new(big.Int)
	if coefs[zero] != nil {
		threshold.Neg(coefs[zero])
	}
	if op == "<" {
		threshold.Sub(threshold, big.NewInt(1))
	}
	floor := new(big.Int).Div(threshold, gcd)
	poly := exactPoly{}
	for k, c := range coefs {
		if k != zero {
			poly[k] = exactRat(new(big.Rat).SetInt(new(big.Int).Quo(c, gcd)))
		}
	}
	if floor.Sign() != 0 {
		poly[zero] = exactRat(new(big.Rat).SetInt(new(big.Int).Neg(floor)))
	}
	v.n = poly
	v.d = polyConst(exactInt(1), len(v.variables))
	return "<=", v
}
func comparisonEqual(a, b *quantifiedNode, ab, bb, domains, fixed []string) (bool, error) {
	read := func(n *quantifiedNode, bound []string) (string, rationalPoly, error) {
		left, e := renamedExpression(n.leftText, bound, fixed)
		if e != nil {
			return "", left, e
		}
		right, e := renamedExpression(n.rightText, bound, fixed)
		if e != nil {
			return "", right, e
		}
		op := n.op
		if op == ">" {
			op = "<"
			left, right = right, left
		}
		if op == ">=" {
			op = "<="
			left, right = right, left
		}
		v, e := left.combine(right, "-")
		return op, v, e
	}
	x, aValue, e := read(a, ab)
	if e != nil {
		return false, e
	}
	y, bValue, e := read(b, bb)
	if e != nil {
		return false, e
	}
	integers := len(fixed) == 0
	for _, d := range domains {
		integers = integers && enum(d, "N", "Z")
	}
	if integers {
		x, aValue = integerComparison(x, aValue)
		y, bValue = integerComparison(y, bValue)
	}
	if x != y {
		return false, nil
	}
	same, e := samePolynomialDomain(aValue, bValue, nil)
	if e != nil || !same {
		return same, e
	}
	if aValue.equal(bValue) {
		return true, nil
	}
	if enum(x, "=", "!=") {
		neg := bValue
		neg.n = polyNeg(neg.n)
		if aValue.equal(neg) {
			return true, nil
		}
	}
	for k, c := range aValue.n {
		if other, ok := bValue.n[k]; ok {
			ratio, e := c.div(other)
			if e != nil {
				return false, e
			}
			if !enum(x, "=", "!=") {
				sign, e := ratio.sign()
				if e != nil {
					return false, e
				}
				if sign <= 0 {
					return false, nil
				}
			}
			scaled, e := bValue.combine(constantPoly(ratio, bValue.variables), "*")
			if e != nil {
				return false, e
			}
			return aValue.equal(scaled), nil
		}
	}
	return false, nil
}
func quantifiedEqual(a, b *quantifiedNode, ab, bb, domains, fixed []string) (bool, error) {
	if a.kind != b.kind {
		return false, nil
	}
	switch a.kind {
	case "quantifier":
		if a.quantifier != b.quantifier || a.domain != b.domain {
			return false, nil
		}
		return quantifiedEqual(a.body, b.body, append(append([]string{}, ab...), a.variable), append(append([]string{}, bb...), b.variable), append(append([]string{}, domains...), a.domain), fixed)
	case "not":
		return quantifiedEqual(a.body, b.body, ab, bb, domains, fixed)
	case "predicate":
		if a.name != b.name || len(a.args) != len(b.args) {
			return false, nil
		}
		for i, s := range a.args {
			x, e := renamedExpression(s, ab, fixed)
			if e != nil {
				return false, e
			}
			y, e := renamedExpression(b.args[i], bb, fixed)
			if e != nil {
				return false, e
			}
			if !x.equal(y) {
				return false, nil
			}
			same, e := samePolynomialDomain(x, y, nil)
			if e != nil || !same {
				return same, e
			}
		}
		return true, nil
	case "comparison":
		return comparisonEqual(a, b, ab, bb, domains, fixed)
	case "and", "or":
		var flatten func(*quantifiedNode, string) []*quantifiedNode
		flatten = func(n *quantifiedNode, k string) []*quantifiedNode {
			if n.kind == k {
				return append(flatten(n.left, k), flatten(n.right, k)...)
			}
			return []*quantifiedNode{n}
		}
		left, right := flatten(a, a.kind), flatten(b, b.kind)
		if len(left) != len(right) {
			return false, nil
		}
		used := make([]bool, len(right))
		for _, n := range left {
			found := false
			for i, m := range right {
				if used[i] {
					continue
				}
				ok, e := quantifiedEqual(n, m, ab, bb, domains, fixed)
				if e != nil {
					return false, e
				}
				if ok {
					used[i] = true
					found = true
					break
				}
			}
			if !found {
				return false, nil
			}
		}
		return true, nil
	case "implies", "iff":
		ok, e := quantifiedEqual(a.left, b.left, ab, bb, domains, fixed)
		if e != nil || !ok {
			return ok, e
		}
		return quantifiedEqual(a.right, b.right, ab, bb, domains, fixed)
	}
	return false, fmt.Errorf("Unknown quantified node %s", a.kind)
}

type quantifiedParams struct {
	Expected      string         `json:"expected"`
	Domains       []string       `json:"domains"`
	Predicates    map[string]int `json:"predicates"`
	Form          string         `json:"form"`
	Constants     []string       `json:"constants"`
	FreeVariables []string       `json:"freeVariables"`
	Alternatives  []string       `json:"alternatives"`
}

func checkQuantified(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p quantifiedParams
	if e := jsonParams(r, &p); e != nil {
		return false, e
	}
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	actual, e := parseQuantified(xs[0], p.Domains, p.Predicates, p.Constants, p.FreeVariables)
	if e != nil {
		return false, e
	}
	if p.Form == "nnf" && !actual.nnf() {
		return false, nil
	}
	fixed := append(append([]string{}, p.Constants...), p.FreeVariables...)
	for _, target := range append([]string{p.Expected}, p.Alternatives...) {
		expected, e := parseQuantified(target, p.Domains, p.Predicates, fixed)
		if e != nil {
			return false, e
		}
		ok, e := quantifiedEqual(actual, expected, nil, nil, nil, fixed)
		if e != nil || ok {
			return ok, e
		}
	}
	return false, nil
}
