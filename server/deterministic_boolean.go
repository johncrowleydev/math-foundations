package main

import (
	"encoding/json"
	"errors"
	"strings"
	"unicode"
)

type boolNode struct {
	op          string
	left, right *boolNode
}
type boolParser struct {
	tokens    []string
	at, depth int
	variables map[string]bool
}

func boolTokens(s string) ([]string, error) {
	if len(s) > 4096 {
		return nil, errors.New("Formula is too long")
	}
	s = strings.Trim(strings.TrimSpace(s), "$")
	s = strings.NewReplacer("\\left", "", "\\right", "", "\\leftrightarrow", "<->", "\\Leftrightarrow", "<->", "\\iff", "<->", "↔", "<->", "⇔", "<->", "\\rightarrow", "->", "\\Rightarrow", "->", "\\implies", "->", "\\to", "->", "→", "->", "⇒", "->", "\\wedge", "&", "\\land", "&", "∧", "&", "\\vee", "|", "\\lor", "|", "∨", "|", "\\neg", "!", "\\lnot", "!", "¬", "!", "~", "!", "&&", "&", "||", "|", "<=>", "<->", "=>", "->", "\\top", "true", "\\bot", "false", "\\,", " ", "\\;", " ").Replace(s)
	r := []rune(s)
	ts := []string{}
	for i := 0; i < len(r); {
		if unicode.IsSpace(r[i]) {
			i++
			continue
		}
		if i+3 <= len(r) && string(r[i:i+3]) == "<->" {
			ts = append(ts, "<->")
			i += 3
		} else if i+2 <= len(r) && string(r[i:i+2]) == "->" {
			ts = append(ts, "->")
			i += 2
		} else if strings.ContainsRune("!&|(){}", r[i]) {
			ts = append(ts, string(r[i]))
			i++
		} else if unicode.IsLetter(r[i]) {
			j := i + 1
			for j < len(r) && (unicode.IsLetter(r[j]) || unicode.IsDigit(r[j]) || r[j] == '_') {
				j++
			}
			t := string(r[i:j])
			switch strings.ToLower(t) {
			case "and":
				t = "&"
			case "or":
				t = "|"
			case "not":
				t = "!"
			case "true":
				t = "true"
			case "false":
				t = "false"
			}
			ts = append(ts, t)
			i = j
		} else {
			return nil, errors.New("Unsupported logical notation")
		}
		if len(ts) > 1024 {
			return nil, errors.New("Formula is too complex")
		}
	}
	return ts, nil
}
func (p *boolParser) peek() string {
	if p.at >= len(p.tokens) {
		return ""
	}
	return p.tokens[p.at]
}
func (p *boolParser) binary(min int) (*boolNode, error) {
	p.depth++
	defer func() { p.depth-- }()
	if p.depth > 64 {
		return nil, errors.New("Formula is too deeply nested")
	}
	left, e := p.atom()
	if e != nil {
		return nil, e
	}
	precedence := map[string]int{"<->": 1, "->": 2, "|": 3, "&": 4}
	for {
		op := p.peek()
		level := precedence[op]
		if level == 0 || level < min {
			break
		}
		p.at++
		next := level + 1
		if op == "->" {
			next = level
		}
		right, e := p.binary(next)
		if e != nil {
			return nil, e
		}
		left = &boolNode{op, left, right}
	}
	return left, nil
}
func (p *boolParser) atom() (*boolNode, error) {
	t := p.peek()
	if t == "" {
		return nil, errors.New("Complete the formula")
	}
	p.at++
	if t == "!" {
		if p.depth > 64 {
			return nil, errors.New("Formula is too deeply nested")
		}
		p.depth++
		v, e := p.atom()
		p.depth--
		return &boolNode{"!", v, nil}, e
	}
	if t == "(" || t == "{" {
		close := ")"
		if t == "{" {
			close = "}"
		}
		v, e := p.binary(1)
		if e != nil {
			return nil, e
		}
		if p.peek() != close {
			return nil, errors.New("Close the formula parentheses")
		}
		p.at++
		return v, nil
	}
	if p.variables[t] {
		return &boolNode{op: t}, nil
	}
	return nil, errors.New("Use only the stated proposition variables")
}
func parseBoolean(s string, variables []string) (*boolNode, error) {
	ts, e := boolTokens(s)
	if e != nil {
		return nil, e
	}
	p := boolParser{tokens: ts, variables: map[string]bool{}}
	for _, v := range variables {
		p.variables[v] = true
	}
	n, e := p.binary(1)
	if e != nil {
		return nil, e
	}
	if p.at != len(ts) {
		return nil, errors.New("Unexpected logical formula suffix")
	}
	return n, nil
}
func (n *boolNode) value(values map[string]bool) bool {
	switch n.op {
	case "true":
		return true
	case "false":
		return false
	case "!":
		return !n.left.value(values)
	case "&":
		return n.left.value(values) && n.right.value(values)
	case "|":
		return n.left.value(values) || n.right.value(values)
	case "->":
		return !n.left.value(values) || n.right.value(values)
	case "<->":
		return n.left.value(values) == n.right.value(values)
	}
	return values[n.op]
}
func (n *boolNode) form(form string) bool {
	if n == nil {
		return true
	}
	if form == "nnf" && n.op == "!" && n.left.left != nil {
		return false
	}
	if enum(form, "nnf", "no-implication") && enum(n.op, "->", "<->") {
		return false
	}
	return n.left.form(form) && n.right.form(form)
}
func (n *boolNode) structure() string {
	if n == nil {
		return ""
	}
	return n.op + "(" + n.left.structure() + "," + n.right.structure() + ")"
}
func checkBooleanRequirement(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p struct {
		Expected         string   `json:"expected"`
		Variables        []string `json:"variables"`
		Form             string   `json:"form"`
		Structure        string   `json:"structure"`
		MaxNodes         int      `json:"maxNodes"`
		NegationsOnAtoms bool     `json:"negationsOnAtoms"`
	}
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	n, e := parseBoolean(xs[0], p.Variables)
	if e != nil {
		return false, e
	}
	want, e := parseBoolean(p.Expected, p.Variables)
	if e != nil {
		return false, e
	}
	if p.MaxNodes > 0 && n.nodes() > p.MaxNodes {
		return false, nil
	}
	if p.NegationsOnAtoms && !n.negationsOnAtoms() {
		return false, nil
	}
	if !n.form(p.Form) {
		return false, nil
	}
	if p.Form == "contrapositive" && n.op != "->" {
		return false, nil
	}
	if p.Structure != "" {
		shape, e := parseBoolean(p.Structure, p.Variables)
		if e != nil {
			return false, e
		}
		if !booleanStructure(n, shape, p.Variables) {
			return false, nil
		}
	}
	for mask := 0; mask < 1<<len(p.Variables); mask++ {
		values := map[string]bool{}
		for i, v := range p.Variables {
			values[v] = mask&(1<<i) != 0
		}
		if n.value(values) != want.value(values) {
			return false, nil
		}
	}
	return true, nil
}

