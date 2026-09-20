package main

import (
	"errors"
	"regexp"
	"strconv"
	"strings"
)

type elementaryParams struct {
	Expected string `json:"expected"`
	Variable string `json:"variable"`
	Domain   string `json:"domain"`
}

func elementaryMonomial(source, variable string) (exactNumber, int, error) {
	p, e := parsePolynomial(source, []string{variable})
	if e != nil {
		return exactNumber{}, 0, e
	}
	zero := zeroMonomial(1)
	for k := range p.d {
		if k != zero {
			return exactNumber{}, 0, errors.New("Use a supported monomial inside the radical or absolute value")
		}
	}
	for _, d := range p.divisors {
		for k := range d {
			if k != zero {
				return exactNumber{}, 0, errors.New("Use a supported monomial inside the radical or absolute value")
			}
		}
	}
	if len(p.n) > 1 {
		return exactNumber{}, 0, errors.New("Use a supported monomial inside the radical or absolute value")
	}
	coefficient, degree := exactInt(0), 0
	for k, v := range p.n {
		coefficient = v
		degree = monomialPowers(k)[0]
	}
	den := p.d[zero]
	coefficient, e = coefficient.div(den)
	return coefficient, degree, e
}

var elementaryAbs = regexp.MustCompile(`\|([^|]+)\|`)
var elementaryHalf = regexp.MustCompile(`\^\s*\(\s*(?:1\s*/\s*2|0\.5)\s*\)`)
var elementaryCall = regexp.MustCompile(`^(sqrt|abs)\s*\(`)
var elementaryInternal = regexp.MustCompile(`\bradicalRoot\b`)

