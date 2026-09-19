package main

import (
	"errors"
	"regexp"
	"strconv"
	"strings"
)

type recurrenceParams struct {
	Expected string `json:"expected"`
	Sequence string `json:"sequence"`
	Variable string `json:"variable"`
	MaxLag   int    `json:"maxLag"`
}

func validateRecurrence(r AssessmentRequirement) error {
	var p recurrenceParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	name := regexp.MustCompile(`^[_A-Za-z][_A-Za-z0-9]*$`)
	if len(r.Fields) != 1 || p.MaxLag < 1 || p.MaxLag > 8 || !name.MatchString(p.Sequence) || !name.MatchString(p.Variable) || p.Sequence == p.Variable || strings.HasPrefix(p.Variable, "recurrenceLag") {
		return errors.New("Invalid recurrence definition")
	}
	_, e := recurrenceEquivalent(p.Expected, p.Expected, p)
	return e
}
func transformRecurrence(source string, p recurrenceParams) (string, error) {
	if len(source) > 4096 || regexp.MustCompile(`\brecurrenceLag[0-9]+\b`).MatchString(source) {
		return "", errors.New("Use a shorter recurrence with the stated sequence name")
	}
	source = regexp.MustCompile(`\b`+regexp.QuoteMeta(p.Sequence)+`_\{([^{}]+)\}`).ReplaceAllString(source, p.Sequence+"($1)")
	s := strings.NewReplacer("{", "(", "}", ")").Replace(normalizeMath(source))
	call := regexp.MustCompile(`^` + regexp.QuoteMeta(p.Sequence) + `\s*\(`)
	result := ""
	for i := 0; i < len(s); {
		m := call.FindString(s[i:])
		if m == "" || i > 0 && (s[i-1] >= 'a' && s[i-1] <= 'z' || s[i-1] >= 'A' && s[i-1] <= 'Z' || s[i-1] >= '0' && s[i-1] <= '9' || s[i-1] == '_') {
			result += s[i : i+1]
			i++
			continue
		}
		start := i + len(m)
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
			return "", errors.New("Close the recurrence argument")
		}
		arg, e := parsePolynomial(s[start:end], []string{p.Variable})
		if e != nil {
			return "", e
		}
		for _, q := range arg.divisors {
			for k := range q {
				if k != zeroMonomial(1) {
					return "", errors.New("Use an earlier sequence index such as F(n-1)")
				}
			}
		}
		variable, e := parsePolynomial(p.Variable, []string{p.Variable})
		if e != nil {
			return "", e
		}
		difference, e := arg.combine(variable, "-")
		if e != nil {
			return "", e
		}
		constant, e := difference.constant()
		if e != nil {
			return "", e
		}
		offset, ok := constant.rat()
		if !ok || !offset.IsInt() || !offset.Num().IsInt64() || offset.Sign() >= 0 || offset.Num().Int64() < -int64(p.MaxLag) {
			return "", errors.New("Use an earlier index within the permitted lag")
		}
		result += "recurrenceLag" + strconv.FormatInt(-offset.Num().Int64(), 10)
		i = end + 1
	}
	return result, nil
}
func recurrenceEquivalent(actual, expected string, p recurrenceParams) (bool, error) {
	vs := []string{p.Variable}
	for i := 1; i <= p.MaxLag; i++ {
		vs = append(vs, "recurrenceLag"+strconv.Itoa(i))
	}
	a, e := transformRecurrence(actual, p)
	if e != nil {
		return false, e
	}
	b, e := transformRecurrence(expected, p)
	if e != nil {
		return false, e
	}
	ap, e := parsePolynomial(a, vs)
	if e != nil {
		return false, e
	}
	bp, e := parsePolynomial(b, vs)
	if e != nil {
		return false, e
	}
	if !ap.equal(bp) {
		return false, nil
	}
	return samePolynomialDomain(ap, bp, nil)
}
func checkRecurrence(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p recurrenceParams
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	return recurrenceEquivalent(xs[0], p.Expected, p)
}