func (n *boolNode) nodes() int {
	if n == nil {
		return 0
	}
	return 1 + n.left.nodes() + n.right.nodes()
}
func booleanEquivalent(a, b *boolNode, vars []string) bool {
	for row := 0; row < 1<<len(vars); row++ {
		values := map[string]bool{}
		for i, v := range vars {
			values[v] = row&(1<<i) != 0
		}
		if a.value(values) != b.value(values) {
			return false
		}
	}
	return true
}
func booleanStructure(a, b *boolNode, vars []string) bool {
	if a.op != b.op {
		return false
	}
	if a.left == nil {
		return true
	}
	if !booleanEquivalent(a.left, b.left, vars) {
		return false
	}
	return a.right == nil || booleanEquivalent(a.right, b.right, vars)
}

type booleanModelParams struct {
	Variables  map[string]string `json:"variables"`
	Conditions []struct {
		Formula string `json:"formula"`
		Value   bool   `json:"value"`
	} `json:"conditions"`
	Checks map[string]string `json:"checks"`
}

func booleanModel(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p booleanModelParams
	if json.Unmarshal(r.Params, &p) != nil {
		return false, errors.New("Invalid Boolean model")
	}
	vars := []string{}
	values := map[string]bool{}
	for v, f := range p.Variables {
		vars = append(vars, v)
		b, ok := response[f].(bool)
		if !ok {
			return false, errors.New("Choose all truth values")
		}
		values[v] = b
	}
	valid := true
	for _, c := range p.Conditions {
		n, e := parseBoolean(c.Formula, vars)
		if e != nil {
			return false, e
		}
		valid = valid && n.value(values) == c.Value
	}
	for f, s := range p.Checks {
		n, e := parseBoolean(s, vars)
		if e != nil {
			return false, e
		}
		b, ok := response[f].(bool)
		if !ok {
			return false, errors.New("Choose all formula truth values")
		}
		valid = valid && n.value(values) == b
	}
	return valid, nil
}

func (n *boolNode) negationsOnAtoms() bool {
	if n == nil {
		return true
	}
	if n.op == "!" && n.left.left != nil {
		return false
	}
	return n.left.negationsOnAtoms() && n.right.negationsOnAtoms()
}
