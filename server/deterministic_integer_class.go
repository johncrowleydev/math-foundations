package main

import (
	"errors"
	"math/big"
	"regexp"
	"strings"
)

type integerClass struct{ modulus, residue *big.Int }

func classInteger(s string) (*big.Int, error) {
	x, e := parseExact(s)
	if e != nil {
		return nil, e
	}
	r, ok := x.rat()
	if !ok || !r.IsInt() {
		return nil, errors.New("Use an integer")
	}
	return new(big.Int).Set(r.Num()), nil
}
func classAffine(s string, variables []string) ([]*big.Int, *big.Int, error) {
	p, e := parsePolynomial(s, variables)
	if e != nil {
		return nil, nil, e
	}
	zero := strings.Repeat("0,", len(variables))
	for k := range p.d {
		if k != zero {
			return nil, nil, nil
		}
	}
	for _, d := range p.divisors {
		for k := range d {
			if k != zero {
				return nil, nil, nil
			}
		}
	}
	coeff := make([]*big.Int, len(variables))
	for i := range coeff {
		coeff[i] = new(big.Int)
	}
	constant := new(big.Int)
	for k, v := range p.n {
		x, e := v.div(p.d[zero])
		if e != nil {
			return nil, nil, e
		}
		q, ok := x.rat()
		if !ok || !q.IsInt() {
			return nil, nil, nil
		}
		powers := monomialPowers(k)
		index := -1
		for i, power := range powers {
			if power == 0 {
				continue
			}
			if power != 1 || index >= 0 {
				return nil, nil, nil
			}
			index = i
		}
		if index < 0 {
			constant.Set(q.Num())
		} else {
			coeff[index].Set(q.Num())
		}
	}
	return coeff, constant, nil
}
func classCongruence(a, b, m *big.Int) (*integerClass, error) {
	m = new(big.Int).Abs(m)
	if m.Sign() == 0 {
		return nil, errors.New("Use a nonzero integer divisor")
	}
	g := new(big.Int).GCD(nil, nil, a, m)
	if new(big.Int).Mod(b, g).Sign() != 0 {
		return nil, nil
	}
	m.Quo(m, g)
	if m.Cmp(big.NewInt(1)) == 0 {
		return &integerClass{m, new(big.Int)}, nil
	}
	a = new(big.Int).Mod(new(big.Int).Quo(a, g), m)
	b = new(big.Int).Neg(new(big.Int).Quo(b, g))
	inverse := new(big.Int).ModInverse(a, m)
	return &integerClass{m, new(big.Int).Mod(new(big.Int).Mul(inverse, b), m)}, nil
}
func classImage(s, variable string) (*integerClass, error) {
	a, b, e := classAffine(s, []string{variable})
	if e != nil || a == nil {
		return nil, e
	}
	if a[0].Sign() == 0 {
		return nil, nil
	}
	m := new(big.Int).Abs(a[0])
	return &integerClass{m, new(big.Int).Mod(b, m)}, nil
}
func parseIntegerClass(source string) (*integerClass, error) {
	if len(source) > 4096 {
		return nil, errors.New("Use a shorter integer set description")
	}
	s := strings.Trim(strings.TrimSpace(source), "$")
	s = regexp.MustCompile(`\\mathbb\s*(?:\{([ZNQR])\}|([ZNQR]))`).ReplaceAllStringFunc(s, func(raw string) string {
		m := regexp.MustCompile(`\\mathbb\s*(?:\{([ZNQR])\}|([ZNQR]))`).FindStringSubmatch(raw)
		return " " + m[1] + m[2] + " "
	})
	s = strings.NewReplacer(`\left`, "", `\right`, "", `\in`, " in ", "∈", " in ", `\exists`, "exists ", "∃", "exists ", `\mid`, "|", "divides", "|", `\{`, "{", `\}`, "}", `\,`, " ", `\;`, " ", `\quad`, " ", `\qquad`, " ").Replace(s)
	s = strings.TrimSpace(s)
	if !strings.HasPrefix(s, "{") && strings.Contains(s, "Z") {
		return classImage(strings.ReplaceAll(s, "Z", "integerIndex"), "integerIndex")
	}
	if !strings.HasPrefix(s, "{") || !strings.HasSuffix(s, "}") {
		return nil, errors.New("Use set-builder notation, for example {5k : k in Z}")
	}
	s = strings.TrimSpace(s[1 : len(s)-1])
	split := strings.Index(s, ":")
	if split < 0 {
		split = strings.Index(s, "|")
	}
	if split < 0 {
		return nil, errors.New("Separate the set expression and integer condition with a colon")
	}
	left, right := strings.TrimSpace(s[:split]), strings.TrimSpace(s[split+1:])
	domain := regexp.MustCompile(`^([A-Za-z][A-Za-z0-9_]*)\s+in\s+([ZNQR])$`)
	if image := domain.FindStringSubmatch(right); image != nil {
		if image[2] != "Z" {
			return nil, nil
		}
		return classImage(left, image[1])
	}
	decl := domain.FindStringSubmatch(left)
	if decl == nil {
		return nil, errors.New("State the integer domain, such as n in Z")
	}
	if decl[2] != "Z" {
		return nil, nil
	}
	variable := decl[1]
	if exists := regexp.MustCompile(`^exists\s+([A-Za-z][A-Za-z0-9_]*)\s+in\s+([ZNQR])\s*[,.:]\s*(.+)$`).FindStringSubmatch(right); exists != nil {
		if exists[2] != "Z" {
			return nil, nil
		}
		pair := strings.Split(exists[3], "=")
		if len(pair) != 2 {
			return nil, errors.New("Use one equality for the integer witness")
		}
		a, b, e := classAffine("("+pair[0]+")-("+pair[1]+")", []string{variable, exists[1]})
		if e != nil || a == nil {
			return nil, e
		}
		return classCongruence(a[0], b, a[1])
	}
	if pair := strings.Split(right, "|"); len(pair) == 2 {
		m, e := classInteger(pair[0])
		if e != nil {
			return nil, e
		}
		a, b, e := classAffine(pair[1], []string{variable})
		if e != nil || a == nil {
			return nil, e
		}
		return classCongruence(a[0], b, m)
	}
	if pair := regexp.MustCompile(`^(.*?)\s*(?:≡|\\equiv)\s*(.*?)\s*(?:\\pmod\{([^{}]+)\}|\(\s*mod\s+([^()]+)\))$`).FindStringSubmatch(right); pair != nil {
		a, b, e := classAffine("("+pair[1]+")-("+pair[2]+")", []string{variable})
		if e != nil || a == nil {
			return nil, e
		}
		m, e := classInteger(pair[3] + pair[4])
		if e != nil {
			return nil, e
		}
		return classCongruence(a[0], b, m)
	}
	return nil, errors.New("Use an affine integer set builder, divisibility condition, or integer-witness equality")
}
func checkIntegerClass(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p struct{ Modulus, Residue string }
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	actual, e := parseIntegerClass(xs[0])
	if e != nil || actual == nil {
		return false, e
	}
	m, e := classInteger(p.Modulus)
	if e != nil {
		return false, e
	}
	b, e := classInteger(p.Residue)
	if e != nil {
		return false, e
	}
	return actual.modulus.Cmp(m) == 0 && actual.residue.Cmp(new(big.Int).Mod(b, m)) == 0, nil
}
func validateIntegerClass(r AssessmentRequirement) error {
	var p struct{ Modulus, Residue string }
	if jsonParams(r, &p) != nil || len(r.Fields) != 1 {
		return errors.New("Invalid integer congruence class")
	}
	m, e := classInteger(p.Modulus)
	if e != nil {
		return e
	}
	if m.Sign() <= 0 {
		return errors.New("Use a positive modulus")
	}
	_, e = classInteger(p.Residue)
	return e
}
