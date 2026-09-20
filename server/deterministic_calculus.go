package main

// Bounded symbolic calculus, kept in conformance with shared/calculus.ts.
// Exact polynomial identities prove equality; numerical sampling never does.
import (
	"encoding/json"
	"errors"
	"math/big"
	"regexp"
	"strconv"
	"strings"
)

type calculusDomain struct {
	Positive    []string `json:"positive"`
	Nonnegative []string `json:"nonnegative"`
	Nonzero     []string `json:"nonzero"`
}
type calculusParams struct {
	Variables []string        `json:"variables"`
	Variable  string          `json:"variable"`
	Expected  string          `json:"expected"`
	Integrand string          `json:"integrand"`
	Mode      string          `json:"mode"`
	Domain    *calculusDomain `json:"domain"`
	Initial   *struct {
		At    string `json:"at"`
		Value string `json:"value"`
	} `json:"initial"`
}
type calcNode struct {
	op   string
	args []*calcNode
}

func cn(op string, args ...*calcNode) *calcNode { return &calcNode{op, args} }
func calcFail(s string)                         { panic(errors.New(s)) }
func calcMust[T any](v T, e error) T {
	if e != nil {
		panic(e)
	}
	return v
}
func calcRecover(e *error) {
	if p := recover(); p != nil {
		if err, ok := p.(error); ok {
			*e = err
		} else {
			panic(p)
		}
	}
}

var calcFunctions = []string{"sin", "cos", "tan", "sec", "csc", "cot", "asin", "acos", "atan", "exp", "ln", "sqrt", "abs"}
var calcTokens = regexp.MustCompile(`^([[:space:]]+|(?:\d+(?:\.\d*)?|\.\d+)|\\frac|[A-Za-z][A-Za-z_0-9]*|[()+*/^\-])`)
var calcTex = regexp.MustCompile(`\\(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|ln|exp|sqrt|pi)\b`)
var calcArc = regexp.MustCompile(`arc(sin|cos|tan)\b`)
var calcNumber = regexp.MustCompile(`^-?(\d|\.)`)

