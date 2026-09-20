package main

import "errors"

type approximateParameters struct {
	Expected  exactNumber
	Tolerance exactNumber
	Minimum   *exactNumber
	Maximum   *exactNumber
}

func approximateParams(r AssessmentRequirement) (approximateParameters, error) {
	p := approximateParameters{}
	var raw map[string]any
	if jsonParams(r, &raw) != nil || len(r.Fields) != 1 {
		return p, errors.New("Invalid approximate-number parameters")
	}
	for key := range raw {
		if key != "expected" && key != "tolerance" && key != "minimum" && key != "maximum" {
			return p, errors.New("Invalid approximate-number parameters")
		}
	}
	read := func(key string) (exactNumber, error) {
		s, ok := raw[key].(string)
		if !ok {
			return exactNumber{}, errors.New("Expected exact string for " + key)
		}
		return parseExact(s)
	}
	var e error
	if p.Expected, e = read("expected"); e != nil {
		return p, e
	}
	if p.Tolerance, e = read("tolerance"); e != nil {
		return p, e
	}
	sign, e := p.Tolerance.sign()
	if e != nil {
		return p, e
	}
	if sign <= 0 {
		return p, errors.New("Approximate-number tolerance must be positive")
	}
	for _, key := range []string{"minimum", "maximum"} {
		if _, exists := raw[key]; !exists {
			continue
		}
		bound, e := read(key)
		if e != nil {
			return p, e
		}
		sign, e := p.Expected.add(bound.neg()).sign()
		if e != nil {
			return p, e
		}
		if key == "minimum" && sign < 0 || key == "maximum" && sign > 0 {
			return p, errors.New("Approximate-number expected value must lie within its inclusive bounds")
		}
		if key == "minimum" {
			p.Minimum = &bound
		} else {
			p.Maximum = &bound
		}
	}
	return p, nil
}
func checkApproximate(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	p, e := approximateParams(r)
	if e != nil {
		return false, e
	}
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	value, e := parseExact(xs[0])
	if e != nil {
		return false, errors.New("Enter a decimal, fraction, or numeric arithmetic expression in the stated units. Use sqrt for radicals; percent signs, scientific notation, and distribution functions are not supported. " + e.Error())
	}
	for _, check := range []struct {
		bound   *exactNumber
		minimum bool
	}{{p.Minimum, true}, {p.Maximum, false}} {
		if check.bound == nil {
			continue
		}
		sign, e := value.add(check.bound.neg()).sign()
		if e != nil {
			return false, e
		}
		if check.minimum && sign < 0 || !check.minimum && sign > 0 {
			return false, nil
		}
	}
	difference := value.add(p.Expected.neg())
	high, e := difference.add(p.Tolerance.neg()).sign()
	if e != nil {
		return false, e
	}
	low, e := difference.add(p.Tolerance).sign()
	return high <= 0 && low >= 0, e
}
