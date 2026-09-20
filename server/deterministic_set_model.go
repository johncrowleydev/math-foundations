package main

import (
	"errors"
	"regexp"
	"strings"
)

type setExpression struct {
	kind, name  string
	left, right *setExpression
}

var setTokens = regexp.MustCompile(`[A-Za-z][A-Za-z0-9_]*|\d+(?:\.\d*)?|[^\s]`)

func parseSetExpression(source string, variables []string) (*setExpression, error) {
	if len(source) > 4096 {
		return nil, errors.New("Use a shorter set expression")
	}
	s := strings.Trim(strings.TrimSpace(source), "$")
	s = strings.NewReplacer(`\left`, "", `\right`, "", `\mathcal{P}`, "P", `\cup`, "|", "∪", "|", "union", "|", `\cap`, "&", "∩", "&", "intersection", "&", `\setminus`, "-", `\backslash`, "-", "∖", "-", `\times`, "*", "×", "*", `\emptyset`, "{}", `\varnothing`, "{}", "∅", "{}", `\{`, "{", `\}`, "}").Replace(s)
	s = regexp.MustCompile(`\^\{?c\}?`).ReplaceAllString(s, "'")
	s = regexp.MustCompile(`\\(?:overline|bar)\{([^{}]+)\}`).ReplaceAllString(s, "!($1)")
	s = strings.ReplaceAll(s, `\`, "-")
	tokens := setTokens.FindAllString(s, -1)
	if len(tokens) > 1024 {
		return nil, errors.New("Use a shorter set expression")
	}
	at := 0
	take := func(s string) bool {
		if at < len(tokens) && tokens[at] == s {
			at++
			return true
		}
		return false
	}
	peek := func() string {
		if at < len(tokens) {
			return tokens[at]
		}
		return ""
	}
	var atom, product, meet, union func(int) (*setExpression, error)
	atom = func(depth int) (*setExpression, error) {
		if depth > 64 {
			return nil, errors.New("Use fewer nested set operations")
		}
		var n *setExpression
		if take("!") {
			body, e := atom(depth + 1)
			if e != nil {
				return nil, e
			}
			n = &setExpression{kind: "complement", left: body}
		} else if take("(") {
			body, e := union(depth + 1)
			if e != nil {
				return nil, e
			}
			if !take(")") {
				return nil, errors.New("Close the set expression parenthesis")
			}
			n = body
		} else if peek() == "P" && at+1 < len(tokens) && tokens[at+1] == "(" {
			at += 2
			body, e := union(depth + 1)
			if e != nil {
				return nil, e
			}
			if !take(")") {
				return nil, errors.New("Close P(...)")
			}
			n = &setExpression{kind: "power", left: body}
		} else if peek() == "{" {
			start := at
			at++
			depth := 1
			for at < len(tokens) && depth > 0 {
				if tokens[at] == "{" {
					depth++
				}
				if tokens[at] == "}" {
					depth--
				}
				at++
			}
			if depth != 0 {
				return nil, errors.New("Close the finite set")
			}
			n = &setExpression{kind: "literal", name: strings.Join(tokens[start:at], "")}
		} else {
			name := peek()
			if !contains(variables, name) {
				return nil, errors.New("Use the named sets and union, intersection, difference, or complement")
			}
			at++
			n = &setExpression{kind: "variable", name: name}
		}
		for take("'") {
			n = &setExpression{kind: "complement", left: n}
		}
		return n, nil
	}
	product = func(d int) (*setExpression, error) {
		n, e := atom(d)
		if e != nil {
			return nil, e
		}
		for take("*") {
			right, e := atom(d)
			if e != nil {
				return nil, e
			}
			n = &setExpression{kind: "product", left: n, right: right}
		}
		return n, nil
	}
	meet = func(d int) (*setExpression, error) {
		n, e := product(d)
		if e != nil {
			return nil, e
		}
		for peek() == "&" || peek() == "-" {
			op := peek()
			at++
			right, e := product(d)
			if e != nil {
				return nil, e
			}
			kind := "intersection"
			if op == "-" {
				kind = "difference"
			}
			n = &setExpression{kind: kind, left: n, right: right}
		}
		return n, nil
	}
	union = func(d int) (*setExpression, error) {
		n, e := meet(d)
		if e != nil {
			return nil, e
		}
		for take("|") {
			right, e := meet(d)
			if e != nil {
				return nil, e
			}
			n = &setExpression{kind: "union", left: n, right: right}
		}
		return n, nil
	}
	n, e := union(0)
	if e == nil && at != len(tokens) {
		e = errors.New("Check the set operation syntax")
	}
	return n, e
}
func setMembership(n *setExpression, values map[string]bool) (bool, error) {
	switch n.kind {
	case "variable":
		return values[n.name], nil
	case "literal":
		if n.name == "{}" {
			return false, nil
		}
	case "complement":
		v, e := setMembership(n.left, values)
		return !v, e
	case "union", "intersection", "difference":
		a, e := setMembership(n.left, values)
		if e != nil {
			return false, e
		}
		b, e := setMembership(n.right, values)
		if e != nil {
			return false, e
		}
		if n.kind == "union" {
			return a || b, nil
		}
		if n.kind == "intersection" {
			return a && b, nil
		}
		return a && !b, nil
	}
	return false, errors.New("Use union, intersection, difference, and complement for this set identity")
}
func finiteSet(s string, atoms []string) (*setNode, error) {
	n, e := parseSetNode(s, atoms, 0)
	if e != nil {
		return nil, e
	}
	if n.kind != "set" {
		return nil, errors.New("Use braces for a finite set, or {} for the empty set")
	}
	if len(n.members) > 256 {
		return nil, errors.New("Use at most 256 members")
	}
	return n, nil
}
func setContains(xs []*setNode, x *setNode) bool {
	for _, y := range xs {
		if setNodeEqual(x, y) {
			return true
		}
	}
	return false
}
func distinctSet(xs []*setNode) (*setNode, error) {
	out := &setNode{kind: "set"}
	for _, x := range xs {
		if !setContains(out.members, x) {
			out.members = append(out.members, x)
		}
	}
	if len(out.members) > 256 {
		return nil, errors.New("This finite set operation exceeds 256 members")
	}
	return out, nil
}
func evaluateSetExpression(n *setExpression, values map[string]*setNode, atoms []string) (*setNode, error) {
	switch n.kind {
	case "variable":
		return values[n.name], nil
	case "literal":
		return finiteSet(n.name, atoms)
	case "complement":
		return nil, errors.New("Express a finite complement relative to a universe, for example U-A")
	}
	a, e := evaluateSetExpression(n.left, values, atoms)
	if e != nil {
		return nil, e
	}
	if a.kind != "set" {
		return nil, errors.New("Set operations require sets")
	}
	if n.kind == "power" {
		if len(a.members) > 8 {
			return nil, errors.New("Use at most 8 members inside a power set")
		}
		xs := []*setNode{}
		for bits := 0; bits < (1 << len(a.members)); bits++ {
			x := &setNode{kind: "set"}
			for i, v := range a.members {
				if bits&(1<<i) != 0 {
					x.members = append(x.members, v)
				}
			}
			xs = append(xs, x)
		}
		return distinctSet(xs)
	}
	b, e := evaluateSetExpression(n.right, values, atoms)
	if e != nil {
		return nil, e
	}
	if b.kind != "set" {
		return nil, errors.New("Set operations require sets")
	}
	xs := []*setNode{}
	switch n.kind {
	case "union":
		xs = append(xs, a.members...)
		xs = append(xs, b.members...)
	case "intersection", "difference":
		for _, x := range a.members {
			has := setContains(b.members, x)
			if (n.kind == "intersection" && has) || (n.kind == "difference" && !has) {
				xs = append(xs, x)
			}
		}
	case "product":
		if len(a.members)*len(b.members) > 256 {
			return nil, errors.New("This Cartesian product exceeds 256 members")
		}
		for _, x := range a.members {
			for _, y := range b.members {
				xs = append(xs, &setNode{kind: "tuple", members: []*setNode{x, y}})
			}
		}
	default:
		return nil, errors.New("Unknown set operation")
	}
	return distinctSet(xs)
}

type setCondition struct{ Left, Right, Op string }
type setModelParams struct {
	Variables  map[string]string `json:"variables"`
	Conditions []setCondition    `json:"conditions"`
	Atoms      []string          `json:"atoms"`
}

func checkSetModel(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p setModelParams
	if e := jsonParams(r, &p); e != nil {
		return false, e
	}
	values := map[string]*setNode{}
	vars := []string{}
	for v, f := range p.Variables {
		s, ok := response[f].(string)
		if !ok {
			return false, errors.New("Enter the requested set")
		}
		n, e := finiteSet(s, p.Atoms)
		if e != nil {
			return false, e
		}
		values[v] = n
		vars = append(vars, v)
	}
	evaluate := func(s string) (*setNode, error) {
		n, e := parseSetExpression(s, vars)
		if e != nil {
			return nil, e
		}
		return evaluateSetExpression(n, values, p.Atoms)
	}
	all := true
	for _, c := range p.Conditions {
		a, e := evaluate(c.Left)
		if e != nil {
			return false, e
		}
		if c.Op == "nonempty" {
			all = all && len(a.members) > 0
			continue
		}
		b, e := evaluate(c.Right)
		if e != nil {
			return false, e
		}
		yes := false
		switch c.Op {
		case "=":
			yes = setNodeEqual(a, b)
		case "!=":
			yes = !setNodeEqual(a, b)
		case "same-size":
			yes = len(a.members) == len(b.members)
		case "subset":
			yes = true
			for _, x := range a.members {
				yes = setContains(b.members, x) && yes
			}
		default:
			return false, errors.New("Unknown set condition")
		}
		all = all && yes
	}
	return all, nil
}
func checkSetExpression(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p struct {
		Variables  []string
		Expected   string
		Operations []string
	}
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	a, e := parseSetExpression(xs[0], p.Variables)
	if e != nil {
		return false, e
	}
	b, e := parseSetExpression(p.Expected, p.Variables)
	if e != nil {
		return false, e
	}
	var uses func(*setExpression) bool
	uses = func(n *setExpression) bool {
		if n.kind == "variable" || n.kind == "literal" {
			return true
		}
		if len(p.Operations) > 0 && !contains(p.Operations, n.kind) {
			return false
		}
		return uses(n.left) && (n.right == nil || uses(n.right))
	}
	if !uses(a) {
		return false, nil
	}
	all := true
	for bits := 0; bits < (1 << len(p.Variables)); bits++ {
		values := map[string]bool{}
		for i, v := range p.Variables {
			values[v] = bits&(1<<i) != 0
		}
		x, e := setMembership(a, values)
		if e != nil {
			return false, e
		}
		y, e := setMembership(b, values)
		if e != nil {
			return false, e
		}
		all = all && x == y
	}
	return all, nil
}
func checkNestedObject(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p struct{ Atoms []string }
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	n, e := parseSetNode(xs[0], p.Atoms, 0)
	if e != nil {
		return false, e
	}
	counts := map[string]int{}
	var visit func(*setNode) bool
	visit = func(n *setNode) bool {
		if n.kind == "atom" {
			counts[n.atom]++
			return true
		}
		if n.kind != "tuple" || len(n.members) != 2 {
			return false
		}
		a, b := visit(n.members[0]), visit(n.members[1])
		return a && b
	}
	if !visit(n) {
		return false, nil
	}
	for _, v := range counts {
		if v > 1 {
			return true, nil
		}
	}
	return false, nil
}
func validateSetModelRequirement(r AssessmentRequirement) error {
	if r.Validator == "nested-object" {
		var p struct{ Atoms []string }
		if jsonParams(r, &p) != nil || len(r.Fields) != 1 || len(p.Atoms) < 1 || len(p.Atoms) > 64 {
			return errors.New("Invalid nested object definition")
		}
		for _, a := range p.Atoms {
			if !validIdentifier(a) {
				return errors.New("Invalid atom")
			}
		}
		return nil
	}
	if r.Validator == "set-expression" {
		var p struct {
			Variables []string
			Expected  string
		}
		if jsonParams(r, &p) != nil || len(r.Fields) != 1 || len(p.Variables) < 1 || len(p.Variables) > 8 {
			return errors.New("Invalid set expression definition")
		}
		for _, v := range p.Variables {
			if !validIdentifier(v) {
				return errors.New("Invalid set variable")
			}
		}
		n, e := parseSetExpression(p.Expected, p.Variables)
		if e != nil {
			return e
		}
		_, e = setMembership(n, map[string]bool{})
		return e
	}
	var p setModelParams
	if jsonParams(r, &p) != nil || len(p.Variables) < 1 || len(p.Variables) > 8 || len(p.Conditions) < 1 || len(p.Conditions) > 64 {
		return errors.New("Invalid finite set model")
	}
	vars := []string{}
	for v, f := range p.Variables {
		if !validIdentifier(v) || !contains(r.Fields, f) {
			return errors.New("Invalid model variable")
		}
		vars = append(vars, v)
	}
	for _, c := range p.Conditions {
		if !enum(c.Op, "=", "!=", "subset", "nonempty", "same-size") {
			return errors.New("Invalid set condition")
		}
		if _, e := parseSetExpression(c.Left, vars); e != nil {
			return e
		}
		if c.Op != "nonempty" {
			if _, e := parseSetExpression(c.Right, vars); e != nil {
				return e
			}
		}
	}
	return nil
}
func validIdentifier(s string) bool {
	return regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]*$`).MatchString(s)
}
func checkBooleanProperty(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p struct {
		Variables []string
		Property  string
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
	yes, no := false, false
	for bits := 0; bits < (1 << len(p.Variables)); bits++ {
		a := map[string]bool{}
		for i, v := range p.Variables {
			a[v] = bits&(1<<i) != 0
		}
		v := n.value(a)
		yes = yes || v
		no = no || !v
	}
	if p.Property == "contingent" {
		return yes && no, nil
	}
	if p.Property == "tautology" {
		return !no, nil
	}
	return !yes, nil
}