func calcParse(source string, variables []string) *calcNode {
	if strings.TrimSpace(source) == "" || len(source) > 2048 {
		calcFail("Enter a calculus expression of at most 2048 characters")
	}
	s := normalizeMath(source)
	s = strings.NewReplacer("{", "(", "}", ")", "\\lvert", "|", "\\rvert", "|", "π", "pi").Replace(s)
	s = calcTex.ReplaceAllString(s, " $1")
	s = calcArc.ReplaceAllString(s, "a$1")
	s = elementaryAbs.ReplaceAllString(s, "abs($1)")
	tokens := []string{}
	for len(s) > 0 {
		m := calcTokens.FindString(s)
		if m == "" {
			calcFail("Use numbers, declared variables, parentheses and supported calculus functions")
		}
		s = s[len(m):]
		if strings.TrimSpace(m) != "" {
			tokens = append(tokens, m)
		}
	}
	if len(tokens) > 256 {
		calcFail("Use a shorter expression (at most 256 tokens)")
	}
	at, depth := 0, 0
	peek := func() string {
		if at < len(tokens) {
			return tokens[at]
		}
		return ""
	}
	take := func(t string) bool {
		if peek() == t {
			at++
			return true
		}
		return false
	}
	var sum, product, unary, power, primary, group func() *calcNode
	group = func() *calcNode {
		if !take("(") {
			calcFail("Put function arguments in parentheses")
		}
		a := sum()
		if !take(")") {
			calcFail("Close the parentheses")
		}
		return a
	}
	primary = func() *calcNode {
		depth++
		if depth > 24 {
			calcFail("Use less deeply nested notation")
		}
		t := peek()
		var a *calcNode
		switch {
		case t == "(":
			a = group()
		case t == "\\frac":
			at++
			a = cn("/", group(), group())
		case enum(t, calcFunctions...):
			at++
			a = cn(t, group())
		case t != "" && (calcNumber.MatchString(t) || enum(t, variables...) || enum(t, "pi", "e", "C")):
			at++
			a = cn(t)
		default:
			calcFail("Use the declared variables and supported calculus functions")
		}
		depth--
		return a
	}
	power = func() *calcNode {
		a := primary()
		if take("^") {
			return cn("^", a, unary())
		}
		return a
	}
	unary = func() *calcNode {
		depth++
		if depth > 24 {
			calcFail("Use less deeply nested notation")
		}
		var a *calcNode
		if take("+") {
			a = unary()
		} else if take("-") {
			a = cn("*", cn("-1"), unary())
		} else {
			a = power()
		}
		depth--
		return a
	}
	product = func() *calcNode {
		a := unary()
		for {
			if take("*") {
				a = cn("*", a, unary())
			} else if take("/") {
				a = cn("/", a, unary())
			} else if t := peek(); t != "" && (t == "(" || regexp.MustCompile(`^[A-Za-z\\\d.]`).MatchString(t)) {
				a = cn("*", a, unary())
			} else {
				break
			}
		}
		return a
	}
	sum = func() *calcNode {
		a := product()
		for {
			if take("+") {
				a = cn("+", a, product())
			} else if take("-") {
				a = cn("+", a, cn("*", cn("-1"), product()))
			} else {
				break
			}
		}
		return a
	}
	a := sum()
	if at != len(tokens) {
		calcFail("Check the expression syntax")
	}
	return a
}
func calcConstant(a *calcNode) *big.Rat {
	if len(a.args) == 0 && calcNumber.MatchString(a.op) {
		x := calcMust(parseExact(a.op))
		q, ok := x.rat()
		if !ok {
			calcFail("Expected a rational constant")
		}
		return q
	}
	if len(a.args) == 0 {
		return nil
	}
	x := calcConstant(a.args[0])
	if x == nil {
		return nil
	}
	var y *big.Rat
	if len(a.args) > 1 {
		y = calcConstant(a.args[1])
	}
	if y == nil {
		return nil
	}
	switch a.op {
	case "+":
		return new(big.Rat).Add(x, y)
	case "*":
		return new(big.Rat).Mul(x, y)
	case "/":
		if y.Sign() == 0 {
			calcFail("Division by zero")
		}
		return new(big.Rat).Quo(x, y)
	case "^":
		if y.IsInt() && y.Num().IsInt64() && y.Num().Int64() >= -32 && y.Num().Int64() <= 32 {
			p := calcMust(exactRat(x).pow(int(y.Num().Int64())))
			q, _ := p.rat()
			return q
		}
	}
	return nil
}
func calcDerivative(a *calcNode, variable string) *calcNode {
	if len(a.args) == 0 {
		if a.op == variable {
			return cn("1")
		}
		return cn("0")
	}
	u := a.args[0]
	du := calcDerivative(u, variable)
	var v, dv *calcNode
	if len(a.args) > 1 {
		v = a.args[1]
		dv = calcDerivative(v, variable)
	}
	switch a.op {
	case "+":
		return cn("+", du, dv)
	case "*":
		return cn("+", cn("*", du, v), cn("*", u, dv))
	case "/":
		return cn("/", cn("+", cn("*", du, v), cn("*", cn("-1"), cn("*", u, dv))), cn("^", v, cn("2")))
	case "^":
		if calcConstant(v) != nil {
			return cn("*", cn("*", v, cn("^", u, cn("+", v, cn("-1")))), du)
		}
		return cn("*", cn("^", u, v), cn("+", cn("*", dv, cn("ln", u)), cn("/", cn("*", v, du), u)))
	case "sin":
		return cn("*", cn("cos", u), du)
	case "cos":
		return cn("*", cn("-1"), cn("*", cn("sin", u), du))
	case "tan":
		return cn("/", du, cn("^", cn("cos", u), cn("2")))
	case "sec":
		return cn("*", cn("*", cn("sec", u), cn("tan", u)), du)
	case "csc":
		return cn("*", cn("-1"), cn("*", cn("*", cn("csc", u), cn("cot", u)), du))
	case "cot":
		return cn("*", cn("-1"), cn("/", du, cn("^", cn("sin", u), cn("2"))))
	case "exp":
		return cn("*", cn("exp", u), du)
	case "ln":
		if u.op == "abs" {
			return cn("/", calcDerivative(u.args[0], variable), u.args[0])
		}
		return cn("/", du, u)
	case "sqrt":
		return cn("/", du, cn("*", cn("2"), cn("sqrt", u)))
	case "abs":
		return cn("*", cn("/", u, cn("abs", u)), du)
	case "asin":
		return cn("/", du, cn("sqrt", cn("+", cn("1"), cn("*", cn("-1"), cn("^", u, cn("2"))))))
	case "acos":
		return cn("*", cn("-1"), cn("/", du, cn("sqrt", cn("+", cn("1"), cn("*", cn("-1"), cn("^", u, cn("2")))))))
	case "atan":
		return cn("/", du, cn("+", cn("1"), cn("^", u, cn("2"))))
	}
	calcFail("This derivative is outside the supported notation")
	return nil
}

