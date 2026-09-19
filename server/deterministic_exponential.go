package main

import (
	"errors"
	"math/big"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

type expressionParams struct {
	Expected          string   `json:"expected"`
	Variables         []string `json:"variables"`
	IntegerVariables  []string `json:"integerVariables"`
	PositiveVariables []string `json:"positiveVariables"`
	Functions         []string `json:"functions"`
	Domain            []string `json:"domain"`
}

func (o expressionParams) extended() bool {
	return len(o.IntegerVariables)+len(o.PositiveVariables)+len(o.Functions) > 0
}
func stringHas(xs []string, s string) bool {
	for _, v := range xs {
		if v == s {
			return true
		}
	}
	return false
}
func affineInteger(x exactNumber) (int, error) {
	r, ok := x.rat()
	if !ok || !r.IsInt() || !r.Num().IsInt64() || r.Num().Int64() < -100 || r.Num().Int64() > 100 {
		return 0, errors.New("Use affine integer exponents with coefficients from -100 to 100")
	}
	return int(r.Num().Int64()), nil
}
func rationalFactors(n *big.Int) (map[int64]int, error) {
	if n.Sign() < 1 || !n.IsInt64() || n.Int64() > 1000000000000 {
		return nil, errors.New("Use a nonzero rational base with numerator and denominator at most 1000000000000")
	}
	v := n.Int64()
	out := map[int64]int{}
	for p := int64(2); p*p <= v; {
		for v%p == 0 {
			out[p]++
			v /= p
		}
		if p == 2 {
			p = 3
		} else {
			p += 2
		}
	}
	if v > 1 {
		out[v]++
	}
	if len(out) > 8 {
		return nil, errors.New("Exponential base has too many prime factors")
	}
	return out, nil
}

type exponentialTransform struct {
	options                expressionParams
	atoms, parity, nonzero map[string]bool
	floors, logs           map[string]string
}

func newExponentialTransform(o expressionParams) (*exponentialTransform, error) {
	for _, v := range o.Variables {
		if strings.HasPrefix(v, "DETX") {
			return nil, errors.New("Reserved deterministic variable prefix")
		}
	}
	for _, xs := range [][]string{o.IntegerVariables, o.PositiveVariables} {
		for _, v := range xs {
			if !stringHas(o.Variables, v) {
				return nil, errors.New("Expression domains must name declared variables")
			}
		}
	}
	for _, f := range o.Functions {
		if f != "log2" && f != "floor" {
			return nil, errors.New("Unsupported expression function")
		}
	}
	t := &exponentialTransform{o, map[string]bool{}, map[string]bool{}, map[string]bool{}, map[string]string{}, map[string]string{}}
	for _, v := range o.PositiveVariables {
		t.nonzero[v] = true
	}
	return t, nil
}
func (t *exponentialTransform) atom(kind string, v string, prime int64) string {
	source := v
	marker := "v"
	if original, ok := t.floors[v]; ok {
		source = original
		marker = "f"
	}
	idx := 0
	for i, s := range t.options.Variables {
		if s == source {
			idx = i
			break
		}
	}
	name := "DETX" + kind
	if prime > 0 {
		name += strconv.FormatInt(prime, 10)
	}
	name += marker + strconv.Itoa(idx)
	t.atoms[name] = true
	if kind == "p" {
		t.parity[name] = true
	}
	if kind == "e" || kind == "p" {
		t.nonzero[name] = true
	}
	if kind == "f" {
		t.floors[name] = v
	}
	if kind == "l" {
		t.logs[name] = v
	}
	return name
}
func (t *exponentialTransform) floored(source string) (string, error) {
	if !stringHas(t.options.Functions, "floor") {
		return "", errors.New("Floor is not supported for this answer")
	}
	vs := append([]string{}, t.options.Variables...)
	atoms := []string{}
	for a := range t.atoms {
		atoms = append(atoms, a)
	}
	sort.Strings(atoms)
	vs = append(vs, atoms...)
	p, e := parsePolynomial(source, vs)
	if e != nil {
		return "", e
	}
	for _, q := range p.divisors {
		for k := range q {
			if k != zeroMonomial(len(vs)) {
				return "", errors.New("Use floor(log2(n)) for a stated positive variable")
			}
		}
	}
	for symbol, v := range t.logs {
		expected, e := parsePolynomial(symbol, vs)
		if e != nil {
			return "", e
		}
		if p.equal(expected) {
			return t.atom("f", v, 0), nil
		}
	}
	return "", errors.New("Use floor(log2(n)) for a stated positive variable")
}
func (t *exponentialTransform) exponential(base, exponent string) (string, error) {
	if c, e := parseExact(exponent); e == nil {
		if _, e = affineInteger(c); e != nil {
			return "", e
		}
		return "(" + base + ")^(" + exponent + ")", nil
	}
	bv, e := parseExact(base)
	if e != nil {
		return "", e
	}
	b, ok := bv.rat()
	if !ok {
		return "", errors.New("A variable exponent requires a nonzero rational base")
	}
	exponentVars := append([]string{}, t.options.Variables...)
	floorVars := []string{}
	for v := range t.floors {
		floorVars = append(floorVars, v)
	}
	sort.Strings(floorVars)
	exponentVars = append(exponentVars, floorVars...)
	p, e := parsePolynomial(exponent, exponentVars)
	if e != nil {
		return "", e
	}
	den, ok := p.d[zeroMonomial(len(p.variables))]
	if len(p.d) != 1 || !ok {
		return "", errors.New("Use an affine integer exponent")
	}
	for _, d := range p.divisors {
		for k := range d {
			if k != zeroMonomial(len(p.variables)) {
				return "", errors.New("Use an affine integer exponent")
			}
		}
	}
	offset := 0
	coeff := map[string]int{}
	for k, c := range p.n {
		v, e := c.div(den)
		if e != nil {
			return "", e
		}
		n, e := affineInteger(v)
		if e != nil {
			return "", e
		}
		powers := monomialPowers(k)
		idx := -1
		for i, pow := range powers {
			if pow != 0 {
				if pow != 1 || idx != -1 || (!stringHas(t.options.IntegerVariables, exponentVars[i]) && t.floors[exponentVars[i]] == "") {
					return "", errors.New("Declare integer variables and use an affine integer exponent")
				}
				idx = i
			}
		}
		if idx < 0 {
			offset = n
		} else {
			coeff[exponentVars[idx]] = n
		}
	}
	if b.Sign() == 0 {
		minimum := offset
		for v, n := range coeff {
			if n < 0 || !stringHas(t.options.PositiveVariables, v) {
				return "", errors.New("A zero base needs an exponent positive throughout the stated domain")
			}
			minimum += n
		}
		if minimum <= 0 {
			return "", errors.New("A zero base needs an exponent positive throughout the stated domain")
		}
		return "0", nil
	}
	factors, e := rationalFactors(new(big.Int).Abs(b.Num()))
	if e != nil {
		return "", e
	}
	df, e := rationalFactors(b.Denom())
	if e != nil {
		return "", e
	}
	for prime, n := range df {
		factors[prime] -= n
	}
	terms := []string{"(" + b.RatString() + ")^(" + strconv.Itoa(offset) + ")"}
	for _, v := range exponentVars {
		n := coeff[v]
		primes := []int64{}
		for prime := range factors {
			primes = append(primes, prime)
		}
		sort.Slice(primes, func(i, j int) bool { return primes[i] < primes[j] })
		for _, prime := range primes {
			power := factors[prime] * n
			if power != 0 {
				terms = append(terms, t.atom("e", v, prime)+"^("+strconv.Itoa(power)+")")
			}
		}
		if b.Sign() < 0 && n%2 != 0 {
			terms = append(terms, t.atom("p", v, 0))
		}
	}
	return strings.Join(terms, "*"), nil
}
func (t *exponentialTransform) logarithm(source string) (string, error) {
	if !stringHas(t.options.Functions, "log2") {
		return "", errors.New("Logarithms are not supported for this answer")
	}
	p, e := parsePolynomial(source, t.options.Variables)
	if e != nil {
		return "", e
	}
	if len(p.n) != 1 || len(p.d) != 1 {
		return "", errors.New("Use log2 of a positive monomial")
	}
	for _, q := range append([]exactPoly{p.n, p.d}, p.divisors...) {
		for k := range q {
			for i, power := range monomialPowers(k) {
				if power != 0 && !stringHas(t.options.PositiveVariables, t.options.Variables[i]) {
					return "", errors.New("Logarithm variables must have a stated positive domain")
				}
			}
		}
	}
	var nk, dk string
	var nc, dc exactNumber
	for k, c := range p.n {
		nk, nc = k, c
	}
	for k, c := range p.d {
		dk, dc = k, c
	}
	c, e := nc.div(dc)
	if e != nil {
		return "", e
	}
	r, ok := c.rat()
	if !ok || r.Sign() <= 0 {
		return "", errors.New("Logarithm needs a positive rational monomial")
	}
	twos := func(n *big.Int) (int, error) {
		if n.Sign() <= 0 || n.BitLen() > 8192 {
			return 0, errors.New("Invalid logarithm argument")
		}
		bits := n.BitLen() - 1
		if new(big.Int).Lsh(big.NewInt(1), uint(bits)).Cmp(n) != 0 {
			return 0, errors.New("Use a power of two as the logarithm constant")
		}
		return bits, nil
	}
	a, e := twos(r.Num())
	if e != nil {
		return "", e
	}
	b, e := twos(r.Denom())
	if e != nil {
		return "", e
	}
	terms := []string{strconv.Itoa(a - b)}
	ns, ds := monomialPowers(nk), monomialPowers(dk)
	for i, n := range ns {
		power := n - ds[i]
		if power != 0 {
			terms = append(terms, strconv.Itoa(power)+"*"+t.atom("l", t.options.Variables[i], 0))
		}
	}
	return "(" + strings.Join(terms, "+") + ")", nil
}

type exponentialParser struct {
	t         *exponentialTransform
	tokens    []string
	at, depth int
}

func (p *exponentialParser) peek() string {
	if p.at >= len(p.tokens) {
		return ""
	}
	return p.tokens[p.at]
}
func (p *exponentialParser) take(s string) bool {
	if p.peek() == s {
		p.at++
		return true
	}
	return false
}
func (p *exponentialParser) group() (string, error) {
	if !p.take("(") {
		return "", errors.New("Use parentheses around the argument")
	}
	x, e := p.sum()
	if e != nil {
		return "", e
	}
	if !p.take(")") {
		return "", errors.New("Close parentheses")
	}
	return "(" + x + ")", nil
}
func (p *exponentialParser) primary() (string, error) {
	p.depth++
	defer func() { p.depth-- }()
	if p.depth > 64 {
		return "", errors.New("Expression is nested too deeply")
	}
	s := p.peek()
	if s == "(" {
		return p.group()
	}
	if len(s) > 0 && (s[0] >= '0' && s[0] <= '9' || s[0] == '.' || stringHas(p.t.options.Variables, s)) {
		p.at++
		return s, nil
	}
	switch s {
	case "\\frac":
		p.at++
		a, e := p.group()
		if e != nil {
			return "", e
		}
		b, e := p.group()
		return "(" + a + "/" + b + ")", e
	case "floor":
		p.at++
		a, e := p.group()
		if e != nil {
			return "", e
		}
		return p.t.floored(a)
	case "log2":
		p.at++
		var a string
		var e error
		if p.peek() == "(" {
			a, e = p.group()
		} else {
			a, e = p.primary()
		}
		if e != nil {
			return "", e
		}
		return p.t.logarithm(a)
	case "sqrt", "\\sqrt":
		p.at++
		a, e := p.group()
		return "sqrt" + a, e
	case "\\binom":
		p.at++
		a, e := p.group()
		if e != nil {
			return "", e
		}
		b, e := p.group()
		return "binom(" + a + "," + b + ")", e
	case "binom", "choose":
		p.at++
		if !p.take("(") {
			return "", errors.New("Use binom(n,k)")
		}
		a, e := p.sum()
		if e != nil {
			return "", e
		}
		if !p.take(",") {
			return "", errors.New("Separate binomial arguments")
		}
		b, e := p.sum()
		if e != nil {
			return "", e
		}
		if !p.take(")") {
			return "", errors.New("Close binomial arguments")
		}
		return "binom(" + a + "," + b + ")", nil
	}
	return "", errors.New("Use the stated variables and supported arithmetic")
}
func (p *exponentialParser) power() (string, error) {
	x, e := p.primary()
	if e != nil {
		return "", e
	}
	for p.take("!") {
		x = "(" + x + ")!"
	}
	if p.take("^") {
		y, e := p.unary()
		if e != nil {
			return "", e
		}
		return p.t.exponential(x, y)
	}
	return x, nil
}
func (p *exponentialParser) unary() (string, error) {
	if p.take("+") {
		return p.unary()
	}
	if p.take("-") {
		x, e := p.unary()
		return "(-" + x + ")", e
	}
	return p.power()
}
func (p *exponentialParser) starts() bool {
	s := p.peek()
	return s != "" && (s == "(" || s[0] >= '0' && s[0] <= '9' || s[0] == '.' || stringHas(p.t.options.Variables, s) || stringHas([]string{"\\frac", "sqrt", "\\sqrt", "binom", "\\binom", "choose", "log2", "floor"}, s))
}
func (p *exponentialParser) product() (string, error) {
	x, e := p.unary()
	if e != nil {
		return "", e
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
		y, e := p.unary()
		if e != nil {
			return "", e
		}
		x = "(" + x + op + y + ")"
	}
	return x, nil
}
func (p *exponentialParser) sum() (string, error) {
	x, e := p.product()
	if e != nil {
		return "", e
	}
	for p.peek() == "+" || p.peek() == "-" {
		op := p.peek()
		p.at++
		y, e := p.product()
		if e != nil {
			return "", e
		}
		x = "(" + x + op + y + ")"
	}
	return x, nil
}

var log2Tex = regexp.MustCompile(`\\log_(\{2\}|2)`)

func (t *exponentialTransform) parse(source string) (string, error) {
	source = log2Tex.ReplaceAllString(source, "log2")
	source = strings.NewReplacer("\\lfloor", "floor(", "\\rfloor", ")").Replace(source)
	source = strings.NewReplacer("{", "(", "}", ")").Replace(source)
	tokens, e := mathTokens(source)
	if e != nil {
		return "", e
	}
	p := exponentialParser{t: t, tokens: tokens}
	x, e := p.sum()
	if e != nil {
		return "", e
	}
	if p.at != len(tokens) {
		return "", errors.New("Check expression syntax")
	}
	return x, nil
}
func (t *exponentialTransform) normalize(p exactPoly, vs []string) exactPoly {
	out := exactPoly{}
	for key, c := range p {
		ns := monomialPowers(key)
		ss := make([]string, len(ns))
		for i, n := range ns {
			if t.parity[vs[i]] {
				n %= 2
			}
			ss[i] = strconv.Itoa(n)
		}
		k := strings.Join(ss, ",") + ","
		if len(ns) == 0 {
			k = ""
		}
		if prev, ok := out[k]; ok {
			c = c.add(prev)
		}
		if len(c.n) == 0 {
			delete(out, k)
		} else {
			out[k] = c
		}
	}
	return out
}
func (t *exponentialTransform) expression(p rationalPoly) (rationalPoly, error) {
	p.n = t.normalize(p.n, p.variables)
	p.d = t.normalize(p.d, p.variables)
	divisors := []exactPoly{}
	for _, q := range p.divisors {
		q = t.normalize(q, p.variables)
		if len(q) == 0 {
			return p, errors.New("Division by zero is undefined")
		}
		intrinsic := len(q) == 1
		for k := range q {
			for i, n := range monomialPowers(k) {
				if n != 0 && !t.nonzero[p.variables[i]] {
					intrinsic = false
				}
			}
		}
		if !intrinsic {
			divisors = append(divisors, q)
		}
	}
	p.divisors = divisors
	return p, p.valid()
}
func extendedExpressionEquivalent(actual, expected string, o expressionParams) (bool, error) {
	t, e := newExponentialTransform(o)
	if e != nil {
		return false, e
	}
	sources := append([]string{actual, expected}, o.Domain...)
	for i, s := range sources {
		x, e := t.parse(s)
		if e != nil {
			return false, e
		}
		sources[i] = x
	}
	vs := append([]string{}, o.Variables...)
	atoms := []string{}
	for a := range t.atoms {
		atoms = append(atoms, a)
	}
	sort.Strings(atoms)
	vs = append(vs, atoms...)
	ps := []rationalPoly{}
	for _, s := range sources {
		p, e := parsePolynomial(s, vs)
		if e != nil {
			return false, e
		}
		p, e = t.expression(p)
		if e != nil {
			return false, e
		}
		ps = append(ps, p)
	}
	a, b := ps[0], ps[1]
	difference := polyAdd(t.normalize(polyMul(a.n, b.d), vs), polyNeg(t.normalize(polyMul(b.n, a.d), vs)))
	if len(difference) > 0 {
		return false, nil
	}
	return samePolynomialDomain(a, b, ps[2:])
}
