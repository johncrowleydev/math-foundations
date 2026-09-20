package main

import (
	"errors"
	"strings"
)

func extraLinearKind(kind string) bool {
	return enum(kind, "dependent-list-deletion", "proper-independent", "information-loss", "spectral-example", "vector-pair", "nonnegative-closure", "eigenpairs", "zero-row-not-infinite")
}
func validateExtraLinear(r AssessmentRequirement, p linearParams) error {
	count := 1
	if enum(p.Kind, "dependent-list-deletion", "proper-independent", "information-loss", "vector-pair", "nonnegative-closure") || p.Kind == "eigenpairs" && p.Checks {
		count = 2
	}
	if len(r.Fields) != count {
		return errors.New("Invalid linear property field count")
	}
	switch p.Kind {
	case "spectral-example":
		if !enum(p.Property, "repeated-diagonalizable", "no-real-eigenvalue", "nonorthogonal-eigenbasis", "unit-spectrum-not-identity") {
			return errors.New("Invalid spectral property")
		}
	case "vector-pair":
		if !enum(p.Property, "positive-nonacute", "unequal-cosine-one", "unequal-equal-norm") {
			return errors.New("Invalid vector property")
		}
	case "eigenpairs":
		a, e := matrixStrings(p.A)
		if e != nil {
			return e
		}
		if len(a) != len(a[0]) || len(p.Eigenvalues) == 0 || len(p.Eigenvalues) > len(a) {
			return errors.New("Invalid eigenpair definition")
		}
		seen := []exactNumber{}
		for _, s := range p.Eigenvalues {
			v, e := parseExact(s)
			if e != nil {
				return e
			}
			for _, other := range seen {
				if v.equal(other) {
					return errors.New("Eigenvalues must be distinct")
				}
			}
			seen = append(seen, v)
		}
	}
	return nil
}
func augmentMatrix(a exactMatrix, b []string) (exactMatrix, error) {
	out := exactMatrix{}
	if len(a) != len(b) {
		return nil, errors.New("Invalid right-hand side dimension")
	}
	for i, row := range a {
		x, e := parseExact(b[i])
		if e != nil {
			return nil, e
		}
		out = append(out, append(append([]exactNumber{}, row...), x))
	}
	return out, nil
}
func linearIndices(value any) ([]int, error) {
	texts := []string{}
	switch v := value.(type) {
	case string:
		if enum(strings.TrimSpace(v), "{}", "[]", "\\varnothing", "\\emptyset", "∅") {
			return []int{}, nil
		}
		xs, e := splitMathList(v)
		if e != nil {
			return nil, e
		}
		texts = xs
	case []string:
		texts = v
	case []any:
		for _, item := range v {
			s, ok := item.(string)
			if !ok {
				return nil, errors.New("Use variable indices")
			}
			texts = append(texts, s)
		}
	default:
		return nil, errors.New("Use a list of variable indices")
	}
	out := []int{}
	for _, s := range texts {
		x, e := parseExact(s)
		if e != nil {
			return nil, e
		}
		r, ok := x.rat()
		if !ok || !r.IsInt() || !r.Num().IsInt64() {
			return nil, errors.New("Variable indices must be integers")
		}
		n := r.Num().Int64()
		if n < -1000 || n > 1000 {
			return nil, errors.New("Variable index is too large")
		}
		out = append(out, int(n))
	}
	return out, nil
}
func freeCoordinatesValid(directions exactMatrix, dimension int, value any) (bool, error) {
	indices, e := linearIndices(value)
	if e != nil {
		return false, e
	}
	if len(indices) != len(directions) {
		return false, nil
	}
	seen := map[int]bool{}
	for _, n := range indices {
		if n < 1 || n > dimension || seen[n] {
			return false, nil
		}
		seen[n] = true
	}
	projected := exactMatrix{}
	for _, row := range directions {
		xs := []exactNumber{}
		for _, n := range indices {
			xs = append(xs, row[n-1])
		}
		projected = append(projected, xs)
	}
	rank, e := matrixRank(projected)
	return rank == len(indices), e
}
func exactDot(a, b []exactNumber) (exactNumber, error) {
	if len(a) != len(b) {
		return exactNumber{}, errors.New("Vector dimensions differ")
	}
	sum := exactInt(0)
	for i, x := range a {
		sum = sum.add(x.mul(b[i]))
		if e := sum.valid(); e != nil {
			return exactNumber{}, e
		}
	}
	return sum, nil
}
func checkExtraLinear(r AssessmentRequirement, response StructuredResponse, p linearParams) (bool, error) {
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	if p.Kind == "vector-pair" || p.Kind == "nonnegative-closure" {
		u, e := vectorAnswer(xs[0])
		if e != nil {
			return false, e
		}
		if p.Kind == "nonnegative-closure" {
			c, e := parseExact(xs[1])
			if e != nil {
				return false, e
			}
			sign, e := c.sign()
			if e != nil {
				return false, e
			}
			if sign >= 0 {
				return false, nil
			}
			positive := false
			for _, x := range u {
				s, e := x.sign()
				if e != nil {
					return false, e
				}
				if s < 0 {
					return false, nil
				}
				positive = positive || s > 0
			}
			return positive, nil
		}
		v, e := vectorAnswer(xs[1])
		if e != nil {
			return false, e
		}
		if len(u) != len(v) {
			return false, nil
		}
		same := true
		for i, x := range u {
			same = same && x.equal(v[i])
		}
		uu, e := exactDot(u, u)
		if e != nil {
			return false, e
		}
		vv, e := exactDot(v, v)
		if e != nil {
			return false, e
		}
		if p.Property == "unequal-equal-norm" {
			return !same && uu.equal(vv), nil
		}
		uv, e := exactDot(u, v)
		if e != nil {
			return false, e
		}
		sign, e := uv.sign()
		if e != nil {
			return false, e
		}
		return sign > 0 && uv.mul(uv).equal(uu.mul(vv)) && (p.Property != "unequal-cosine-one" || !same), nil
	}
	a, e := matrixAnswer(xs[0], false)
	if e != nil {
		return false, e
	}
	switch p.Kind {
	case "dependent-list-deletion":
		index, e := parseExact(xs[1])
		if e != nil {
			return false, e
		}
		n, ok := index.rat()
		if !ok || !n.IsInt() || !n.Num().IsInt64() {
			return false, nil
		}
		i := int(n.Num().Int64())
		if i < 1 || i > len(a) {
			return false, nil
		}
		rank, e := matrixRank(a)
		if e != nil {
			return false, e
		}
		remaining := append(append(exactMatrix{}, a[:i-1]...), a[i:]...)
		remainingRank, e := matrixRank(remaining)
		return rank < len(a) && remainingRank < rank, e
	case "proper-independent":
		dimension, e := parseExact(xs[1])
		if e != nil {
			return false, e
		}
		rank, e := matrixRank(a)
		return rank == len(a) && rank > 0 && rank < len(a[0]) && dimension.equal(exactInt(int64(len(a[0])))), e
	case "information-loss":
		basis, e := matrixAnswer(xs[1], true)
		if e != nil {
			return false, e
		}
		rank, e := matrixRank(a)
		if e != nil {
			return false, e
		}
		if rank >= len(a[0]) {
			return false, nil
		}
		return basisValid(a, basis, "null", false)
	case "spectral-example":
		if !matrixShape(a, 2, 2) {
			return false, nil
		}
		trace := a[0][0].add(a[1][1])
		det := determinant2(a)
		disc := trace.mul(trace).add(exactInt(-4).mul(det))
		sign, e := disc.sign()
		if e != nil {
			return false, e
		}
		switch p.Property {
		case "repeated-diagonalizable":
			return scalarIdentity(a, nil), nil
		case "no-real-eigenvalue":
			return sign < 0, nil
		case "nonorthogonal-eigenbasis":
			return scalarIdentity(a, nil) || (sign > 0 && !matrixEqual(a, matrixTranspose(a))), nil
		case "unit-spectrum-not-identity":
			one := exactInt(1)
			return trace.equal(exactInt(2)) && det.equal(one) && !scalarIdentity(a, &one), nil
		}
	case "zero-row-not-infinite":
		if len(a[0]) < 2 {
			return false, nil
		}
		zeroRow := false
		coeff := exactMatrix{}
		for _, row := range a {
			zero := true
			for _, v := range row {
				zero = zero && len(v.n) == 0
			}
			zeroRow = zeroRow || zero
			coeff = append(coeff, row[:len(row)-1])
		}
		if !zeroRow {
			return false, nil
		}
		rank, e := matrixRank(coeff)
		if e != nil {
			return false, e
		}
		aug, e := matrixRank(a)
		return aug > rank || rank == len(a[0])-1, e
	case "eigenpairs":
		original, e := matrixStrings(p.A)
		if e != nil {
			return false, e
		}
		n := len(original)
		if !matrixShape(a, len(p.Eigenvalues), n+1) {
			return false, nil
		}
		expected := []exactNumber{}
		for _, s := range p.Eigenvalues {
			v, e := parseExact(s)
			if e != nil {
				return false, e
			}
			expected = append(expected, v)
		}
		used := make([]bool, len(expected))
		vectors := exactMatrix{}
		for _, row := range a {
			found := -1
			for j, v := range expected {
				if !used[j] && row[0].equal(v) {
					found = j
					break
				}
			}
			if found < 0 {
				return false, nil
			}
			used[found] = true
			v := row[1:]
			if !matrixNonzero(exactMatrix{v}) {
				return false, nil
			}
			av, e := vectorMultiply(original, v)
			if e != nil {
				return false, e
			}
			for j, x := range v {
				if !av[j].equal(row[0].mul(x)) {
					return false, nil
				}
			}
			vectors = append(vectors, v)
		}
		if p.Orthogonal {
			for i := range vectors {
				for j := 0; j < i; j++ {
					dot, e := exactDot(vectors[i], vectors[j])
					if e != nil {
						return false, e
					}
					if len(dot.n) > 0 {
						return false, nil
					}
				}
			}
		}
		if p.Checks {
			checks, e := matrixAnswer(xs[1], false)
			if e != nil {
				return false, e
			}
			if !matrixShape(checks, len(a), n) || matrixNonzero(checks) {
				return false, nil
			}
		}
		return true, nil
	}
	return false, errors.New("Unknown linear property")
}
