package main

import (
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode"
)

// Exact scalars are quotients of rational linear combinations of square roots.
// No rounding, floating-point tolerance or finite sampling enters equality.
type radical map[string]*big.Rat
type exactNumber struct{ n, d radical }

func radRat(v *big.Rat) radical {
	if v.Sign() == 0 {
		return radical{}
	}
	return radical{"1": new(big.Rat).Set(v)}
}
func exactRat(v *big.Rat) exactNumber { return exactNumber{radRat(v), radRat(big.NewRat(1, 1))} }
func exactInt(n int64) exactNumber    { return exactRat(big.NewRat(n, 1)) }
func radAdd(a, b radical) radical {
	out := radical{}
	for k, v := range a {
		out[k] = new(big.Rat).Set(v)
	}
	for k, v := range b {
		if out[k] == nil {
			out[k] = new(big.Rat)
		}
		out[k].Add(out[k], v)
		if out[k].Sign() == 0 {
			delete(out, k)
		}
	}
	return out
}
func radNeg(a radical) radical {
	out := radical{}
	for k, v := range a {
		out[k] = new(big.Rat).Neg(v)
	}
	return out
}
func radMul(a, b radical) radical {
	out := radical{}
	for ka, va := range a {
		ai, _ := new(big.Int).SetString(ka, 10)
		for kb, vb := range b {
			bi, _ := new(big.Int).SetString(kb, 10)
			g := new(big.Int).GCD(nil, nil, ai, bi)
			k := new(big.Int).Mul(new(big.Int).Quo(ai, g), new(big.Int).Quo(bi, g)).String()
			v := new(big.Rat).Mul(va, vb)
			v.Mul(v, new(big.Rat).SetInt(g))
			if out[k] == nil {
				out[k] = new(big.Rat)
			}
			out[k].Add(out[k], v)
			if out[k].Sign() == 0 {
				delete(out, k)
			}
		}
	}
	return out
}
func (x exactNumber) add(y exactNumber) exactNumber {
	return exactNumber{radAdd(radMul(x.n, y.d), radMul(y.n, x.d)), radMul(x.d, y.d)}
}
func (x exactNumber) neg() exactNumber { return exactNumber{radNeg(x.n), x.d} }
func (x exactNumber) mul(y exactNumber) exactNumber {
	return exactNumber{radMul(x.n, y.n), radMul(x.d, y.d)}
}
func (x exactNumber) div(y exactNumber) (exactNumber, error) {
	if len(y.n) == 0 {
		return exactNumber{}, errors.New("Division by zero")
	}
	z := exactNumber{radMul(x.n, y.d), radMul(x.d, y.n)}
	return z, z.valid()
}
func (x exactNumber) equal(y exactNumber) bool {
	return len(radAdd(radMul(x.n, y.d), radNeg(radMul(y.n, x.d)))) == 0
}
func (x exactNumber) rat() (*big.Rat, bool) {
	if len(x.n) == 0 {
		return new(big.Rat), true
	}
	if len(x.n) != len(x.d) {
		return nil, false
	}
	var ratio *big.Rat
	for k, v := range x.d {
		n := x.n[k]
		if n == nil {
			return nil, false
		}
		r := new(big.Rat).Quo(n, v)
		if ratio == nil {
			ratio = r
		} else if ratio.Cmp(r) != 0 {
			return nil, false
		}
	}
	return ratio, ratio != nil
}
func (x exactNumber) valid() error {
	if len(x.d) == 0 {
		return errors.New("Division by zero")
	}
	for _, r := range []radical{x.n, x.d} {
		if len(r) > 256 {
			return errors.New("Expression is too complex")
		}
		for k, v := range r {
			ki, _ := new(big.Int).SetString(k, 10)
			if ki.BitLen() > 320 || v.Num().BitLen() > 8192 || v.Denom().BitLen() > 8192 {
				return errors.New("Expression is too large")
			}
		}
	}
	return nil
}
func (x exactNumber) pow(n int) (exactNumber, error) {
	if n < 0 {
		v, e := exactInt(1).div(x)
		if e != nil {
			return exactNumber{}, e
		}
		x = v
		n = -n
	}
	out := exactInt(1)
	for n > 0 {
		if n%2 == 1 {
			out = out.mul(x)
			if e := out.valid(); e != nil {
				return exactNumber{}, e
			}
		}
		n /= 2
		if n > 0 {
			x = x.mul(x)
			if e := x.valid(); e != nil {
				return exactNumber{}, e
			}
		}
	}
	return out, nil
}
func squareParts(n *big.Int) (int64, int64, error) {
	if !n.IsInt64() || n.Sign() < 0 || n.Int64() > 1000000000000 {
		return 0, 0, errors.New("Square root radicand is too large")
	}
	v := n.Int64()
	if v == 0 {
		return 0, 1, nil
	}
	outside, inside := int64(1), int64(1)
	for p := int64(2); p*p <= v; p++ {
		power := 0
		for v%p == 0 {
			v /= p
			power++
		}
		for i := 0; i < power/2; i++ {
			outside *= p
		}
		if power%2 != 0 {
			inside *= p
		}
	}
	inside *= v
	return outside, inside, nil
}
func exactSqrt(x exactNumber) (exactNumber, error) {
	r, ok := x.rat()
	if !ok || r.Sign() < 0 {
		return exactNumber{}, errors.New("Square roots require a nonnegative rational radicand")
	}
	an, bn, e := squareParts(new(big.Int).Mul(r.Num(), r.Denom()))
	if e != nil {
		return exactNumber{}, e
	}
	n := radical{}
	if an != 0 {
		n[strconv.FormatInt(bn, 10)] = new(big.Rat).SetFrac(big.NewInt(an), r.Denom())
	}
	return exactNumber{n, radRat(big.NewRat(1, 1))}, nil
}

