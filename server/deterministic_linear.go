package main

import (
	"errors"
	"strings"
)

type exactMatrix [][]exactNumber
type linearParams struct {
	Kind            string     `json:"kind"`
	A               [][]string `json:"a"`
	B               []string   `json:"b"`
	Space           string     `json:"space"`
	OriginalColumns bool       `json:"originalColumns"`
	Lambda          string     `json:"lambda"`
	Form            string     `json:"form"`
	Order           string     `json:"order"`
	Rank            int        `json:"rank"`
	ErrorSquared    string     `json:"errorSquared"`
}

func matrixStrings(rows [][]string) (exactMatrix, error) {
	if len(rows) == 0 || len(rows) > 16 || len(rows[0]) == 0 || len(rows[0]) > 16 {
		return nil, errors.New("Use a matrix with between 1 and 16 rows and columns")
	}
	m := exactMatrix{}
	for _, row := range rows {
		if len(row) != len(rows[0]) {
			return nil, errors.New("Matrix rows must have the same length")
		}
		xs := []exactNumber{}
		for _, s := range row {
			x, e := parseExact(s)
			if e != nil {
				return nil, e
			}
			xs = append(xs, x)
		}
		m = append(m, xs)
	}
	return m, nil
}
func matrixAnswer(s string, empty bool) (exactMatrix, error) {
	if empty && enum(strings.TrimSpace(s), "{}", "[]", "\\varnothing", "\\emptyset", "∅") {
		return exactMatrix{}, nil
	}
	rows, e := parseMatrix(s)
	if e != nil {
		return nil, e
	}
	return matrixStrings(rows)
}
func vectorAnswer(s string) ([]exactNumber, error) {
	xs, e := splitMathList(s)
	if e != nil {
		return nil, e
	}
	if len(xs) > 16 {
		return nil, errors.New("Use at most 16 vector entries")
	}
	out := []exactNumber{}
	for _, s := range xs {
		x, e := parseExact(s)
		if e != nil {
			return nil, e
		}
		out = append(out, x)
	}
	return out, nil
}
func matrixShape(a exactMatrix, rows, cols int) bool {
	if len(a) != rows {
		return false
	}
	for _, row := range a {
		if len(row) != cols {
			return false
		}
	}
	return true
}
func matrixRank(a exactMatrix) (int, error) {
	if len(a) == 0 {
		return 0, nil
	}
	work := exactMatrix{}
	for _, r := range a {
		work = append(work, append([]exactNumber{}, r...))
	}
	rows, cols := len(work), len(work[0])
	rank := 0
	for col := 0; col < cols && rank < rows; col++ {
		pivot := rank
		for pivot < rows && len(work[pivot][col].n) == 0 {
			pivot++
		}
		if pivot == rows {
			continue
		}
		work[rank], work[pivot] = work[pivot], work[rank]
		for row := rank + 1; row < rows; row++ {
			if len(work[row][col].n) == 0 {
				continue
			}
			factor, e := work[row][col].div(work[rank][col])
			if e != nil {
				return 0, e
			}
			for c := col; c < cols; c++ {
				work[row][c] = work[row][c].add(factor.mul(work[rank][c]).neg())
				if e = work[row][c].valid(); e != nil {
					return 0, e
				}
			}
		}
		rank++
	}
	return rank, nil
}
func matrixTranspose(a exactMatrix) exactMatrix {
	if len(a) == 0 {
		return exactMatrix{}
	}
	out := make(exactMatrix, len(a[0]))
	for i := range out {
		out[i] = make([]exactNumber, len(a))
		for j := range a {
			out[i][j] = a[j][i]
		}
	}
	return out
}
func matrixMultiply(a, b exactMatrix) (exactMatrix, error) {
	if len(a) == 0 || len(b) == 0 || len(a[0]) != len(b) {
		return nil, errors.New("Matrix dimensions do not match")
	}
	out := make(exactMatrix, len(a))
	for i := range a {
		out[i] = make([]exactNumber, len(b[0]))
		for j := range b[0] {
			x := exactInt(0)
			for k := range b {
				x = x.add(a[i][k].mul(b[k][j]))
				if e := x.valid(); e != nil {
					return nil, e
				}
			}
			out[i][j] = x
		}
	}
	return out, nil
}
func matrixEqual(a, b exactMatrix) bool {
	if len(a) != len(b) {
		return false
	}
	for i, row := range a {
		if len(row) != len(b[i]) {
			return false
		}
		for j, x := range row {
			if !x.equal(b[i][j]) {
				return false
			}
		}
	}
	return true
}
func vectorMultiply(a exactMatrix, x []exactNumber) ([]exactNumber, error) {
	if len(a) == 0 || len(a[0]) != len(x) {
		return nil, errors.New("Vector dimension does not match matrix")
	}
	out := []exactNumber{}
	for _, row := range a {
		sum := exactInt(0)
		for j, c := range row {
			sum = sum.add(c.mul(x[j]))
			if e := sum.valid(); e != nil {
				return nil, e
			}
		}
		out = append(out, sum)
	}
	return out, nil
}
func basisValid(a, vectors exactMatrix, space string, original bool) (bool, error) {
	rank, e := matrixRank(a)
	if e != nil {
		return false, e
	}
	dimension, want := len(a), rank
	if space == "row" {
		dimension = len(a[0])
	}
	if space == "null" {
		dimension = len(a[0])
		want = len(a[0]) - rank
	}
	if len(vectors) != want {
		return false, nil
	}
	for _, v := range vectors {
		if len(v) != dimension {
			return false, nil
		}
	}
	actual, e := matrixRank(vectors)
	if e != nil {
		return false, e
	}
	if actual != want {
		return false, nil
	}
	if space == "null" {
		for _, v := range vectors {
			result, e := vectorMultiply(a, v)
			if e != nil {
				return false, e
			}
			for _, x := range result {
				if len(x.n) != 0 {
					return false, nil
				}
			}
		}
		return true, nil
	}
	rows := a
	if space == "column" {
		rows = matrixTranspose(a)
	}
	if original {
		for _, v := range vectors {
			found := false
			for _, r := range rows {
				same := true
				for j, x := range v {
					same = same && x.equal(r[j])
				}
				found = found || same
			}
			if !found {
				return false, nil
			}
		}
	}
	combined := append(append(exactMatrix{}, rows...), vectors...)
	r, e := matrixRank(combined)
	return r == rank, e
}
func orthonormalColumns(a exactMatrix) (bool, error) {
	if len(a) == 0 {
		return true, nil
	}
	cols := len(a[0])
	for i := 0; i < cols; i++ {
		for j := 0; j < cols; j++ {
			dot := exactInt(0)
			for _, row := range a {
				dot = dot.add(row[i].mul(row[j]))
				if e := dot.valid(); e != nil {
					return false, e
				}
			}
			want := exactInt(0)
			if i == j {
				want = exactInt(1)
			}
			if !dot.equal(want) {
				return false, nil
			}
		}
	}
	return true, nil
}
func validateLinear(r AssessmentRequirement) error {
	var p linearParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	a, e := matrixStrings(p.A)
	if e != nil {
		return e
	}
	switch p.Kind {
	case "basis":
		if len(r.Fields) != 1 || !enum(p.Space, "column", "null", "row") {
			return errors.New("Invalid basis definition")
		}
	case "affine-family":
		if len(r.Fields) != 2 || len(p.B) != len(a) {
			return errors.New("Invalid affine family definition")
		}
		for _, s := range p.B {
			if _, e := parseExact(s); e != nil {
				return e
			}
		}
	case "eigenvector":
		if len(r.Fields) != 1 || len(a) != len(a[0]) {
			return errors.New("Invalid eigenvector definition")
		}
		if _, e := parseExact(p.Lambda); e != nil {
			return e
		}
	case "svd":
		if len(r.Fields) != 3 || !enum(p.Form, "", "full", "thin", "compact") || !enum(p.Order, "", "descending") {
			return errors.New("Invalid SVD definition")
		}
	case "best-rank":
		if len(r.Fields) != 1 || p.Rank < 0 || p.Rank > min(len(a), len(a[0])) {
			return errors.New("Invalid approximation rank")
		}
		x, e := parseExact(p.ErrorSquared)
		if e != nil {
			return e
		}
		sign, e := x.sign()
		if e != nil {
			return e
		}
		if sign < 0 {
			return errors.New("Squared error cannot be negative")
		}
	default:
		return errors.New("Unsupported linear validator")
	}
	return nil
}
func checkLinear(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p linearParams
	jsonParams(r, &p)
	a, e := matrixStrings(p.A)
	if e != nil {
		return false, e
	}
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	switch p.Kind {
	case "basis":
		v, e := matrixAnswer(xs[0], true)
		if e != nil {
			return false, e
		}
		return basisValid(a, v, p.Space, p.OriginalColumns)
	case "affine-family":
		v, e := vectorAnswer(xs[0])
		if e != nil {
			return false, e
		}
		directions, e := matrixAnswer(xs[1], true)
		if e != nil {
			return false, e
		}
		if len(v) != len(a[0]) {
			return false, nil
		}
		actual, e := vectorMultiply(a, v)
		if e != nil {
			return false, e
		}
		for i, s := range p.B {
			x, e := parseExact(s)
			if e != nil {
				return false, e
			}
			if !actual[i].equal(x) {
				return false, nil
			}
		}
		return basisValid(a, directions, "null", false)
	case "eigenvector":
		v, e := vectorAnswer(xs[0])
		if e != nil {
			return false, e
		}
		if len(v) != len(a) {
			return false, nil
		}
		nonzero := false
		for _, x := range v {
			nonzero = nonzero || len(x.n) > 0
		}
		if !nonzero {
			return false, nil
		}
		lambda, e := parseExact(p.Lambda)
		if e != nil {
			return false, e
		}
		actual, e := vectorMultiply(a, v)
		if e != nil {
			return false, e
		}
		for i, x := range v {
			if !actual[i].equal(lambda.mul(x)) {
				return false, nil
			}
		}
		return true, nil
	case "svd":
		u, e := matrixAnswer(xs[0], true)
		if e != nil {
			return false, e
		}
		sigma, e := matrixAnswer(xs[1], true)
		if e != nil {
			return false, e
		}
		v, e := matrixAnswer(xs[2], true)
		if e != nil {
			return false, e
		}
		m, n := len(a), len(a[0])
		k := min(m, n)
		if p.Form == "compact" {
			k, e = matrixRank(a)
			if e != nil {
				return false, e
			}
			if k == 0 {
				return len(u) == 0 && len(v) == 0 && len(sigma) == 0, nil
			}
		}
		uc, vc := m, n
		if p.Form == "thin" || p.Form == "compact" {
			uc = k
			vc = k
		}
		if !matrixShape(u, m, uc) || !matrixShape(v, n, vc) || !matrixShape(sigma, uc, vc) {
			return false, nil
		}
		for i, row := range sigma {
			for j, x := range row {
				if i != j {
					if len(x.n) != 0 {
						return false, nil
					}
					continue
				}
				sign, e := x.sign()
				if e != nil {
					return false, e
				}
				if sign < 0 {
					return false, nil
				}
				if p.Order == "descending" && i > 0 {
					diff, e := sigma[i-1][i-1].add(x.neg()).sign()
					if e != nil {
						return false, e
					}
					if diff < 0 {
						return false, nil
					}
				}
			}
		}
		ok, e := orthonormalColumns(u)
		if e != nil || !ok {
			return ok, e
		}
		ok, e = orthonormalColumns(v)
		if e != nil || !ok {
			return ok, e
		}
		us, e := matrixMultiply(u, sigma)
		if e != nil {
			return false, e
		}
		result, e := matrixMultiply(us, matrixTranspose(v))
		if e != nil {
			return false, e
		}
		return matrixEqual(result, a), nil
	case "best-rank":
		b, e := matrixAnswer(xs[0], false)
		if e != nil {
			return false, e
		}
		if !matrixShape(b, len(a), len(a[0])) {
			return false, nil
		}
		rank, e := matrixRank(b)
		if e != nil {
			return false, e
		}
		if rank > p.Rank {
			return false, nil
		}
		errorSquared := exactInt(0)
		for i, row := range a {
			for j, x := range row {
				d := x.add(b[i][j].neg())
				errorSquared = errorSquared.add(d.mul(d))
				if e = errorSquared.valid(); e != nil {
					return false, e
				}
			}
		}
		expected, e := parseExact(p.ErrorSquared)
		if e != nil {
			return false, e
		}
		return errorSquared.equal(expected), nil
	}
	return false, errors.New("Unsupported linear validator")
}
