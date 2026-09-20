package main

import (
	"errors"
	"math/big"
)

type asymptoticParams struct {
	Kind           string `json:"kind"`
	ExceptionValue string `json:"exceptionValue"`
	Leading        string `json:"leading"`
	Terms          []struct {
		Coefficient string `json:"coefficient"`
		Power       int    `json:"power"`
	} `json:"terms"`
}

func validateAsymptotic(r AssessmentRequirement) error {
	var p asymptoticParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if !enum(p.Kind, "finite-exception", "parity-linear-quadratic", "positive-polynomial-ratio", "n-log-n-plus-n") {
		return errors.New("Unknown asymptotic bound family")
	}
	count := 3
	if p.Kind == "parity-linear-quadratic" {
		count = 4
	}
	if len(r.Fields) != count {
		return errors.New("Invalid asymptotic bound field count")
	}
	if p.Kind == "finite-exception" {
		x, e := parseExact(p.ExceptionValue)
		if e != nil {
			return e
		}
		sign, e := x.add(exactInt(-1)).sign()
		if e != nil {
			return e
		}
		if sign < 0 {
			return errors.New("Exceptional ratio must be at least one")
		}
	}
	if p.Kind == "positive-polynomial-ratio" {
		x, e := parseExact(p.Leading)
		if e != nil {
			return e
		}
		sign, e := x.sign()
		if e != nil {
			return e
		}
		if sign <= 0 || p.Terms == nil || len(p.Terms) > 16 {
			return errors.New("Invalid positive polynomial ratio")
		}
		for _, t := range p.Terms {
			v, e := parseExact(t.Coefficient)
			if e != nil {
				return e
			}
			sign, e := v.sign()
			if e != nil {
				return e
			}
			if sign < 0 || t.Power < 1 || t.Power > 100 {
				return errors.New("Use nonnegative tail coefficients and positive powers")
			}
		}
	}
	return nil
}
func positiveThreshold(x exactNumber) *big.Int {
	v, ok := x.rat()
	if !ok || !v.IsInt() || v.Sign() <= 0 {
		return nil
	}
	return v.Num()
}
func checkAsymptotic(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p asymptoticParams
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	values := []exactNumber{}
	for _, s := range xs {
		x, e := parseExact(s)
		if e != nil {
			return false, e
		}
		values = append(values, x)
	}
	positive := func(x exactNumber) (bool, error) { sign, e := x.sign(); return sign > 0, e }
	if p.Kind == "parity-linear-quadratic" {
		upper, lower := values[0], values[2]
		for _, x := range []exactNumber{upper, lower} {
			ok, e := positive(x)
			if e != nil || !ok {
				return ok, e
			}
		}
		if positiveThreshold(values[1]) == nil || positiveThreshold(values[3]) == nil {
			return false, nil
		}
		u, e := upper.add(exactInt(-1)).sign()
		if e != nil {
			return false, e
		}
		l, e := lower.add(exactInt(-1)).sign()
		return u >= 0 && l <= 0, e
	}
	lower, upper, at := values[0], values[1], values[2]
	n := positiveThreshold(at)
	if n == nil {
		return false, nil
	}
	for _, x := range []exactNumber{lower, upper} {
		ok, e := positive(x)
		if e != nil || !ok {
			return ok, e
		}
	}
	leading, required := exactInt(1), exactInt(1)
	switch p.Kind {
	case "finite-exception":
		if n.Cmp(big.NewInt(1)) == 0 {
			required, e = parseExact(p.ExceptionValue)
			if e != nil {
				return false, e
			}
		}
	case "positive-polynomial-ratio":
		leading, e = parseExact(p.Leading)
		if e != nil {
			return false, e
		}
		required = leading
		for _, t := range p.Terms {
			coefficient, e := parseExact(t.Coefficient)
			if e != nil {
				return false, e
			}
			den, e := at.pow(t.Power)
			if e != nil {
				return false, e
			}
			term, e := coefficient.div(den)
			if e != nil {
				return false, e
			}
			required = required.add(term)
			if e := required.valid(); e != nil {
				return false, e
			}
		}
	case "n-log-n-plus-n":
		if n.Cmp(big.NewInt(1)) <= 0 {
			return false, nil
		}
		power := big.NewInt(1)
		k := int64(0)
		for power.Cmp(n) < 0 {
			power.Lsh(power, 1)
			k++
		}
		fraction, e := exactInt(1).div(exactInt(k))
		if e != nil {
			return false, e
		}
		required = required.add(fraction)
	default:
		return false, errors.New("Unknown asymptotic bound family")
	}
	l, e := lower.add(leading.neg()).sign()
	if e != nil {
		return false, e
	}
	u, e := upper.add(required.neg()).sign()
	return l <= 0 && u >= 0, e
}
