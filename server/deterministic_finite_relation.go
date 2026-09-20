package main

import (
	"errors"
	"regexp"
)

var finiteRelationAtom = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]{0,31}$`)

type finiteRelationParams struct {
	Kind     string   `json:"kind"`
	Atoms    []string `json:"atoms"`
	Universe []string `json:"universe"`
}
type relationPair [2]*setNode

func finiteRelationPairs(s string, atoms []string) ([]relationPair, error) {
	node, e := parseSetNode(s, atoms, 0)
	if e != nil {
		return nil, e
	}
	if node.kind != "set" {
		return nil, errors.New("Use braces for a finite set, or {} for the empty set")
	}
	if len(node.members) > 256 {
		return nil, errors.New("Use at most 256 ordered pairs")
	}
	pairs := []relationPair{}
	for _, member := range node.members {
		if member.kind != "tuple" || len(member.members) != 2 {
			return nil, errors.New("Enter a set of ordered pairs, for example {(1,2),(2,1)}")
		}
		pairs = append(pairs, relationPair{member.members[0], member.members[1]})
	}
	return pairs, nil
}
func finiteRelationIndex(nodes []*setNode, x *setNode) int {
	for i, v := range nodes {
		if setNodeEqual(x, v) {
			return i
		}
	}
	return -1
}
func finiteRelationCarrier(relations ...[]relationPair) ([]*setNode, error) {
	nodes := []*setNode{}
	for _, r := range relations {
		for _, pair := range r {
			for _, node := range pair {
				if finiteRelationIndex(nodes, node) < 0 {
					nodes = append(nodes, node)
				}
			}
		}
	}
	if len(nodes) > 16 {
		return nil, errors.New("Use at most 16 elements in the finite relation")
	}
	return nodes, nil
}
func finiteRelationMatrix(pairs []relationPair, nodes []*setNode) [][]bool {
	a := make([][]bool, len(nodes))
	for i := range a {
		a[i] = make([]bool, len(nodes))
	}
	for _, pair := range pairs {
		i, j := finiteRelationIndex(nodes, pair[0]), finiteRelationIndex(nodes, pair[1])
		if i >= 0 && j >= 0 {
			a[i][j] = true
		}
	}
	return a
}
func validateFiniteRelation(r AssessmentRequirement) error {
	var p finiteRelationParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if !enum(p.Kind, "noncommuting-composition", "reflexive-symmetric-not-transitive", "distinct-triples-counterexample") {
		return errors.New("Invalid finite relation kind")
	}
	count := 2
	if p.Kind == "distinct-triples-counterexample" {
		count = 1
	}
	if len(r.Fields) != count {
		return errors.New("Invalid finite relation fields")
	}
	if len(p.Atoms) > 256 {
		return errors.New("Too many atom labels")
	}
	for _, atom := range p.Atoms {
		if !finiteRelationAtom.MatchString(atom) {
			return errors.New("Use explicit finite atom labels")
		}
	}
	if p.Kind == "reflexive-symmetric-not-transitive" {
		if len(p.Universe) == 0 || len(p.Universe) > 16 {
			return errors.New("Use a finite authored universe of at most 16 elements")
		}
		nodes := []*setNode{}
		for _, s := range p.Universe {
			node, e := parseSetNode(s, p.Atoms, 0)
			if e != nil {
				return e
			}
			if finiteRelationIndex(nodes, node) >= 0 {
				return errors.New("Duplicate authored universe element")
			}
			nodes = append(nodes, node)
		}
	}
	return nil
}
func checkFiniteRelation(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p finiteRelationParams
	if e := jsonParams(r, &p); e != nil {
		return false, e
	}
	values, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	for _, source := range append(append([]string{}, values...), p.Universe...) {
		for _, atom := range identifierToken.FindAllString(source, -1) {
			if !contains(p.Atoms, atom) {
				p.Atoms = append(p.Atoms, atom)
			}
		}
	}
	first, e := finiteRelationPairs(values[0], p.Atoms)
	if e != nil {
		return false, e
	}
	if p.Kind == "noncommuting-composition" {
		second, e := finiteRelationPairs(values[1], p.Atoms)
		if e != nil {
			return false, e
		}
		nodes, e := finiteRelationCarrier(first, second)
		if e != nil {
			return false, e
		}
		a, b := finiteRelationMatrix(first, nodes), finiteRelationMatrix(second, nodes)
		for i := range nodes {
			for k := range nodes {
				ab, ba := false, false
				for j := range nodes {
					ab = ab || (a[i][j] && b[j][k])
					ba = ba || (b[i][j] && a[j][k])
				}
				if ab != ba {
					return true, nil
				}
			}
		}
		return false, nil
	}
	if p.Kind == "distinct-triples-counterexample" {
		nodes, e := finiteRelationCarrier(first)
		if e != nil {
			return false, e
		}
		if len(nodes) != 2 {
			return false, nil
		}
		a := finiteRelationMatrix(first, nodes)
		for i := range nodes {
			for j := range nodes {
				for k := range nodes {
					if a[i][j] && a[j][k] && !a[i][k] {
						return true, nil
					}
				}
			}
		}
		return false, nil
	}
	// Parse every learner field before returning a mathematical verdict.
	witness, e := parseSetNode(values[1], p.Atoms, 0)
	if e != nil {
		return false, e
	}
	if witness.kind != "tuple" || len(witness.members) != 3 {
		return false, errors.New("Enter the ordered witness triple (a,b,c)")
	}
	nodes := []*setNode{}
	for _, s := range p.Universe {
		node, e := parseSetNode(s, p.Atoms, 0)
		if e != nil {
			return false, e
		}
		nodes = append(nodes, node)
	}
	actual, e := finiteRelationCarrier(first)
	if e != nil {
		return false, e
	}
	for _, node := range actual {
		if finiteRelationIndex(nodes, node) < 0 {
			return false, nil
		}
	}
	a := finiteRelationMatrix(first, nodes)
	for i, row := range a {
		if !row[i] {
			return false, nil
		}
		for j, v := range row {
			if v != a[j][i] {
				return false, nil
			}
		}
	}
	i, j, k := finiteRelationIndex(nodes, witness.members[0]), finiteRelationIndex(nodes, witness.members[1]), finiteRelationIndex(nodes, witness.members[2])
	return i >= 0 && j >= 0 && k >= 0 && a[i][j] && a[j][k] && !a[i][k], nil
}