type calcAtom struct {
	op       string
	argument rationalPoly
	name     string
	square   *rationalPoly
}
type calcContext struct {
	variables []string
	atoms     []calcAtom
	steps     int
}

func calcContextFor(variables []string) *calcContext {
	vs := append([]string{}, variables...)
	for _, v := range []string{"C", "pi", "e"} {
		if !enum(v, vs...) {
			vs = append(vs, v)
		}
	}
	for i := 0; i < 64; i++ {
		vs = append(vs, "CALC"+strconv.Itoa(i))
	}
	return &calcContext{variables: vs}
}
func (c *calcContext) number(i int64) rationalPoly { return constantPoly(exactInt(i), c.variables) }
func (c *calcContext) norm(a *calcNode) rationalPoly {
	c.steps++
	if c.steps > 12000 {
		calcFail("This expression exceeds the symbolic work limit")
	}
	if q := calcConstant(a); q != nil {
		return constantPoly(exactRat(q), c.variables)
	}
	if len(a.args) == 0 {
		return calcMust(parsePolynomial(a.op, c.variables))
	}
	u := a.args[0]
	var v *calcNode
	if len(a.args) > 1 {
		v = a.args[1]
	}
	x := c.norm(u)
	switch a.op {
	case "+", "*", "/":
		return calcMust(x.combine(c.norm(v), a.op))
	case "^":
		exponent := calcConstant(v)
		if exponent != nil && (exponent.Cmp(big.NewRat(-32, 1)) < 0 || exponent.Cmp(big.NewRat(32, 1)) > 0) {
			calcFail("Use powers between -32 and 32")
		}
		if exponent != nil && exponent.IsInt() {
			k := int(exponent.Num().Int64())
			if u.op == "sqrt" && k%2 == 0 {
				return calcMust(c.norm(u.args[0]).power(k / 2))
			}
			if u.op == "sin" && (k >= 2 || k <= -2) && k%2 == 0 {
				p := calcMust(c.number(1).combine(c.norm(cn("^", cn("cos", u.args[0]), cn("2"))), "-"))
				return calcMust(p.power(k / 2))
			}
			return calcMust(x.power(k))
		}
		if exponent != nil && exponent.Denom().Cmp(big.NewInt(2)) == 0 && exponent.Num().IsInt64() && exponent.Num().Int64() >= -31 && exponent.Num().Int64() <= 31 {
			return c.norm(cn("^", cn("sqrt", u), cn(exponent.Num().String())))
		}
		return c.norm(cn("exp", cn("*", v, cn("ln", u))))
	case "tan":
		return c.norm(cn("/", cn("sin", u), cn("cos", u)))
	case "sec":
		return c.norm(cn("/", cn("1"), cn("cos", u)))
	case "csc":
		return c.norm(cn("/", cn("1"), cn("sin", u)))
	case "cot":
		return c.norm(cn("/", cn("cos", u), cn("sin", u)))
	case "ln":
		if u.op == "exp" {
			return c.norm(u.args[0])
		}
		if u.op == "e" {
			return c.number(1)
		}
	case "exp":
		if u.op == "+" {
			return c.norm(cn("*", cn("exp", u.args[0]), cn("exp", u.args[1])))
		}
		if u.op == "*" {
			left, right := calcConstant(u.args[0]), calcConstant(u.args[1])
			factor, argument := left, u.args[1]
			if factor == nil {
				factor = right
				argument = u.args[0]
			}
			if factor != nil && factor.IsInt() && factor.Cmp(big.NewRat(-32, 1)) >= 0 && factor.Cmp(big.NewRat(32, 1)) <= 0 {
				return calcMust(c.norm(cn("exp", argument)).power(int(factor.Num().Int64())))
			}
		}
		if u.op == "ln" {
			return c.norm(u.args[0])
		}
	case "sqrt":
		if q, e := x.constant(); e == nil {
			if sq, e := exactSqrt(q); e == nil {
				return constantPoly(sq, c.variables)
			}
		}
	case "abs":
		if q, e := x.constant(); e == nil {
			if sign, e := q.sign(); e == nil {
				if sign < 0 {
					q = q.neg()
				}
				return constantPoly(q, c.variables)
			}
		}
	}
	if x.equal(c.number(0)) {
		if enum(a.op, "sin", "tan", "asin", "atan") {
			return c.number(0)
		}
		if enum(a.op, "cos", "exp") {
			return c.number(1)
		}
	}
	if a.op == "ln" && x.equal(c.number(1)) {
		return c.number(0)
	}
	for _, atom := range c.atoms {
		if atom.op == a.op && atom.argument.equal(x) {
			return calcMust(parsePolynomial(atom.name, c.variables))
		}
	}
	if len(c.atoms) >= 64 {
		calcFail("Use fewer distinct function arguments")
	}
	var square *rationalPoly
	if a.op == "sqrt" {
		square = &x
	} else if a.op == "abs" {
		value := calcMust(x.power(2))
		square = &value
	} else if a.op == "sin" {
		value := calcMust(c.number(1).combine(calcMust(c.norm(cn("cos", u)).power(2)), "-"))
		square = &value
	}
	name := "CALC" + strconv.Itoa(len(c.atoms))
	c.atoms = append(c.atoms, calcAtom{op: a.op, argument: x, name: name, square: square})
	return calcMust(parsePolynomial(name, c.variables))
}
func (c *calcContext) equivalent(a, b rationalPoly) bool {
	difference := calcMust(a.combine(b, "-"))
	for i := len(c.atoms) - 1; i >= 0; i-- {
		atom := c.atoms[i]
		if atom.square == nil {
			continue
		}
		reduce := func(poly exactPoly) rationalPoly {
			result := c.number(0)
			for key, coefficient := range poly {
				term := constantPoly(coefficient, c.variables)
				for j, degree := range strings.Split(strings.TrimSuffix(key, ","), ",") {
					power, _ := strconv.Atoi(degree)
					if power == 0 {
						continue
					}
					name := c.variables[j]
					if name == atom.name {
						term = calcMust(term.combine(calcMust(atom.square.power(power/2)), "*"))
						if power%2 != 0 {
							term = calcMust(term.combine(calcMust(parsePolynomial(name, c.variables)), "*"))
						}
					} else {
						term = calcMust(term.combine(calcMust(calcMust(parsePolynomial(name, c.variables)).power(power)), "*"))
					}
				}
				result = calcMust(result.combine(term, "+"))
			}
			return result
		}
		difference = calcMust(reduce(difference.n).combine(reduce(difference.d), "/"))
	}
	return len(difference.n) == 0
}
func (c *calcContext) equal(a, b *calcNode) bool { return c.equivalent(c.norm(a), c.norm(b)) }

