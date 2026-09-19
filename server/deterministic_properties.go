package main

import (
	"errors"
	"math/big"
	"sort"
	"strconv"
	"strings"
)

func radicalSign(a radical) (int, error) {
	if len(a) == 0 {
		return 0, nil
	}
	for bits := uint(8); bits <= 8192; bits *= 2 {
		scale := new(big.Int).Lsh(big.NewInt(1), bits)
		lo, hi := new(big.Rat), new(big.Rat)
		for key, c := range a {
			d, _ := new(big.Int).SetString(key, 10)
			scaled := new(big.Int).Mul(d, new(big.Int).Mul(scale, scale))
			k := new(big.Int).Sqrt(scaled)
			u := new(big.Int).Set(k)
			if new(big.Int).Mul(k, k).Cmp(scaled) != 0 {
				u.Add(u, big.NewInt(1))
			}
			low, high := new(big.Rat).SetFrac(k, scale), new(big.Rat).SetFrac(u, scale)
			if c.Sign() < 0 {
				low, high = high, low
			}
			lo.Add(lo, new(big.Rat).Mul(c, low))
			hi.Add(hi, new(big.Rat).Mul(c, high))
		}
		if lo.Sign() > 0 {
			return 1, nil
		}
		if hi.Sign() < 0 {
			return -1, nil
		}
	}
	return 0, errors.New("Radical comparison exceeds the supported exact bounds")
}
func (x exactNumber) sign() (int, error) {
	a, e := radicalSign(x.n)
	if e != nil {
		return 0, e
	}
	b, e := radicalSign(x.d)
	return a * b, e
}
func monomialPowers(k string) []int {
	xs := strings.Split(k, ",")
	out := make([]int, len(xs)-1)
	for i := range out {
		out[i], _ = strconv.Atoi(xs[i])
	}
	return out
}
func polyLeading(p exactPoly) (string, exactNumber) {
	keys := polynomialKeys(p)
	sort.Slice(keys, func(i, j int) bool {
		a, b := monomialPowers(keys[i]), monomialPowers(keys[j])
		da, db := 0, 0
		for _, x := range a {
			da += x
		}
		for _, x := range b {
			db += x
		}
		if da != db {
			return da > db
		}
		for k := range a {
			if a[k] != b[k] {
				return a[k] > b[k]
			}
		}
		return false
	})
	if len(keys) == 0 {
		return "", exactNumber{}
	}
	return keys[0], p[keys[0]]
}
func polyDivides(divisor, dividend exactPoly) (bool, error) {
	if len(divisor) == 0 {
		return false, nil
	}
	dk, dc := polyLeading(divisor)
	dp := monomialPowers(dk)
	remain := dividend
	for step := 0; len(remain) > 0; step++ {
		if step > 4096 {
			return false, errors.New("Polynomial normalization exceeds the supported bound")
		}
		rk, rc := polyLeading(remain)
		rp := monomialPowers(rk)
		qs := make([]string, len(rp))
		for i := range rp {
			if rp[i] < dp[i] {
				return false, nil
			}
			qs[i] = strconv.Itoa(rp[i] - dp[i])
		}
		qc, e := rc.div(dc)
		if e != nil {
			return false, e
		}
		q := exactPoly{strings.Join(qs, ",") + ",": qc}
		remain = polyAdd(remain, polyNeg(polyMul(divisor, q)))
	}
	return true, nil
}
func samePolynomialDomain(a, b rationalPoly, domain []rationalPoly) (bool, error) {
	clean := func(ps []exactPoly) []exactPoly {
		out := []exactPoly{}
		for _, p := range ps {
			nonconstant := false
			for k := range p {
				for _, v := range monomialPowers(k) {
					nonconstant = nonconstant || v != 0
				}
			}
			if nonconstant {
				out = append(out, p)
			}
		}
		return out
	}
	left, right := append([]exactPoly{}, a.divisors...), append([]exactPoly{}, b.divisors...)
	for _, d := range domain {
		left = append(left, d.n)
		right = append(right, d.n)
	}
	left, right = clean(left), clean(right)
	covers := func(from, to []exactPoly) (bool, error) {
		for _, f := range from {
			covered := false
			for _, g := range to {
				ok, e := polyDivides(f, g)
				if e != nil {
					return false, e
				}
				if ok {
					covered = true
					break
				}
			}
			if covered {
				continue
			}
			if len(to) == 0 {
				return false, nil
			}
			product := polyConst(exactInt(1), len(a.variables))
			for _, g := range to {
				product = polyMul(product, g)
			}
			degree := 0
			for k := range f {
				n := 0
				for _, v := range monomialPowers(k) {
					n += v
				}
				if n > degree {
					degree = n
				}
			}
			power := polyConst(exactInt(1), len(a.variables))
			for n := 1; n <= degree; n++ {
				power = polyMul(power, product)
				check := rationalPoly{n: power, d: polyConst(exactInt(1), len(a.variables)), variables: a.variables}
				if e := check.valid(); e != nil {
					return false, e
				}
				ok, e := polyDivides(f, power)
				if e != nil {
					return false, e
				}
				if ok {
					covered = true
					break
				}
			}
			if !covered {
				return false, nil
			}
		}
		return true, nil
	}
	ok, e := covers(left, right)
	if e != nil || !ok {
		return ok, e
	}
	return covers(right, left)
}