type exactPoly map[string]exactNumber
type rationalPoly struct {
	n, d      exactPoly
	variables []string
	divisors  []exactPoly
}

func zeroMonomial(n int) string { return strings.Repeat("0,", n) }
func polyConst(x exactNumber, n int) exactPoly {
	if len(x.n) == 0 {
		return exactPoly{}
	}
	return exactPoly{zeroMonomial(n): x}
}
func polyAdd(a, b exactPoly) exactPoly {
	out := exactPoly{}
	for k, v := range a {
		out[k] = v
	}
	for k, v := range b {
		if x, ok := out[k]; ok {
			v = x.add(v)
		}
		if len(v.n) == 0 {
			delete(out, k)
		} else {
			out[k] = v
		}
	}
	return out
}
func polyNeg(a exactPoly) exactPoly {
	out := exactPoly{}
	for k, v := range a {
		out[k] = v.neg()
	}
	return out
}
func polyMul(a, b exactPoly) exactPoly {
	out := exactPoly{}
	for ka, va := range a {
		for kb, vb := range b {
			as, bs := strings.Split(ka, ","), strings.Split(kb, ",")
			for i := 0; i < len(as)-1; i++ {
				av, _ := strconv.Atoi(as[i])
				bv, _ := strconv.Atoi(bs[i])
				as[i] = strconv.Itoa(av + bv)
			}
			k := strings.Join(as, ",")
			v := va.mul(vb)
			if prev, ok := out[k]; ok {
				v = prev.add(v)
			}
			if len(v.n) == 0 {
				delete(out, k)
			} else {
				out[k] = v
			}
		}
	}
	return out
}
func (p rationalPoly) valid() error {
	if len(p.d) == 0 {
		return errors.New("Division by zero")
	}
	for _, xs := range []exactPoly{p.n, p.d} {
		if len(xs) > 1024 {
			return errors.New("Expression is too complex")
		}
		for k, x := range xs {
			for _, s := range strings.Split(k, ",") {
				degree, _ := strconv.Atoi(s)
				if degree > 100 {
					return errors.New("Polynomial degree is too large")
				}
			}
			if e := x.valid(); e != nil {
				return e
			}
		}
	}
	return nil
}
func constantPoly(x exactNumber, vs []string) rationalPoly {
	return rationalPoly{polyConst(x, len(vs)), polyConst(exactInt(1), len(vs)), vs, nil}
}
func (p rationalPoly) constant() (exactNumber, error) {
	key := zeroMonomial(len(p.variables))
	if len(p.n) > 1 || len(p.d) != 1 {
		return exactNumber{}, errors.New("Expected a number")
	}
	n, ok := p.n[key]
	if !ok && len(p.n) > 0 {
		return exactNumber{}, errors.New("Expected a number")
	}
	if len(p.n) == 0 {
		n = exactInt(0)
	}
	d, ok := p.d[key]
	if !ok {
		return exactNumber{}, errors.New("Expected a number")
	}
	return n.div(d)
}
func (p rationalPoly) equal(q rationalPoly) bool {
	return len(polyAdd(polyMul(p.n, q.d), polyNeg(polyMul(q.n, p.d)))) == 0
}
func (p rationalPoly) combine(q rationalPoly, op string) (rationalPoly, error) {
	r := rationalPoly{variables: p.variables, divisors: append(append([]exactPoly{}, p.divisors...), q.divisors...)}
	switch op {
	case "+":
		r.n = polyAdd(polyMul(p.n, q.d), polyMul(q.n, p.d))
		r.d = polyMul(p.d, q.d)
	case "-":
		r.n = polyAdd(polyMul(p.n, q.d), polyNeg(polyMul(q.n, p.d)))
		r.d = polyMul(p.d, q.d)
	case "*":
		r.n = polyMul(p.n, q.n)
		r.d = polyMul(p.d, q.d)
	case "/":
		if len(q.n) == 0 {
			return r, errors.New("Division by zero")
		}
		r.n = polyMul(p.n, q.d)
		r.d = polyMul(p.d, q.n)
		r.divisors = append(r.divisors, q.n)
	}
	return r, r.valid()
}
func (p rationalPoly) power(n int) (rationalPoly, error) {
	if n < 0 {
		if len(p.n) == 0 {
			return p, errors.New("Division by zero")
		}
		p.divisors = append(p.divisors, p.n)
		p.n, p.d = p.d, p.n
		n = -n
	}
	out := constantPoly(exactInt(1), p.variables)
	out.divisors = p.divisors
	for n > 0 {
		var e error
		if n%2 == 1 {
			out, e = out.combine(p, "*")
			if e != nil {
				return out, e
			}
		}
		n /= 2
		if n > 0 {
			p, e = p.combine(p, "*")
			if e != nil {
				return out, e
			}
		}
	}
	return out, nil
}

