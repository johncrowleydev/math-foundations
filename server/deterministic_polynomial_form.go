package main

import (
	"errors"
	"strings"
)

type polynomialNode struct {
	op, text string
	variable bool
	children []*polynomialNode
}

func polynomialSyntaxNode(op, text string, variable bool, children ...*polynomialNode) *polynomialNode {
	for _, c := range children {
		variable = variable || c.variable
	}
	return &polynomialNode{op, text, variable, children}
}
func polynomialBinary(op string, a, b *polynomialNode) *polynomialNode {
	return polynomialSyntaxNode(op, "("+a.text+op+b.text+")", false, a, b)
}

type polynomialSyntaxParser struct {
	tokens, variables []string
	at, depth         int
}

func (p *polynomialSyntaxParser) peek() string {
	if p.at >= len(p.tokens) {
		return ""
	}
	return p.tokens[p.at]
}
func (p *polynomialSyntaxParser) take(s string) bool {
	if p.peek() == s {
		p.at++
		return true
	}
	return false
}
func (p *polynomialSyntaxParser) group() (*polynomialNode, error) {
	if !p.take("(") {
		return nil, errors.New("Use parentheses")
	}
	n, e := p.sum()
	if e != nil {
		return nil, e
	}
	if !p.take(")") {
		return nil, errors.New("Close the parentheses")
	}
	return n, nil
}
func (p *polynomialSyntaxParser) primary() (*polynomialNode, error) {
	p.depth++
	defer func() { p.depth-- }()
	if p.depth > 64 {
		return nil, errors.New("Polynomial is nested too deeply")
	}
	s := p.peek()
	if s == "(" {
		return p.group()
	}
	if s != "" && (s[0] >= '0' && s[0] <= '9' || s[0] == '.' || contains(p.variables, s)) {
		p.at++
		return polynomialSyntaxNode("atom", s, contains(p.variables, s)), nil
	}
	switch s {
	case "\\frac":
		p.at++
		a, e := p.group()
		if e != nil {
			return nil, e
		}
		b, e := p.group()
		if e != nil {
			return nil, e
		}
		return polynomialBinary("/", a, b), nil
	case "sqrt", "\\sqrt":
		p.at++
		a, e := p.group()
		if e != nil {
			return nil, e
		}
		return polynomialSyntaxNode("call", "sqrt("+a.text+")", false, a), nil
	case "\\binom":
		p.at++
		a, e := p.group()
		if e != nil {
			return nil, e
		}
		b, e := p.group()
		if e != nil {
			return nil, e
		}
		return polynomialSyntaxNode("call", "binom("+a.text+","+b.text+")", false, a, b), nil
	case "binom", "choose":
		p.at++
		if !p.take("(") {
			return nil, errors.New("Use binom(n,k)")
		}
		a, e := p.sum()
		if e != nil {
			return nil, e
		}
		if !p.take(",") {
			return nil, errors.New("Separate binomial arguments")
		}
		b, e := p.sum()
		if e != nil {
			return nil, e
		}
		if !p.take(")") {
			return nil, errors.New("Close binomial arguments")
		}
		return polynomialSyntaxNode("call", "binom("+a.text+","+b.text+")", false, a, b), nil
	}
	return nil, errors.New("Use polynomial arithmetic in the stated variables")
}
func (p *polynomialSyntaxParser) power() (*polynomialNode, error) {
	n, e := p.primary()
	if e != nil {
		return nil, e
	}
	for p.take("!") {
		n = polynomialSyntaxNode("call", "("+n.text+")!", false, n)
	}
	if p.take("^") {
		b, e := p.unary()
		if e != nil {
			return nil, e
		}
		n = polynomialBinary("^", n, b)
	}
	return n, nil
}
func (p *polynomialSyntaxParser) unary() (*polynomialNode, error) {
	if p.take("+") {
		return p.unary()
	}
	if p.take("-") {
		n, e := p.unary()
		if e != nil {
			return nil, e
		}
		return polynomialSyntaxNode("neg", "(-"+n.text+")", false, n), nil
	}
	return p.power()
}
func (p *polynomialSyntaxParser) starts() bool {
	s := p.peek()
	return s != "" && (s == "(" || s[0] >= '0' && s[0] <= '9' || s[0] == '.' || contains(p.variables, s) || enum(s, "\\frac", "sqrt", "\\sqrt", "binom", "choose", "\\binom"))
}
func (p *polynomialSyntaxParser) product() (*polynomialNode, error) {
	n, e := p.unary()
	if e != nil {
		return nil, e
	}
	for {
		op := ""
		if p.take("*") {
			op = "*"
		} else if p.take("/") {
			op = "/"
		} else if p.starts() {
			op = "*"
		} else {
			break
		}
		b, e := p.unary()
		if e != nil {
			return nil, e
		}
		n = polynomialBinary(op, n, b)
	}
	return n, nil
}
func (p *polynomialSyntaxParser) sum() (*polynomialNode, error) {
	n, e := p.product()
	if e != nil {
		return nil, e
	}
	for enum(p.peek(), "+", "-") {
		op := p.peek()
		p.at++
		b, e := p.product()
		if e != nil {
			return nil, e
		}
		n = polynomialBinary(op, n, b)
	}
	return n, nil
}
func polynomialExponent(n *polynomialNode) (int, error) {
	v, e := parseExact(n.text)
	if e != nil {
		return 0, e
	}
	r, ok := v.rat()
	if !ok || !r.IsInt() || !r.Num().IsInt64() {
		return 0, errors.New("Use an integer polynomial exponent")
	}
	return int(r.Num().Int64()), nil
}
func polynomialMonomial(n *polynomialNode) (bool, error) {
	if !n.variable {
		return true, nil
	}
	switch n.op {
	case "atom":
		return true, nil
	case "neg":
		return polynomialMonomial(n.children[0])
	case "*":
		a, e := polynomialMonomial(n.children[0])
		if e != nil || !a {
			return a, e
		}
		return polynomialMonomial(n.children[1])
	case "/":
		if n.children[1].variable {
			return false, nil
		}
		return polynomialMonomial(n.children[0])
	case "^":
		if n.children[1].variable {
			return false, nil
		}
		exponent, e := polynomialExponent(n.children[1])
		if e != nil || exponent < 0 {
			return false, e
		}
		return polynomialMonomial(n.children[0])
	}
	return false, nil
}
func polynomialExpanded(n *polynomialNode) (bool, error) {
	if enum(n.op, "+", "-") {
		for _, c := range n.children {
			ok, e := polynomialExpanded(c)
			if e != nil || !ok {
				return ok, e
			}
		}
		return true, nil
	}
	return polynomialMonomial(n)
}
func polynomialFactorCount(n *polynomialNode, variables []string, degreeLimit int) (int, error) {
	if !n.variable {
		return 0, nil
	}
	switch n.op {
	case "neg":
		return polynomialFactorCount(n.children[0], variables, degreeLimit)
	case "*":
		a, e := polynomialFactorCount(n.children[0], variables, degreeLimit)
		if e != nil || a < 0 {
			return a, e
		}
		b, e := polynomialFactorCount(n.children[1], variables, degreeLimit)
		if e != nil || b < 0 {
			return b, e
		}
		return a + b, nil
	case "/":
		if n.children[1].variable {
			return -1, nil
		}
		return polynomialFactorCount(n.children[0], variables, degreeLimit)
	case "^":
		if n.children[1].variable {
			return -1, nil
		}
		exponent, e := polynomialExponent(n.children[1])
		if e != nil {
			return -1, e
		}
		if exponent <= 0 {
			return -1, nil
		}
		count, e := polynomialFactorCount(n.children[0], variables, degreeLimit)
		if e != nil || count < 0 {
			return -1, e
		}
		return count * exponent, nil
	}
	p, e := parsePolynomial(n.text, variables)
	if e != nil {
		return -1, e
	}
	zero := zeroMonomial(len(variables))
	for k := range p.d {
		if k != zero {
			return -1, nil
		}
	}
	for _, q := range p.divisors {
		for k := range q {
			if k != zero {
				return -1, nil
			}
		}
	}
	degree := 0
	for key := range p.n {
		sum := 0
		for _, n := range monomialPowers(key) {
			sum += n
		}
		if sum > degree {
			degree = sum
		}
	}
	if degree > 0 && (degreeLimit == 0 || degree <= degreeLimit) {
		return 1, nil
	}
	return -1, nil
}
func polynomialForm(source string, variables []string, form string, factorDegree int) (bool, error) {
	if _, e := parsePolynomial(source, variables); e != nil {
		return false, e
	}
	source = strings.NewReplacer("{", "(", "}", ")").Replace(normalizeMath(source))
	tokens, e := mathTokens(source)
	if e != nil {
		return false, e
	}
	p := polynomialSyntaxParser{tokens: tokens, variables: variables}
	n, e := p.sum()
	if e != nil {
		return false, e
	}
	if p.at != len(tokens) {
		return false, errors.New("Check polynomial syntax")
	}
	if form == "expanded" {
		return polynomialExpanded(n)
	}
	count, e := polynomialFactorCount(n, variables, factorDegree)
	return count >= 2, e
}