func elementaryExpression(source, variable, domain string, sign int) (rationalPoly, error) {
	if elementaryInternal.MatchString(source) {
		return rationalPoly{}, errors.New("Use the stated variable")
	}
	s := strings.NewReplacer("\\sqrt", "sqrt", "\\lvert", "|", "\\rvert", "|", "{", "(", "}", ")").Replace(normalizeMath(source))
	s = elementaryAbs.ReplaceAllString(s, "abs($1)")
	if len(s) > 4096 {
		return rationalPoly{}, errors.New("Use a shorter expression")
	}
	for pass := 0; pass < 64; pass++ {
		half := elementaryHalf.FindStringIndex(s)
		if half == nil {
			break
		}
		begin := half[0] - 1
		for begin >= 0 && s[begin] == ' ' {
			begin--
		}
		end := begin + 1
		if begin >= 0 && s[begin] == ')' {
			depth := 1
			begin--
			for begin >= 0 {
				if s[begin] == ')' {
					depth++
				}
				if s[begin] == '(' {
					depth--
				}
				if depth == 0 {
					break
				}
				begin--
			}
			if depth != 0 {
				return rationalPoly{}, errors.New("Check the square root exponent")
			}
		} else {
			for begin >= 0 && (s[begin] >= 'a' && s[begin] <= 'z' || s[begin] >= 'A' && s[begin] <= 'Z' || s[begin] >= '0' && s[begin] <= '9' || s[begin] == '_' || s[begin] == '.') {
				begin--
			}
			begin++
		}
		if begin >= end {
			return rationalPoly{}, errors.New("Put a base before the half power")
		}
		s = s[:begin] + "sqrt(" + s[begin:end] + ")" + s[half[1]:]
	}
	result := ""
	for i := 0; i < len(s); {
		match := elementaryCall.FindStringSubmatch(s[i:])
		if match == nil {
			result += s[i : i+1]
			i++
			continue
		}
		start := i + len(match[0])
		end, depth := start, 1
		for end < len(s) && depth > 0 {
			if s[end] == '(' {
				depth++
			}
			if s[end] == ')' {
				depth--
			}
			if depth > 0 {
				end++
			}
		}
		if depth > 0 {
			return rationalPoly{}, errors.New("Close the radical or absolute value")
		}
		coefficient, degree, e := elementaryMonomial(s[start:end], variable)
		if e != nil {
			return rationalPoly{}, e
		}
		coefficientSign, e := coefficient.sign()
		if e != nil {
			return rationalPoly{}, e
		}
		term := ""
		if match[1] == "sqrt" {
			if coefficientSign < 0 {
				return rationalPoly{}, errors.New("A real square root needs a nonnegative radicand")
			}
			if domain == "real" && degree%2 != 0 {
				return rationalPoly{}, errors.New("This radical is not real on the full stated domain")
			}
			halfDegree := degree
			name := variable
			if domain == "real" {
				halfDegree = degree / 2
			} else {
				name = "radicalRoot"
			}
			factor := 1
			if domain == "real" && sign < 0 && halfDegree%2 != 0 {
				factor = -1
			}
			rational, ok := coefficient.rat()
			if !ok {
				return rationalPoly{}, errors.New("Use a rational radical coefficient")
			}
			term = "(" + strconv.Itoa(factor) + ")*sqrt(" + rational.RatString() + ")*" + name + "^" + strconv.Itoa(halfDegree)
		} else {
			factor := 1
			if coefficientSign < 0 {
				factor = -1
			}
			if domain == "real" && sign < 0 && degree%2 != 0 {
				factor = -factor
			}
			term = "(" + strconv.Itoa(factor) + ")*(" + s[start:end] + ")"
		}
		result += "(" + term + ")"
		i = end + 1
	}
	finalVariable := variable
	if domain == "nonnegative" {
		result = regexp.MustCompile(`\b`+regexp.QuoteMeta(variable)+`\b`).ReplaceAllString(result, "(radicalRoot^2)")
		finalVariable = "radicalRoot"
	}
	return parsePolynomial(result, []string{finalVariable})
}
func elementaryEquivalent(actual, expected, variable, domain string) (bool, error) {
	signs := []int{1}
	if domain == "real" {
		signs = append(signs, -1)
	}
	all := true
	for _, sign := range signs {
		a, e := elementaryExpression(actual, variable, domain, sign)
		if e != nil {
			return false, e
		}
		b, e := elementaryExpression(expected, variable, domain, sign)
		if e != nil {
			return false, e
		}
		same, e := samePolynomialDomain(a, b, nil)
		if e != nil {
			return false, e
		}
		all = all && a.equal(b) && same
	}
	return all, nil
}
func validateElementary(r AssessmentRequirement) error {
	if r.Validator == "square-inverse" {
		if len(r.Fields) != 5 {
			return errors.New("A square inverse needs the interval and inverse formula")
		}
		return nil
	}
	var p elementaryParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if p.Domain == "" {
		p.Domain = "real"
	}
	if len(r.Fields) != 1 || !regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]*$`).MatchString(p.Variable) || p.Variable == "radicalRoot" || !enum(p.Domain, "real", "nonnegative") {
		return errors.New("Invalid elementary formula definition")
	}
	_, e := elementaryEquivalent(p.Expected, p.Expected, p.Variable, p.Domain)
	return e
}
func checkElementary(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p elementaryParams
	jsonParams(r, &p)
	if p.Domain == "" {
		p.Domain = "real"
	}
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	return elementaryEquivalent(xs[0], p.Expected, p.Variable, p.Domain)
}
func checkSquareInverse(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	read := func(i int) (string, error) {
		s, ok := response[r.Fields[i]].(string)
		if !ok {
			return "", errors.New("Enter the requested formula")
		}
		return s, nil
	}
	lower, e := read(0)
	if e != nil {
		return false, e
	}
	upper, e := read(1)
	if e != nil {
		return false, e
	}
	formula, e := read(4)
	if e != nil {
		return false, e
	}
	normalize := func(s string) string {
		return strings.TrimPrefix(strings.NewReplacer("\\infty", "infinity", "∞", "infinity").Replace(strings.TrimSpace(s)), "+")
	}
	lower, upper = normalize(lower), normalize(upper)
	plus, e := elementaryEquivalent(formula, "sqrt(y)", "y", "nonnegative")
	if e != nil {
		return false, e
	}
	minus, e := elementaryEquivalent(formula, "-sqrt(y)", "y", "nonnegative")
	if e != nil {
		return false, e
	}
	isZero := func(s string) (bool, error) {
		if strings.Contains(s, "infinity") {
			return false, nil
		}
		x, e := parseExact(s)
		if e != nil {
			return false, e
		}
		return len(x.n) == 0, nil
	}
	lowerZero, e := isZero(lower)
	if e != nil {
		return false, e
	}
	upperZero, e := isZero(upper)
	if e != nil {
		return false, e
	}
	left, lok := response[r.Fields[2]].(bool)
	right, rok := response[r.Fields[3]].(bool)
	return lok && rok && (lowerZero && upper == "infinity" && left && !right && plus || lower == "-infinity" && upperZero && !left && right && minus), nil
}
