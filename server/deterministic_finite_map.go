package main

import (
	"errors"
	"regexp"
)

type finiteMapSpec struct {
	Name     string            `json:"name"`
	Domain   string            `json:"domain"`
	Codomain string            `json:"codomain"`
	Field    string            `json:"field"`
	Fields   map[string]string `json:"fields"`
}
type finiteMapSubsets struct {
	S     string `json:"s"`
	W     string `json:"w"`
	Left  string `json:"left"`
	Right string `json:"right"`
}
type finiteMapParams struct {
	Kind    string              `json:"kind"`
	Domains map[string][]string `json:"domains"`
	Maps    []finiteMapSpec     `json:"maps"`
	Subsets *finiteMapSubsets   `json:"subsets"`
}

func finiteMapAtoms(p finiteMapParams) []string {
	out := []string{}
	re := regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]*$`)
	for _, xs := range p.Domains {
		for _, s := range xs {
			if re.MatchString(s) && !contains(out, s) {
				out = append(out, s)
			}
		}
	}
	return out
}
func finiteMapDomains(p finiteMapParams, atoms []string) (map[string][]*setNode, error) {
	out := map[string][]*setNode{}
	for name, xs := range p.Domains {
		nodes := []*setNode{}
		for _, s := range xs {
			x, e := parseSetNode(s, atoms, 0)
			if e != nil {
				return nil, e
			}
			nodes = append(nodes, x)
		}
		out[name] = nodes
	}
	return out, nil
}
func validateFiniteMap(r AssessmentRequirement) error {
	var p finiteMapParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if !enum(p.Kind, "unique-fiber-noninjective", "injective-composite-noninjective-second", "bijective-composite-neither", "image-intersection-counterexample") || p.Domains == nil || len(p.Maps) < 1 || len(p.Maps) > 2 {
		return errors.New("Invalid finite function definition")
	}
	for _, xs := range p.Domains {
		if len(xs) < 1 || len(xs) > 16 {
			return errors.New("Use explicit finite domains of at most16 members")
		}
	}
	domains, e := finiteMapDomains(p, finiteMapAtoms(p))
	if e != nil {
		return e
	}
	for _, xs := range domains {
		for i, x := range xs {
			for j := 0; j < i; j++ {
				if setNodeEqual(x, xs[j]) {
					return errors.New("Domain members must be distinct")
				}
			}
		}
	}
	fields := []string{}
	names := map[string]bool{}
	var f, g *finiteMapSpec
	for i, m := range p.Maps {
		if m.Name == "" || names[m.Name] || len(domains[m.Domain]) == 0 || len(domains[m.Codomain]) == 0 || (m.Field != "") == (m.Fields != nil) {
			return errors.New("Invalid finite function fields")
		}
		names[m.Name] = true
		if m.Name == "f" {
			f = &p.Maps[i]
		}
		if m.Name == "g" {
			g = &p.Maps[i]
		}
		if m.Field != "" {
			fields = append(fields, m.Field)
		} else {
			if len(m.Fields) != len(p.Domains[m.Domain]) {
				return errors.New("Give one output field for each domain member")
			}
			for _, x := range p.Domains[m.Domain] {
				field, ok := m.Fields[x]
				if !ok || field == "" {
					return errors.New("Missing function output field")
				}
				fields = append(fields, field)
			}
		}
	}
	if f == nil {
		return errors.New("Name the first function f")
	}
	if enum(p.Kind, "injective-composite-noninjective-second", "bijective-composite-neither") {
		if g == nil || len(p.Maps) != 2 || f.Codomain != g.Domain {
			return errors.New("Use composable functions f and g")
		}
	} else if len(p.Maps) != 1 {
		return errors.New("Use one function f")
	}
	if p.Kind == "image-intersection-counterexample" {
		if p.Subsets == nil {
			return errors.New("Include both subsets and image results")
		}
		fields = append(fields, p.Subsets.S, p.Subsets.W, p.Subsets.Left, p.Subsets.Right)
	}
	seen := map[string]bool{}
	for _, field := range fields {
		if field == "" || seen[field] || !contains(r.Fields, field) {
			return errors.New("Finite function fields must match requested answers")
		}
		seen[field] = true
	}
	if len(fields) != len(r.Fields) {
		return errors.New("Finite function fields must match requested answers")
	}
	return nil
}
func nodeIndex(xs []*setNode, x *setNode) int {
	for i, v := range xs {
		if setNodeEqual(v, x) {
			return i
		}
	}
	return -1
}
func distinctIndices(xs []int) []int {
	out := []int{}
	for _, i := range xs {
		found := false
		for _, v := range out {
			found = found || i == v
		}
		if !found {
			out = append(out, i)
		}
	}
	return out
}
func containsIndex(xs []int, i int) bool {
	for _, v := range xs {
		if v == i {
			return true
		}
	}
	return false
}
func checkFiniteMap(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p finiteMapParams
	jsonParams(r, &p)
	atoms := finiteMapAtoms(p)
	domains, e := finiteMapDomains(p, atoms)
	if e != nil {
		return false, e
	}
	read := func(field string) (string, error) {
		s, ok := response[field].(string)
		if !ok {
			return "", errors.New("Enter the requested function or set")
		}
		return s, nil
	}
	maps := map[string][]int{}
	valid := true
	var fSpec, gSpec finiteMapSpec
	for _, m := range p.Maps {
		if m.Name == "f" {
			fSpec = m
		}
		if m.Name == "g" {
			gSpec = m
		}
		from, to := domains[m.Domain], domains[m.Codomain]
		values := make([]int, len(from))
		for i := range values {
			values[i] = -1
		}
		if m.Field != "" {
			s, e := read(m.Field)
			if e != nil {
				return false, e
			}
			pairs, e := finiteSet(s, atoms)
			if e != nil {
				return false, e
			}
			for _, pair := range pairs.members {
				if pair.kind != "tuple" || len(pair.members) != 2 {
					valid = false
					continue
				}
				i, j := nodeIndex(from, pair.members[0]), nodeIndex(to, pair.members[1])
				if i < 0 || j < 0 || values[i] >= 0 {
					valid = false
					continue
				}
				values[i] = j
			}
		} else {
			for i, key := range p.Domains[m.Domain] {
				s, e := read(m.Fields[key])
				if e != nil {
					return false, e
				}
				v, e := parseSetNode(s, atoms, 0)
				if e != nil {
					return false, e
				}
				values[i] = nodeIndex(to, v)
			}
		}
		for _, v := range values {
			valid = valid && v >= 0
		}
		maps[m.Name] = values
	}
	subsets := map[string]*setNode{}
	if p.Subsets != nil {
		for name, field := range map[string]string{"s": p.Subsets.S, "w": p.Subsets.W, "left": p.Subsets.Left, "right": p.Subsets.Right} {
			s, e := read(field)
			if e != nil {
				return false, e
			}
			v, e := finiteSet(s, atoms)
			if e != nil {
				return false, e
			}
			subsets[name] = v
		}
	}
	if !valid {
		return false, nil
	}
	f := maps["f"]
	if p.Kind == "unique-fiber-noninjective" {
		counts := make([]int, len(domains[fSpec.Codomain]))
		for _, j := range f {
			counts[j]++
		}
		unique, collision := false, false
		for _, n := range counts {
			unique = unique || n == 1
			collision = collision || n > 1
		}
		return unique && collision, nil
	}
	if enum(p.Kind, "injective-composite-noninjective-second", "bijective-composite-neither") {
		g := maps["g"]
		composition := []int{}
		for _, i := range f {
			composition = append(composition, g[i])
		}
		correct := len(distinctIndices(composition)) == len(composition) && len(distinctIndices(g)) < len(g)
		if p.Kind == "bijective-composite-neither" {
			correct = correct && len(distinctIndices(composition)) == len(domains[gSpec.Codomain]) && len(distinctIndices(f)) < len(domains[fSpec.Codomain])
		}
		return correct, nil
	}
	from, to := domains[fSpec.Domain], domains[fSpec.Codomain]
	indices := func(set *setNode) []int {
		out := []int{}
		for _, x := range set.members {
			out = append(out, nodeIndex(from, x))
		}
		return out
	}
	s, w := indices(subsets["s"]), indices(subsets["w"])
	for _, i := range append(append([]int{}, s...), w...) {
		if i < 0 {
			return false, nil
		}
	}
	image := func(xs []int) []int {
		out := []int{}
		for _, i := range xs {
			out = append(out, f[i])
		}
		return distinctIndices(out)
	}
	intersection := []int{}
	for _, i := range s {
		if containsIndex(w, i) {
			intersection = append(intersection, i)
		}
	}
	left, si, wi := image(intersection), image(s), image(w)
	right := []int{}
	for _, i := range si {
		if containsIndex(wi, i) {
			right = append(right, i)
		}
	}
	set := func(xs []int) *setNode {
		n := &setNode{kind: "set"}
		for _, i := range xs {
			n.members = append(n.members, to[i])
		}
		return n
	}
	l, rgt := set(left), set(right)
	return !setNodeEqual(l, rgt) && setNodeEqual(l, subsets["left"]) && setNodeEqual(rgt, subsets["right"]), nil
}