type mathParser struct {
	tokens    []string
	at, depth int
	variables []string
}

func normalizeMath(s string) string {
	s = strings.Trim(strings.TrimSpace(s), "$")
	return strings.NewReplacer("\\left", "", "\\right", "", "\\dfrac", "\\frac", "\\tfrac", "\\frac", "\\cdot", "*", "\\times", "*", "×", "*", "·", "*", "−", "-", "–", "-", "÷", "/", "√", "sqrt", "\\lambda", "lambda", "λ", "lambda", "\\,", "", "\\!", "", "\\;", "", "\\ ", " ").Replace(s)
}
func mathTokens(s string) ([]string, error) {
	s = normalizeMath(s)
	if len(s) > 4096 {
		return nil, errors.New("Expression is too long")
	}
	ts := []string{}
	r := []rune(s)
	for i := 0; i < len(r); {
		if unicode.IsSpace(r[i]) {
			i++
			continue
		}
		start := i
		c := r[i]
		if unicode.IsDigit(c) || c == '.' {
			i++
			for i < len(r) && (unicode.IsDigit(r[i]) || r[i] == '.') {
				i++
			}
		} else if unicode.IsLetter(c) || c == '\\' {
			i++
			for i < len(r) && (unicode.IsLetter(r[i]) || c != '\\' && (unicode.IsDigit(r[i]) || r[i] == '_')) {
				i++
			}
		} else if strings.ContainsRune("+-*/^!(),{}[]=;", c) {
			i++
		} else {
			return nil, fmt.Errorf("Unsupported symbol %q", c)
		}
		ts = append(ts, string(r[start:i]))
		if len(ts) > 1024 {
			return nil, errors.New("Expression is too complex")
		}
	}
	return ts, nil
}
func (p *mathParser) peek() string {
	if p.at >= len(p.tokens) {
		return ""
	}
	return p.tokens[p.at]
}
func (p *mathParser) take(s string) bool {
	if p.peek() == s {
		p.at++
		return true
	}
	return false
}
func (p *mathParser) expression() (rationalPoly, error) {
	p.depth++
	defer func() { p.depth-- }()
	if p.depth > 64 {
		return rationalPoly{}, errors.New("Expression is too deeply nested")
	}
	v, e := p.product()
	if e != nil {
		return v, e
	}
	for enum(p.peek(), "+", "-") {
		op := p.peek()
		p.at++
		rhs, e := p.product()
		if e != nil {
			return v, e
		}
		v, e = v.combine(rhs, op)
		if e != nil {
			return v, e
		}
	}
	return v, nil
}
func (p *mathParser) product() (rationalPoly, error) {
	v, e := p.unary()
	if e != nil {
		return v, e
	}
	for {
		op := p.peek()
		implicit := op != "" && !enum(op, "+", "-", ",", ")", "}", "]", ";", "=") && op != "*" && op != "/"
		if op != "*" && op != "/" && !implicit {
			break
		}
		if implicit {
			op = "*"
		} else {
			p.at++
		}
		rhs, e := p.unary()
		if e != nil {
			return v, e
		}
		v, e = v.combine(rhs, op)
		if e != nil {
			return v, e
		}
	}
	return v, nil
}
func (p *mathParser) unary() (rationalPoly, error) {
	if p.take("+") {
		return p.unary()
	}
	if p.take("-") {
		v, e := p.unary()
		v.n = polyNeg(v.n)
		return v, e
	}
	return p.power()
}
func (p *mathParser) power() (rationalPoly, error) {
	v, e := p.atom()
	if e != nil {
		return v, e
	}
	for p.take("!") {
		x, e := v.constant()
		if e != nil {
			return v, e
		}
		r, ok := x.rat()
		if !ok || !r.IsInt() || !r.Num().IsInt64() || r.Sign() < 0 || r.Num().Int64() > 1000 {
			return v, errors.New("Factorial requires an integer from 0 to 1000")
		}
		v = constantPoly(exactRat(new(big.Rat).SetInt(new(big.Int).MulRange(1, r.Num().Int64()))), p.variables)
	}
	if p.take("^") {
		rhs, e := p.unary()
		if e != nil {
			return v, e
		}
		x, e := rhs.constant()
		if e != nil {
			return v, e
		}
		r, ok := x.rat()
		if !ok || !r.IsInt() || !r.Num().IsInt64() || r.Num().Int64() < -100 || r.Num().Int64() > 100 {
			return v, errors.New("Use an integer power from -100 to 100")
		}
		// Keep the internal polynomial zero-power convention; source answers
		// must not rely on an explicitly evaluated zero-to-zero power.
		if r.Sign() == 0 && len(v.n) == 0 {
			return v, errors.New("Do not use 0^0 in a numerical answer. State the requested value directly")
		}
		return v.power(int(r.Num().Int64()))
	}
	return v, nil
}
func (p *mathParser) group() (rationalPoly, error) {
	open := p.peek()
	close := map[string]string{"(": ")", "{": "}", "[": "]"}[open]
	if close == "" {
		return rationalPoly{}, errors.New("Expected parentheses")
	}
	p.at++
	v, e := p.expression()
	if e != nil {
		return v, e
	}
	if !p.take(close) {
		return v, errors.New("Close the parentheses")
	}
	return v, nil
}
func (p *mathParser) atom() (rationalPoly, error) {
	token := p.peek()
	if token == "" {
		return rationalPoly{}, errors.New("Complete the expression")
	}
	if enum(token, "(", "{", "[") {
		return p.group()
	}
	p.at++
	switch token {
	case "\\frac":
		n, e := p.group()
		if e != nil {
			return n, e
		}
		d, e := p.group()
		if e != nil {
			return d, e
		}
		return n.combine(d, "/")
	case "sqrt", "\\sqrt":
		v, e := p.group()
		if e != nil {
			return v, e
		}
		x, e := v.constant()
		if e != nil {
			return v, e
		}
		x, e = exactSqrt(x)
		return constantPoly(x, p.variables), e
	case "binom", "binomial", "choose", "\\binom":
		var a, b rationalPoly
		var e error
		if token == "\\binom" {
			a, e = p.group()
			if e == nil {
				b, e = p.group()
			}
		} else {
			if !p.take("(") {
				return a, errors.New("Use binom(n,k)")
			}
			a, e = p.expression()
			if e == nil && !p.take(",") {
				e = errors.New("Use binom(n,k)")
			}
			if e == nil {
				b, e = p.expression()
			}
			if e == nil && !p.take(")") {
				e = errors.New("Use binom(n,k)")
			}
		}
		if e != nil {
			return a, e
		}
		av, e := a.constant()
		if e != nil {
			return a, e
		}
		bv, e := b.constant()
		if e != nil {
			return b, e
		}
		ar, ao := av.rat()
		br, bo := bv.rat()
		if !ao || !bo || !ar.IsInt() || !br.IsInt() || !ar.Num().IsInt64() || !br.Num().IsInt64() || ar.Sign() < 0 || br.Sign() < 0 || ar.Num().Int64() > 1000 || br.Num().Int64() > 1000 {
			return a, errors.New("Use integers 0 <= k <= n <= 1000")
		}
		if br.Cmp(ar) > 0 {
			return constantPoly(exactInt(0), p.variables), nil
		}
		return constantPoly(exactRat(new(big.Rat).SetInt(new(big.Int).Binomial(ar.Num().Int64(), br.Num().Int64()))), p.variables), nil
	}
	for i, v := range p.variables {
		if token == v {
			powers := make([]string, len(p.variables))
			for j := range powers {
				powers[j] = "0"
			}
			powers[i] = "1"
			x := constantPoly(exactInt(1), p.variables)
			x.n = exactPoly{strings.Join(powers, ",") + ",": exactInt(1)}
			return x, nil
		}
	}
	if v, ok := new(big.Rat).SetString(token); ok {
		x := constantPoly(exactRat(v), p.variables)
		return x, x.valid()
	}
	return rationalPoly{}, fmt.Errorf("Unsupported expression %q", token)
}
func parsePolynomial(s string, vs []string) (rationalPoly, error) {
	tokens, e := mathTokens(s)
	if e != nil {
		return rationalPoly{}, e
	}
	p := mathParser{tokens: tokens, variables: vs}
	v, e := p.expression()
	if e != nil {
		return v, e
	}
	if p.at != len(tokens) {
		return v, errors.New("Unexpected expression suffix")
	}
	return v, v.valid()
}
func parseExact(s string) (exactNumber, error) {
	p, e := parsePolynomial(s, nil)
	if e != nil {
		return exactNumber{}, e
	}
	return p.constant()
}
func stripMatrixMarkup(s string) string {
	s = strings.TrimSpace(normalizeMath(s))
	for _, kind := range []string{"matrix", "pmatrix", "bmatrix", "vmatrix", "Bmatrix", "Vmatrix"} {
		s = strings.ReplaceAll(s, "\\begin{"+kind+"}", "")
		s = strings.ReplaceAll(s, "\\end{"+kind+"}", "")
	}
	return strings.TrimSpace(s)
}
func splitMathList(s string) ([]string, error) {
	s = stripMatrixMarkup(s)
	if len(s) >= 2 && ((s[0] == '(' && s[len(s)-1] == ')') || (s[0] == '[' && s[len(s)-1] == ']')) {
		depth := 0
		whole := true
		for i, c := range s {
			if c == '(' || c == '[' {
				depth++
			}
			if c == ')' || c == ']' {
				depth--
			}
			if depth == 0 && i < len(s)-1 {
				whole = false
				break
			}
		}
		if whole {
			s = s[1 : len(s)-1]
		}
	}
	parts := []string{}
	depth, start := 0, 0
	for i := 0; i < len(s); i++ {
		c := s[i]
		if strings.ContainsRune("([{", rune(c)) {
			depth++
		}
		if strings.ContainsRune(")]}", rune(c)) {
			depth--
		}
		if depth < 0 {
			return nil, errors.New("Check answer delimiters")
		}
		double := i+1 < len(s) && s[i] == '\\' && s[i+1] == '\\'
		if depth == 0 && (c == ',' || c == ';' || c == '&' || c == '\n' || double) {
			parts = append(parts, strings.TrimSpace(s[start:i]))
			if double {
				i++
			}
			start = i + 1
		}
	}
	if depth != 0 {
		return nil, errors.New("Close answer delimiters")
	}
	parts = append(parts, strings.TrimSpace(s[start:]))
	for _, part := range parts {
		if part == "" {
			return nil, errors.New("Complete every entry")
		}
	}
	return parts, nil
}
func enclosedMath(s string, left, right byte) bool {
	if len(s) < 2 || s[0] != left || s[len(s)-1] != right {
		return false
	}
	depth := 0
	for i := 0; i < len(s); i++ {
		if s[i] == left {
			depth++
		}
		if s[i] == right {
			depth--
		}
		if depth == 0 && i < len(s)-1 {
			return false
		}
	}
	return depth == 0
}
func parseMatrix(s string) ([][]string, error) {
	s = stripMatrixMarkup(s)
	s = strings.NewReplacer("\\{", "{", "\\}", "}").Replace(s)
	if enclosedMath(s, '[', ']') || enclosedMath(s, '{', '}') {
		s = strings.TrimSpace(s[1 : len(s)-1])
	}
	grouped, e := splitMathList(s)
	if e != nil {
		return nil, e
	}
	rowsGrouped := len(grouped) > 1
	for _, row := range grouped {
		rowsGrouped = rowsGrouped && (enclosedMath(row, '(', ')') || enclosedMath(row, '[', ']'))
	}
	if rowsGrouped {
		out := [][]string{}
		for _, row := range grouped {
			xs, e := splitMathList(row)
			if e != nil {
				return nil, e
			}
			if len(out) > 0 && len(xs) != len(out[0]) {
				return nil, errors.New("Use equal-length vector rows")
			}
			out = append(out, xs)
		}
		return out, nil
	}

	s = regexp.MustCompile(`\]\s*,\s*\[`).ReplaceAllString(s, ";")
	s = strings.ReplaceAll(s, strings.Repeat(string(rune(92)), 2), ";")
	s = strings.ReplaceAll(s, "\n", ";")
	rows := strings.Split(s, ";")
	out := [][]string{}
	for _, row := range rows {
		row = strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(row, "["), "]"))
		xs, e := splitMathList(row)
		if e != nil {
			return nil, e
		}
		if len(out) > 0 && len(xs) != len(out[0]) {
			return nil, errors.New("Use equal-length matrix rows")
		}
		out = append(out, xs)
	}
	return out, nil
}

