package main

import "errors"

// A Boolean combination of linear comparisons is constant between consecutive
// comparison roots. Checking each root and every resulting open interval is an
// exhaustive exact decomposition of R, not heuristic sampling of an identity.
type linearComparison struct {
	a, c exactNumber
	op   string
}

func linearCondition(n *quantifiedNode, variable string) (linearComparison, error) {
	left, e := parsePolynomial(n.leftText, []string{variable})
	if e != nil {
		return linearComparison{}, e
	}
	right, e := parsePolynomial(n.rightText, []string{variable})
	if e != nil {
		return linearComparison{}, e
	}
	p, e := left.combine(right, "-")
	if e != nil {
		return linearComparison{}, e
	}
	for k := range p.d {
		if k != "0," {
			return linearComparison{}, errors.New("Use linear inequalities with constant denominators")
		}
	}
	for k := range p.n {
		if k != "0," && k != "1," {
			return linearComparison{}, errors.New("Use linear inequalities")
		}
	}
	for _, poly := range p.divisors {
		for k := range poly {
			if k != "0," {
				return linearComparison{}, errors.New("Use inequalities without variable denominators")
			}
		}
	}
	den := p.d["0,"]
	a, c := exactInt(0), exactInt(0)
	if x, ok := p.n["1,"]; ok {
		a, e = x.div(den)
		if e != nil {
			return linearComparison{}, e
		}
	}
	if x, ok := p.n["0,"]; ok {
		c, e = x.div(den)
		if e != nil {
			return linearComparison{}, e
		}
	}
	return linearComparison{a, c, n.op}, nil
}
func inequalityEquivalent(actual, expected, variable string) (bool, error) {
	parse := func(s string) (*quantifiedNode, error) {
		q, e := parseQuantified("forall "+variable+" in R ("+s+")", []string{"R"}, nil)
		if e != nil {
			return nil, e
		}
		return q.body, nil
	}
	a, e := parse(actual)
	if e != nil {
		return false, e
	}
	b, e := parse(expected)
	if e != nil {
		return false, e
	}
	conditions := map[*quantifiedNode]linearComparison{}
	roots := []exactNumber{}
	var collect func(*quantifiedNode) error
	collect = func(n *quantifiedNode) error {
		switch n.kind {
		case "not":
			return collect(n.body)
		case "and", "or", "implies", "iff":
			if e := collect(n.left); e != nil {
				return e
			}
			return collect(n.right)
		case "comparison":
			c, e := linearCondition(n, variable)
			if e != nil {
				return e
			}
			conditions[n] = c
			if len(c.a.n) > 0 {
				root, e := c.c.neg().div(c.a)
				if e != nil {
					return e
				}
				for _, old := range roots {
					if root.equal(old) {
						return nil
					}
				}
				roots = append(roots, root)
			}
			return nil
		default:
			return errors.New("Use linear comparisons joined by and/or")
		}
	}
	if e = collect(a); e != nil {
		return false, e
	}
	if e = collect(b); e != nil {
		return false, e
	}
	for i := 1; i < len(roots); i++ {
		for j := i; j > 0; j-- {
			sign, e := roots[j].add(roots[j-1].neg()).sign()
			if e != nil {
				return false, e
			}
			if sign >= 0 {
				break
			}
			roots[j], roots[j-1] = roots[j-1], roots[j]
		}
	}
	points := append([]exactNumber{}, roots...)
	if len(roots) == 0 {
		points = append(points, exactInt(0))
	} else {
		points = append(points, roots[0].add(exactInt(-1)), roots[len(roots)-1].add(exactInt(1)))
		for i := 1; i < len(roots); i++ {
			mid, e := roots[i-1].add(roots[i]).div(exactInt(2))
			if e != nil {
				return false, e
			}
			points = append(points, mid)
		}
	}
	var evaluate func(*quantifiedNode, exactNumber) (bool, error)
	evaluate = func(n *quantifiedNode, x exactNumber) (bool, error) {
		if n.kind == "comparison" {
			c := conditions[n]
			sign, e := c.a.mul(x).add(c.c).sign()
			if e != nil {
				return false, e
			}
			switch c.op {
			case "=":
				return sign == 0, nil
			case "!=":
				return sign != 0, nil
			case "<":
				return sign < 0, nil
			case "<=":
				return sign <= 0, nil
			case ">":
				return sign > 0, nil
			case ">=":
				return sign >= 0, nil
			}
			return false, errors.New("Invalid comparison")
		}
		if n.kind == "not" {
			v, e := evaluate(n.body, x)
			return !v, e
		}
		left, e := evaluate(n.left, x)
		if e != nil {
			return false, e
		}
		right, e := evaluate(n.right, x)
		if e != nil {
			return false, e
		}
		switch n.kind {
		case "and":
			return left && right, nil
		case "or":
			return left || right, nil
		case "implies":
			return !left || right, nil
		case "iff":
			return left == right, nil
		}
		return false, errors.New("Invalid logical operation")
	}
	for _, x := range points {
		av, e := evaluate(a, x)
		if e != nil {
			return false, e
		}
		bv, e := evaluate(b, x)
		if e != nil {
			return false, e
		}
		if av != bv {
			return false, nil
		}
	}
	return true, nil
}
