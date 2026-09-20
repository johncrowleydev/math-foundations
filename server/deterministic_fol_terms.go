package main

import (
	"errors"
	"regexp"
	"strconv"
	"strings"
)

type functionTerm struct {
	name, symbol string
	args         []rationalPoly
}

var functionStart = regexp.MustCompile(`^([A-Za-z][A-Za-z0-9_]*)\s*\(`)

// A registry only appends symbols. Pad earlier polynomials before comparing them
// with expressions parsed after another total function term was introduced.
func padPolynomial(p rationalPoly, variables []string) rationalPoly {
	if len(p.variables) == len(variables) {
		return p
	}
	pad := func(poly exactPoly) exactPoly {
		out := exactPoly{}
		suffix := strings.Repeat("0,", len(variables)-len(p.variables))
		for k, v := range poly {
			out[k+suffix] = v
		}
		return out
	}
	p.n = pad(p.n)
	p.d = pad(p.d)
	ds := []exactPoly{}
	for _, d := range p.divisors {
		ds = append(ds, pad(d))
	}
	p.divisors = ds
	p.variables = append([]string{}, variables...)
	return p
}
func commonPolynomials(a, b rationalPoly) (rationalPoly, rationalPoly) {
	vs := a.variables
	if len(b.variables) > len(vs) {
		vs = b.variables
	}
	return padPolynomial(a, vs), padPolynomial(b, vs)
}
func logicalExpression(source string, variables []string, functions map[string]int, registry *[]functionTerm, depth int) (rationalPoly, error) {
	if depth > 64 || len(source) > 4096 {
		return rationalPoly{}, errors.New("Function terms are nested too deeply or too long")
	}
	result := ""
	exclusions := []rationalPoly{}
	for i := 0; i < len(source); {
		m := functionStart.FindStringSubmatch(source[i:])
		if m == nil || functions[m[1]] == 0 || (i > 0 && (source[i-1] >= 'a' && source[i-1] <= 'z' || source[i-1] >= 'A' && source[i-1] <= 'Z' || source[i-1] >= '0' && source[i-1] <= '9' || source[i-1] == '_')) {
			result += source[i : i+1]
			i++
			continue
		}
		name := m[1]
		start := i + len(m[0])
		end, nesting, part := start, 1, start
		raw := []string{}
		for end < len(source) && nesting > 0 {
			c := source[end]
			if c == '(' {
				nesting++
			}
			if c == ')' {
				nesting--
			}
			if c == ',' && nesting == 1 {
				raw = append(raw, source[part:end])
				part = end + 1
			}
			if nesting == 0 {
				raw = append(raw, source[part:end])
				break
			}
			end++
		}
		if nesting != 0 || len(raw) != functions[name] {
			return rationalPoly{}, errors.New("Use the function's stated number of arguments")
		}
		args := []rationalPoly{}
		for _, s := range raw {
			if strings.TrimSpace(s) == "" {
				return rationalPoly{}, errors.New("Complete each function argument")
			}
			arg, e := logicalExpression(s, variables, functions, registry, depth+1)
			if e != nil {
				return rationalPoly{}, e
			}
			args = append(args, arg)
			exclusions = append(exclusions, arg)
		}
		symbol := ""
		for _, term := range *registry {
			if term.name != name || len(term.args) != len(args) {
				continue
			}
			same := true
			for j, arg := range args {
				a, b := commonPolynomials(arg, term.args[j])
				if !a.equal(b) {
					same = false
					break
				}
				domains, e := samePolynomialDomain(a, b, nil)
				if e != nil {
					return rationalPoly{}, e
				}
				if !domains {
					same = false
					break
				}
			}
			if same {
				symbol = term.symbol
				break
			}
		}
		if symbol == "" {
			id := len(*registry)
			for {
				symbol = "functionValue" + strconv.Itoa(id)
				id++
				taken := contains(variables, symbol)
				for _, term := range *registry {
					taken = taken || term.symbol == symbol
				}
				if !taken {
					break
				}
			}
			*registry = append(*registry, functionTerm{name, symbol, args})
			if len(*registry) > 128 {
				return rationalPoly{}, errors.New("Use fewer function terms")
			}
		}
		result += symbol
		i = end + 1
	}
	vs := append([]string{}, variables...)
	for _, term := range *registry {
		vs = append(vs, term.symbol)
	}
	p, e := parsePolynomial(result, vs)
	if e != nil {
		return p, e
	}
	for _, arg := range exclusions {
		arg = padPolynomial(arg, vs)
		p.divisors = append(p.divisors, arg.divisors...)
	}
	return p, nil
}