type calcGuard struct {
	kind string
	node *calcNode
}

func calcGuards(a *calcNode, differentiated bool) []calcGuard {
	if len(a.args) == 0 {
		return nil
	}
	u := a.args[0]
	var v *calcNode
	if len(a.args) > 1 {
		v = a.args[1]
	}
	out := []calcGuard{}
	for _, x := range a.args {
		out = append(out, calcGuards(x, differentiated)...)
	}
	add := func(kind string, node *calcNode) { out = append(out, calcGuard{kind, node}) }
	if a.op == "/" {
		add("nonzero", v)
	}
	if a.op == "^" {
		q := calcConstant(v)
		if q == nil || !q.IsInt() {
			kind := "positive"
			if q != nil && q.Denom().Cmp(big.NewInt(2)) == 0 && q.Sign() > 0 && !differentiated {
				kind = "nonnegative"
			}
			add(kind, u)
		} else if q.Sign() < 0 {
			add("nonzero", u)
		}
	}
	if a.op == "ln" {
		add("positive", u)
	}
	if a.op == "sqrt" {
		kind := "nonnegative"
		if differentiated {
			kind = "positive"
		}
		add(kind, u)
	}
	if a.op == "abs" && differentiated {
		add("nonzero", u)
	}
	if enum(a.op, "tan", "sec") {
		add("nonzero", cn("cos", u))
	}
	if enum(a.op, "cot", "csc") {
		add("nonzero", cn("sin", u))
	}
	if enum(a.op, "asin", "acos") {
		kind := "nonnegative"
		if differentiated {
			kind = "positive"
		}
		add(kind, cn("+", cn("1"), cn("*", cn("-1"), cn("^", u, cn("2")))))
	}
	return out
}
func calcProved(g calcGuard, facts []calcGuard, c *calcContext, depth int) bool {
	if depth > 12 {
		return false
	}
	a := g.node
	var u, v *calcNode
	if len(a.args) > 0 {
		u = a.args[0]
	}
	if len(a.args) > 1 {
		v = a.args[1]
	}
	if q, e := c.norm(a).constant(); e == nil {
		if sign, e := q.sign(); e == nil {
			switch g.kind {
			case "positive":
				return sign > 0
			case "nonnegative":
				return sign >= 0
			default:
				return sign != 0
			}
		}
	}
	for _, f := range facts {
		if (f.kind == g.kind || f.kind == "positive") && c.equal(f.node, a) {
			return true
		}
	}
	if g.kind == "nonzero" {
		for _, f := range facts {
			if enum(f.kind, "positive", "nonzero") && f.node.op == "^" {
				q := calcConstant(f.node.args[1])
				if (q == nil || q.Sign() != 0) && c.equal(f.node.args[0], a) {
					return true
				}
			}
		}
	}
	if a.op == "ln" {
		if value := calcConstant(u); value != nil && value.Sign() > 0 {
			cmp := value.Cmp(big.NewRat(1, 1))
			if g.kind == "nonzero" {
				return cmp != 0
			}
			if g.kind == "positive" {
				return cmp > 0
			}
			return cmp >= 0
		}
	}
	if enum(a.op, "e", "pi", "exp") {
		return true
	}
	p := func(kind string, node *calcNode) bool { return calcProved(calcGuard{kind, node}, facts, c, depth+1) }
	switch a.op {
	case "abs":
		return g.kind == "nonnegative" || p("nonzero", u)
	case "sqrt":
		return g.kind == "nonnegative" || p("positive", u)
	case "*", "/":
		if g.kind == "nonzero" {
			return p("nonzero", u) && p("nonzero", v)
		}
		return p(g.kind, u) && p("positive", v)
	case "+":
		return g.kind != "nonzero" && ((p("positive", u) && p("nonnegative", v)) || (p("nonnegative", u) && p("positive", v)) || (g.kind == "nonnegative" && p("nonnegative", u) && p("nonnegative", v)))
	case "^":
		if q := calcConstant(v); q != nil && q.IsInt() {
			if q.Num().Bit(0) == 0 {
				return g.kind == "nonnegative" || p("nonzero", u)
			}
			return p(g.kind, u)
		}
	}
	return false
}
func calcCheckGuards(items, facts []calcGuard, c *calcContext) {
	for _, g := range items {
		if !calcProved(g, facts, c, 0) {
			calcFail("This form needs an additional domain restriction. Use a form defined throughout the stated domain")
		}
	}
}
func calcSubstitute(a *calcNode, variable string, value *calcNode) *calcNode {
	if a.op == variable && len(a.args) == 0 {
		return value
	}
	args := []*calcNode{}
	for _, x := range a.args {
		args = append(args, calcSubstitute(x, variable, value))
	}
	return cn(a.op, args...)
}
func calcHasC(a *calcNode) bool {
	if a.op == "C" {
		return true
	}
	for _, x := range a.args {
		if calcHasC(x) {
			return true
		}
	}
	return false
}
func calcParameters(r AssessmentRequirement) (calculusParams, []string, []calcGuard) {
	var p calculusParams
	if e := json.Unmarshal(r.Params, &p); e != nil {
		panic(e)
	}
	vs := p.Variables
	if r.Validator == "antiderivative" {
		vs = []string{p.Variable}
	}
	if len(vs) == 0 || len(vs) > 6 || len(r.Fields) != 1 {
		calcFail("Invalid calculus variables or fields")
	}
	seen := map[string]bool{}
	for _, v := range vs {
		if seen[v] || !regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9_]*$`).MatchString(v) || enum(v, calcFunctions...) || enum(v, "C", "e", "pi") || strings.HasPrefix(v, "CALC") {
			calcFail("Invalid calculus variables or fields")
		}
		seen[v] = true
	}
	var raw map[string]json.RawMessage
	calcMust(0, json.Unmarshal(r.Params, &raw))
	if d, ok := raw["domain"]; ok {
		var domain map[string]json.RawMessage
		if json.Unmarshal(d, &domain) != nil {
			calcFail("Invalid calculus domain")
		}
		for k := range domain {
			if !enum(k, "positive", "nonnegative", "nonzero") {
				calcFail("Invalid calculus domain")
			}
		}
	}
	facts := []calcGuard{}
	if p.Domain != nil {
		for _, item := range []struct {
			kind   string
			values []string
		}{{"positive", p.Domain.Positive}, {"nonnegative", p.Domain.Nonnegative}, {"nonzero", p.Domain.Nonzero}} {
			if len(item.values) > 24 {
				calcFail("Invalid calculus domain facts")
			}
			for _, s := range item.values {
				node := calcParse(s, vs)
				if calcHasC(node) {
					calcFail("Domain facts cannot contain C")
				}
				facts = append(facts, calcGuard{item.kind, node})
			}
		}
	}
	return p, vs, facts
}
func checkCalculus(r AssessmentRequirement, response StructuredResponse) (ok bool, err error) {
	defer calcRecover(&err)
	p, vs, facts := calcParameters(r)
	c := calcContextFor(vs)
	raw, yes := response[r.Fields[0]].(string)
	if !yes {
		calcFail("Enter the requested calculus expression")
	}
	answer := calcParse(raw, vs)
	if r.Validator == "calculus-expression" {
		expected := calcParse(p.Expected, vs)
		if calcHasC(answer) {
			calcFail("Use only the variables named in the question")
		}
		allowed := append(facts, calcGuards(expected, false)...)
		calcCheckGuards(calcGuards(answer, false), allowed, c)
		return c.equal(answer, expected), nil
	}
	integrand := calcParse(p.Integrand, vs)
	variable := vs[0]
	allowed := append(facts, calcGuards(integrand, false)...)
	calcCheckGuards(calcGuards(answer, true), allowed, c)
	if p.Mode == "family" {
		if !calcHasC(answer) || !c.equal(calcDerivative(answer, "C"), cn("1")) {
			return false, nil
		}
	} else if calcHasC(answer) {
		return false, nil
	}
	correct := c.equal(calcDerivative(answer, variable), integrand)
	if p.Mode == "initial-value" {
		at := calcParse(p.Initial.At, nil)
		target := calcParse(p.Initial.Value, nil)
		value := calcSubstitute(answer, variable, at)
		checks := calcGuards(value, false)
		for _, g := range allowed {
			checks = append(checks, calcGuard{g.kind, calcSubstitute(g.node, variable, at)})
		}
		calcCheckGuards(checks, nil, c)
		return correct && c.equal(value, target), nil
	}
	return correct, nil
}
func validateCalculus(r AssessmentRequirement) (err error) {
	defer calcRecover(&err)
	p, vs, _ := calcParameters(r)
	c := calcContextFor(vs)
	if r.Validator == "calculus-expression" {
		a := calcParse(p.Expected, vs)
		if calcHasC(a) {
			calcFail("C is reserved for antiderivative families")
		}
		c.norm(a)
	} else {
		if !enum(p.Mode, "family", "particular", "initial-value") {
			calcFail("Choose the antiderivative mode")
		}
		a := calcParse(p.Integrand, vs)
		if calcHasC(a) {
			calcFail("The integrand cannot contain C")
		}
		c.norm(a)
		if p.Mode == "initial-value" {
			if p.Initial == nil {
				calcFail("Supply the initial condition")
			}
			for _, s := range []string{p.Initial.At, p.Initial.Value} {
				a := calcParse(s, nil)
				if calcHasC(a) {
					calcFail("Initial conditions must be constants")
				}
				c.norm(a)
				calcCheckGuards(calcGuards(a, false), nil, c)
			}
		}
	}
	return nil
}