func checkExactRequirement(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	expected := []string{}
	ordered := true
	switch r.Validator {
	case "exact":
		var p struct {
			Expected []string `json:"expected"`
		}
		jsonParams(r, &p)
		expected = p.Expected
	case "tuple":
		var p struct {
			Expected []string `json:"expected"`
			Ordered  *bool    `json:"ordered"`
		}
		jsonParams(r, &p)
		expected = p.Expected
		if p.Ordered != nil {
			ordered = *p.Ordered
		}
		xs, e = splitMathList(xs[0])
		if e != nil {
			return false, e
		}
	case "matrix":
		var p struct {
			Expected [][]string `json:"expected"`
		}
		jsonParams(r, &p)
		for _, row := range p.Expected {
			expected = append(expected, row...)
		}
		if len(xs) == 1 {
			rows, err := parseMatrix(xs[0])
			if err != nil {
				return false, err
			}
			if len(rows) != len(p.Expected) || len(rows[0]) != len(p.Expected[0]) {
				for _, row := range rows {
					for _, s := range row {
						if _, e := parseExact(s); e != nil {
							return false, e
						}
					}
				}
				return false, nil
			}
			xs = nil
			for _, row := range rows {
				xs = append(xs, row...)
			}
		}
	}
	actual := []exactNumber{}
	for _, s := range xs {
		v, e := parseExact(s)
		if e != nil {
			return false, e
		}
		actual = append(actual, v)
	}
	if len(actual) != len(expected) {
		return false, nil
	}
	want := []exactNumber{}
	for _, s := range expected {
		v, e := parseExact(s)
		if e != nil {
			return false, e
		}
		want = append(want, v)
	}
	if ordered {
		for i, v := range actual {
			if !v.equal(want[i]) {
				return false, nil
			}
		}
		return true, nil
	}
	used := make([]bool, len(want))
	for _, v := range actual {
		found := false
		for j, w := range want {
			if !used[j] && v.equal(w) {
				used[j] = true
				found = true
				break
			}
		}
		if !found {
			return false, nil
		}
	}
	return true, nil
}

// Keep deterministic map iteration out of normalized expression diagnostics.
func polynomialKeys(p exactPoly) []string {
	keys := []string{}
	for k := range p {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
