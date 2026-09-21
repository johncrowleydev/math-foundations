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
	sets       []string
}

var quantifiedToken = regexp.MustCompile(`[A-Za-z][A-Za-z_0-9]*|\d+(?:\.\d+)?|<=|>=|!=|[!&|@#(),.:+*/^=<>-]|\S`)
var quantifiedDomain = regexp.MustCompile(`\\mathbb\{([NZQRDC])\}`)
var identifierToken = regexp.MustCompile(`[A-Za-z][A-Za-z_0-9]*`)

func quantifiedTokens(s string) ([]string, error) {
	if len(s) > 4096 {
		return nil, errors.New("Use a shorter quantified formula")
	}
	s = quantifiedDomain.ReplaceAllString(strings.Trim(strings.TrimSpace(s), "$"), " $1 ")
	s = strings.NewReplacer("\\left", "", "\\right", "", "\\forall", " forall ", "∀", " forall ", "\\exists", " exists ", "∃", " exists ", "\\notin", " notin ", "∉", " notin ", "\\in", " in ", "∈", " in ", "\\neg", " ! ", "\\lnot", " ! ", "¬", " ! ", "~", " ! ", "\\land", " & ", "\\wedge", " & ", "∧", " & ", "&&", " & ", "\\lor", " | ", "\\vee", " | ", "∨", " | ", "||", " | ", "\\leftrightarrow", " @ ", "\\iff", " @ ", "↔", " @ ", "<->", " @ ", "<=>", " @ ", "\\rightarrow", " # ", "\\implies", " # ", "\\to", " # ", "→", " # ", "->", " # ", "=>", " # ", "\\leq", " <= ", "\\le", " <= ", "≤", " <= ", "\\geq", " >= ", "\\ge", " >= ", "≥", " >= ", "\\neq", " != ", "\\ne", " != ", "≠", " != ", "\\,", " ", "\\;", " ", "\\!", " ", "\\quad", " ", "\\qquad", " ", "\\ ", " ", "{", "(", "[", "(", "}", ")", "]", ")", "−", "-").Replace(s)
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
		var domain, restrictedSet string
		if p.take("in") {
			domain = p.peek()
			p.at++
			if !contains(p.domains, domain) {
				if len(p.domains) != 1 || !contains(p.sets, domain) || p.predicates[domain] != 1 {
					return nil, errors.New("Use a stated variable domain")
				}
				restrictedSet, domain = domain, p.domains[0]
			}
		} else if len(p.domains) == 1 {
			domain = p.domains[0]
		} else {
			return nil, errors.New("Include each quantified variable domain")
		}
		if enum(p.peek(), ".", ":", ",") {
			p.at++
		}
		body, e := p.binary(1)
		if e != nil {
			return nil, e
		}
		if restrictedSet != "" {
			guard := &quantifiedNode{kind: "predicate", name: restrictedSet, args: []string{v}}
			kind := "and"
			if q == "forall" {
				// Encode the implicit implication in NNF so form checks inspect
				// the learner's syntax rather than rejecting the generated guard.
				kind = "or"
				guard = &quantifiedNode{kind: "not", body: guard}
			}
			body = &quantifiedNode{kind: kind, left: guard, right: body}
		}
		return &quantifiedNode{kind: "quantifier", quantifier: q, variable: v, domain: domain, body: body}, e
	}
	if p.take("!") {
		body, e := p.unary()
		return &quantifiedNode{kind: "not", body: body}, e
	}
	if p.peek() == "(" && !p.arithmeticGroup() && p.take("(") {
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
func (p *quantifiedParser) arithmeticGroup() bool {
	if p.peek() != "(" {
		return false
	}
	depth := 0
	for i := p.at; i < len(p.tokens); i++ {
		if p.tokens[i] == "(" {
			depth++
		}
		if p.tokens[i] == ")" {
			depth--
		}
		if depth == 0 {
			return i+1 < len(p.tokens) && enum(p.tokens[i+1], "+", "-", "*", "/", "^", "=", "!=", "<", "<=", ">", ">=", "in", "notin")
		}
	}
	return false
}
func (p *quantifiedParser) atom() (*quantifiedNode, error) {
	first := p.peek()
	if arity, ok := p.predicates[first]; ok && arity == 0 && (p.at+1 >= len(p.tokens) || p.tokens[p.at+1] != "(") {
		p.at++
		return &quantifiedNode{kind: "predicate", name: first, args: []string{}}, nil
	}
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
		if arity == 0 && len(args) == 1 && strings.TrimSpace(args[0]) == "" {
			args = nil
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
	membership := -1
	for i, t := range raw {
		if enum(t, "in", "notin") {
			membership = i
			break
		}
	}
	if membership > 0 && membership == len(raw)-2 {
		set := raw[len(raw)-1]
		if !contains(p.sets, set) || p.predicates[set] != 1 {
			return nil, errors.New("Use one of the named sets")
		}
		member := &quantifiedNode{kind: "predicate", name: set, args: []string{strings.Join(raw[:membership], " ")}}
		if raw[membership] == "notin" {
			return &quantifiedNode{kind: "not", body: member}, nil
		}
		return member, nil
	}
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
func validateQuantified(n *quantifiedNode, bound []string, functions map[string]int, integers []string, extended bool) error {
	expression := func(source string) error {
		if extended {
			allowed := []string{}
			for _, v := range integers {
				if contains(bound, v) {
					allowed = append(allowed, v)
				}
			}
			_, _, e := prepareExtendedExpressions([]string{source}, expressionParams{Variables: bound, IntegerVariables: allowed})
			return e
		}
		_, e := logicalExpression(source, bound, functions, new([]functionTerm), 0)
		return e
	}
	switch n.kind {
	case "quantifier":
		next := append([]string{}, integers...)
		if enum(n.domain, "N", "Z") {
			next = append(next, n.variable)
		}
		return validateQuantified(n.body, append(append([]string{}, bound...), n.variable), functions, next, extended)
	case "not":
		return validateQuantified(n.body, bound, functions, integers, extended)
	case "predicate":
		for _, source := range n.args {
			if e := expression(source); e != nil {
				return e
			}
		}
		return nil
	case "comparison":
		if e := expression(n.leftText); e != nil {
			return e
		}
		return expression(n.rightText)
	default:
		if e := validateQuantified(n.left, bound, functions, integers, extended); e != nil {
			return e
		}
		return validateQuantified(n.right, bound, functions, integers, extended)
	}
}
func expandQuantifiedUnique(root *quantifiedNode, tokens []string) (*quantifiedNode, error) {
	budget, fresh := 4096, 0
	var replace func(*quantifiedNode, string, string) *quantifiedNode
	replace = func(n *quantifiedNode, old, replacement string) *quantifiedNode {
		budget--
		if budget < 0 || n == nil {
			return nil
		}
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
				result.body = replace(n.body, old, replacement)
			}
		case "not":
			result.body = replace(n.body, old, replacement)
		case "predicate":
			result.args = []string{}
			for _, s := range n.args {
				result.args = append(result.args, swap(s))
			}
		case "comparison":
			result.leftText = swap(n.leftText)
			result.rightText = swap(n.rightText)
		default:
			result.left = replace(n.left, old, replacement)
			result.right = replace(n.right, old, replacement)
		}
		return &result
	}
	var expand func(*quantifiedNode) *quantifiedNode
	expand = func(n *quantifiedNode) *quantifiedNode {
		budget--
		if budget < 0 || n == nil {
			return nil
		}
		result := *n
		switch n.kind {
		case "quantifier":
			result.body = expand(n.body)
			if n.quantifier == "unique" {
				other := ""
				for {
					other = "uniqueBound" + strconv.Itoa(fresh)
					fresh++
					if !contains(tokens, other) {
						break
					}
				}
				result.quantifier = "exists"
				result.body = &quantifiedNode{kind: "and", left: result.body, right: &quantifiedNode{kind: "quantifier", quantifier: "forall", variable: other, domain: n.domain, body: &quantifiedNode{kind: "implies", left: replace(result.body, n.variable, other), right: &quantifiedNode{kind: "comparison", op: "=", leftText: other, rightText: n.variable}}}}
			}
		case "not":
			result.body = expand(n.body)
		case "and", "or", "implies", "iff":
			result.left = expand(n.left)
			result.right = expand(n.right)
		}
		return &result
	}
	result := expand(root)
	if budget < 0 {
		return nil, errors.New("Use a simpler quantified formula")
	}
	return result, nil
}
func parseQuantified(s string, domains []string, predicates map[string]int, options ...quantifiedParams) (*quantifiedNode, error) {
	ts, e := quantifiedTokens(s)
	if e != nil {
		return nil, e
	}
	o := quantifiedParams{}
	if len(options) > 0 {
		o = options[0]
	}
	p := quantifiedParser{tokens: ts, domains: domains, predicates: predicates, sets: o.Sets}
	n, e := p.binary(1)
	if e != nil {
		return nil, e
	}
	if p.at != len(ts) {
		return nil, errors.New("Check quantified formula syntax")
	}
	n, e = expandQuantifiedUnique(n, ts)
	if e != nil {
		return nil, e
	}
	available := append(append([]string{}, o.Constants...), o.FreeVariables...)
	return n, validateQuantified(n, available, o.Functions, o.IntegerVariables, len(o.IntegerVariables) > 0)
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
func renamedText(s string, bound, fixed []string, functions map[string]int) (string, []string, error) {
	vars := []string{}
	for i := range bound {
		vars = append(vars, "v"+strconv.Itoa(i))
	}
	for _, v := range fixed {
		vars = append(vars, "fixed_"+v)
	}
	result := ""
	position := 0
	for _, loc := range identifierToken.FindAllStringIndex(s, -1) {
		v := s[loc[0]:loc[1]]
		result += s[position:loc[0]]
		position = loc[1]
		if functions[v] > 0 && strings.HasPrefix(strings.TrimSpace(s[loc[1]:]), "(") {
			result += v
			continue
		}
		replacement := ""
		for i := len(bound) - 1; i >= 0; i-- {
			if bound[i] == v {
				replacement = "v" + strconv.Itoa(i)
				break
			}
		}
		if replacement == "" && contains(fixed, v) {
			replacement = "fixed_" + v
		}
		if replacement == "" {
			return "", nil, errors.New("Bind every variable with a quantifier")
		}
		result += replacement
	}
	result += s[position:]
	return result, vars, nil
}
func quantifiedExpressions(sources []string, bounds [][]string, domains, fixed, integerVariables []string, functions map[string]int) ([]rationalPoly, error) {
	renamed := []string{}
	var variables []string
	for i, source := range sources {
		value, vs, e := renamedText(source, bounds[i], fixed, functions)
		if e != nil {
			return nil, e
		}
		renamed = append(renamed, value)
		variables = vs
	}
	if len(integerVariables) > 0 {
		integers := []string{}
		for i, domain := range domains {
			if enum(domain, "N", "Z") {
				integers = append(integers, "v"+strconv.Itoa(i))
			}
		}
		for _, v := range fixed {
			if contains(integerVariables, v) {
				integers = append(integers, "fixed_"+v)
			}
		}
		ps, _, e := prepareExtendedExpressions(renamed, expressionParams{Variables: variables, IntegerVariables: integers})
		return ps, e
	}
	registry := []functionTerm{}
	ps := []rationalPoly{}
	for _, source := range renamed {
		p, e := logicalExpression(source, variables, functions, &registry, 0)
		if e != nil {
			return nil, e
		}
		ps = append(ps, p)
	}
	for i := range ps {
		ps[i] = padPolynomial(ps[i], ps[len(ps)-1].variables)
	}
	return ps, nil
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
func comparisonEqual(a, b *quantifiedNode, ab, bb, domains, fixed []string, functions map[string]int, integerVariables []string) (bool, error) {
	ps, e := quantifiedExpressions([]string{a.leftText, a.rightText, b.leftText, b.rightText}, [][]string{ab, ab, bb, bb}, domains, fixed, integerVariables, functions)
	if e != nil {
		return false, e
	}
	read := func(n *quantifiedNode, left, right rationalPoly) (string, rationalPoly, error) {
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
	x, aValue, e := read(a, ps[0], ps[1])
	if e != nil {
		return false, e
	}
	y, bValue, e := read(b, ps[2], ps[3])
	if e != nil {
		return false, e
	}
	aValue, bValue = commonPolynomials(aValue, bValue)
	integers := len(functions) == 0
	for _, v := range fixed {
		integers = integers && contains(integerVariables, v)
	}
	for _, v := range aValue.variables {
		if strings.HasPrefix(v, "DETX") {
			integers = false
		}
	}
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
func quantifiedEqual(a, b *quantifiedNode, ab, bb, domains, fixed []string, functions map[string]int, integerVariables []string) (bool, error) {
	if a.kind != b.kind {
		return false, nil
	}
	switch a.kind {
	case "quantifier":
		if a.quantifier != b.quantifier || a.domain != b.domain {
			return false, nil
		}
		return quantifiedEqual(a.body, b.body, append(append([]string{}, ab...), a.variable), append(append([]string{}, bb...), b.variable), append(append([]string{}, domains...), a.domain), fixed, functions, integerVariables)
	case "not":
		return quantifiedEqual(a.body, b.body, ab, bb, domains, fixed, functions, integerVariables)
	case "predicate":
		if a.name != b.name || len(a.args) != len(b.args) {
			return false, nil
		}
		for i, source := range a.args {
			ps, e := quantifiedExpressions([]string{source, b.args[i]}, [][]string{ab, bb}, domains, fixed, integerVariables, functions)
			if e != nil {
				return false, e
			}
			x, y := ps[0], ps[1]
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
		return comparisonEqual(a, b, ab, bb, domains, fixed, functions, integerVariables)
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
				ok, e := quantifiedEqual(n, m, ab, bb, domains, fixed, functions, integerVariables)
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
		ok, e := quantifiedEqual(a.left, b.left, ab, bb, domains, fixed, functions, integerVariables)
		if e != nil || !ok {
			return ok, e
		}
		return quantifiedEqual(a.right, b.right, ab, bb, domains, fixed, functions, integerVariables)
	}
	return false, fmt.Errorf("Unknown quantified node %s", a.kind)
}

type quantifiedParams struct {
	IntegerVariables []string       `json:"integerVariables"`
	Sets             []string       `json:"sets"`
	Expected         string         `json:"expected"`
	Domains          []string       `json:"domains"`
	Predicates       map[string]int `json:"predicates"`
	Form             string         `json:"form"`
	Constants        []string       `json:"constants"`
	FreeVariables    []string       `json:"freeVariables"`
	Alternatives     []string       `json:"alternatives"`
	Functions        map[string]int `json:"functions"`
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
	actual, e := parseQuantified(xs[0], p.Domains, p.Predicates, p)
	if e != nil {
		return false, e
	}
	if p.Form == "negations-on-atoms" && !actual.negationsOnAtoms() {
		return false, nil
	}
	if p.Form == "nnf" && !actual.nnf() {
		return false, nil
	}
	budget := 4096
	actual, e = quantifiedNormalForm(actual, false, &budget)
	if e != nil {
		return false, e
	}
	fixed := append(append([]string{}, p.Constants...), p.FreeVariables...)
	for _, target := range append([]string{p.Expected}, p.Alternatives...) {
		expected, e := parseQuantified(target, p.Domains, p.Predicates, p)
		if e != nil {
			return false, e
		}
		budget = 4096
		expected, e = quantifiedNormalForm(expected, false, &budget)
		if e != nil {
			return false, e
		}
		ok, e := quantifiedEqual(actual, expected, nil, nil, nil, fixed, p.Functions, p.IntegerVariables)
		if e != nil || ok {
			return ok, e
		}
	}
	return false, nil
}

func quantifiedNormalForm(n *quantifiedNode, negate bool, budget *int) (*quantifiedNode, error) {
	*budget--
	if *budget < 0 {
		return nil, errors.New("Use a simpler quantified formula")
	}
	result := *n
	switch n.kind {
	case "not":
		return quantifiedNormalForm(n.body, !negate, budget)
	case "quantifier":
		if negate {
			if n.quantifier == "forall" {
				result.quantifier = "exists"
			} else {
				result.quantifier = "forall"
			}
		}
		body, e := quantifiedNormalForm(n.body, negate, budget)
		result.body = body
		return &result, e
	case "implies":
		return quantifiedNormalForm(&quantifiedNode{kind: "or", left: &quantifiedNode{kind: "not", body: n.left}, right: n.right}, negate, budget)
	case "iff":
		return quantifiedNormalForm(&quantifiedNode{kind: "and", left: &quantifiedNode{kind: "implies", left: n.left, right: n.right}, right: &quantifiedNode{kind: "implies", left: n.right, right: n.left}}, negate, budget)
	case "and", "or":
		if negate {
			if n.kind == "and" {
				result.kind = "or"
			} else {
				result.kind = "and"
			}
		}
		left, e := quantifiedNormalForm(n.left, negate, budget)
		if e != nil {
			return nil, e
		}
		right, e := quantifiedNormalForm(n.right, negate, budget)
		result.left, result.right = left, right
		return &result, e
	case "comparison":
		if negate {
			result.op = map[string]string{"=": "!=", "!=": "=", "<": ">=", "<=": ">", ">": "<=", ">=": "<"}[n.op]
		}
		return &result, nil
	default:
		if negate {
			return &quantifiedNode{kind: "not", body: n}, nil
		}
		return n, nil
	}
}

func (n *quantifiedNode) negationsOnAtoms() bool {
	switch n.kind {
	case "not":
		return enum(n.body.kind, "predicate", "comparison")
	case "quantifier":
		return n.body.negationsOnAtoms()
	case "and", "or", "implies", "iff":
		return n.left.negationsOnAtoms() && n.right.negationsOnAtoms()
	default:
		return true
	}
}