type witnessParams struct {
	Variables []struct {
		Name       string `json:"name"`
		Field      string `json:"field"`
		Integer    bool   `json:"integer"`
		NonInteger bool   `json:"nonInteger"`
	} `json:"variables"`
	Conditions []struct {
		Left  string `json:"left"`
		Op    string `json:"op"`
		Right string `json:"right"`
	} `json:"conditions"`
}

func checkWitness(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p witnessParams
	if e := jsonParams(r, &p); e != nil {
		return false, e
	}
	values := map[string]exactNumber{}
	for _, v := range p.Variables {
		s, ok := response[v.Field].(string)
		if !ok {
			return false, errors.New("Enter a numerical witness")
		}
		x, e := parseExact(s)
		if e != nil {
			return false, e
		}
		if v.Integer {
			q, ok := x.rat()
			if !ok || !q.IsInt() {
				return false, nil
			}
		}
		if v.NonInteger {
			q, ok := x.rat()
			if ok && q.IsInt() {
				return false, nil
			}
		}
		values[v.Name] = x
	}
	vars := []string{}
	for k := range values {
		vars = append(vars, k)
	}
	sort.Strings(vars)
	evaluate := func(s string) (exactNumber, error) {
		p, e := parsePolynomial(s, vars)
		if e != nil {
			return exactNumber{}, e
		}
		evalPoly := func(poly exactPoly) (exactNumber, error) {
			out := exactInt(0)
			for k, c := range poly {
				x := c
				for i, n := range monomialPowers(k) {
					v, e := values[vars[i]].pow(n)
					if e != nil {
						return exactNumber{}, e
					}
					x = x.mul(v)
				}
				out = out.add(x)
			}
			return out, out.valid()
		}
		n, e := evalPoly(p.n)
		if e != nil {
			return exactNumber{}, e
		}
		d, e := evalPoly(p.d)
		if e != nil {
			return exactNumber{}, e
		}
		return n.div(d)
	}
	for _, c := range p.Conditions {
		a, e := evaluate(c.Left)
		if e != nil {
			return false, e
		}
		b, e := evaluate(c.Right)
		if e != nil {
			return false, e
		}
		if enum(c.Op, "divides", "not-divides") {
			ar, aok := a.rat()
			br, bok := b.rat()
			if !aok || !bok || !ar.IsInt() || !br.IsInt() {
				return false, nil
			}
			divides := false
			if ar.Sign() == 0 {
				divides = br.Sign() == 0
			} else {
				divides = new(big.Int).Rem(br.Num(), ar.Num()).Sign() == 0
			}
			if (c.Op == "divides") != divides {
				return false, nil
			}
			continue
		}
		d := a.add(b.neg())
		if c.Op == "=" {
			if len(d.n) != 0 {
				return false, nil
			}
			continue
		}
		if c.Op == "!=" {
			if len(d.n) == 0 {
				return false, nil
			}
			continue
		}
		sign, e := d.sign()
		if e != nil {
			return false, e
		}
		ok := false
		switch c.Op {
		case "<":
			ok = sign < 0
		case "<=":
			ok = sign <= 0
		case ">":
			ok = sign > 0
		case ">=":
			ok = sign >= 0
		default:
			return false, errors.New("Unknown witness condition")
		}
		if !ok {
			return false, nil
		}
	}
	return true, nil
}
func checkInterval(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p struct {
		Lower       string `json:"lower"`
		Upper       string `json:"upper"`
		LeftClosed  bool   `json:"leftClosed"`
		RightClosed bool   `json:"rightClosed"`
	}
	jsonParams(r, &p)
	endpoint := func(got any, want string) (bool, error) {
		s, ok := got.(string)
		if !ok {
			return false, errors.New("Enter an interval endpoint")
		}
		normalize := func(s string) string {
			return strings.TrimPrefix(strings.NewReplacer("\\infty", "infinity", "∞", "infinity").Replace(strings.TrimSpace(s)), "+")
		}
		if strings.Contains(s+want, "infinity") || strings.Contains(s+want, "infty") || strings.Contains(s+want, "∞") {
			return normalize(s) == normalize(want), nil
		}
		a, e := parseExact(s)
		if e != nil {
			return false, e
		}
		b, e := parseExact(want)
		return e == nil && a.equal(b), e
	}
	lower, e := endpoint(response[r.Fields[0]], p.Lower)
	if e != nil {
		return false, e
	}
	upper, e := endpoint(response[r.Fields[1]], p.Upper)
	if e != nil {
		return false, e
	}
	return lower && upper && response[r.Fields[2]] == p.LeftClosed && response[r.Fields[3]] == p.RightClosed, nil
}
