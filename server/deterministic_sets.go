package main

import (
	"errors"
	"strings"
)

type setNode struct {
	kind, atom string
	number     exactNumber
	members    []*setNode
}

func setNodeEqual(a, b *setNode) bool {
	if a.kind != b.kind {
		return false
	}
	switch a.kind {
	case "number":
		return a.number.equal(b.number)
	case "atom":
		return a.atom == b.atom
	case "tuple":
		if len(a.members) != len(b.members) {
			return false
		}
		for i, v := range a.members {
			if !setNodeEqual(v, b.members[i]) {
				return false
			}
		}
		return true
	case "set":
		if len(a.members) != len(b.members) {
			return false
		}
		for _, v := range a.members {
			found := false
			for _, w := range b.members {
				found = found || setNodeEqual(v, w)
			}
			if !found {
				return false
			}
		}
		return true
	}
	return false
}
func splitSetValues(s string) ([]string, error) {
	if strings.TrimSpace(s) == "" {
		return []string{}, nil
	}
	xs := []string{}
	depth, start := 0, 0
	for i, c := range s {
		if strings.ContainsRune("([{", c) {
			depth++
		}
		if strings.ContainsRune(")]}", c) {
			depth--
		}
		if depth < 0 {
			return nil, errors.New("Check set delimiters")
		}
		if c == ',' && depth == 0 {
			xs = append(xs, strings.TrimSpace(s[start:i]))
			start = i + 1
		}
	}
	if depth != 0 {
		return nil, errors.New("Close each set or tuple delimiter")
	}
	xs = append(xs, strings.TrimSpace(s[start:]))
	for _, x := range xs {
		if x == "" {
			return nil, errors.New("Enter a value between commas")
		}
	}
	return xs, nil
}
func parseSetNode(s string, atoms []string, depth int) (*setNode, error) {
	if len(s) > 4096 || depth > 32 {
		return nil, errors.New("Use a shorter finite set")
	}
	s = strings.TrimSpace(strings.NewReplacer("\\left", "", "\\right", "", "\\varnothing", "{}", "\\emptyset", "{}", "∅", "{}", "\\{", "{", "\\}", "}").Replace(strings.Trim(strings.TrimSpace(s), "$")))
	if s == "" {
		return nil, errors.New("Enter a set or {} for the empty set")
	}
	if (strings.HasPrefix(s, "{") && strings.HasSuffix(s, "}")) || (strings.HasPrefix(s, "(") && strings.HasSuffix(s, ")")) {
		xs, e := splitSetValues(s[1 : len(s)-1])
		if e != nil {
			return nil, e
		}
		kind := "set"
		if s[0] == '(' {
			kind = "tuple"
		}
		if kind == "set" || len(xs) > 1 {
			out := &setNode{kind: kind}
			for _, x := range xs {
				n, e := parseSetNode(x, atoms, depth+1)
				if e != nil {
					return nil, e
				}
				duplicate := false
				if kind == "set" {
					for _, v := range out.members {
						duplicate = duplicate || setNodeEqual(n, v)
					}
				}
				if !duplicate {
					out.members = append(out.members, n)
				}
			}
			return out, nil
		}
	}
	if contains(atoms, s) {
		return &setNode{kind: "atom", atom: s}, nil
	}
	x, e := parseExact(s)
	return &setNode{kind: "number", number: x}, e
}
func checkSet(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p struct {
		Expected []string `json:"expected"`
		Atoms    []string `json:"atoms"`
	}
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	atoms := append([]string{}, p.Atoms...)
	for _, s := range p.Expected {
		for _, a := range identifierToken.FindAllString(s, -1) {
			if !enum(a, "sqrt", "frac", "dfrac", "tfrac", "binom", "begin", "end", "varnothing", "emptyset") {
				atoms = append(atoms, a)
			}
		}
	}
	target, e := parseSetNode("{"+strings.Join(p.Expected, ",")+"}", atoms, 0)
	if e != nil {
		return false, e
	}
	entered := strings.TrimSpace(strings.Trim(strings.TrimSpace(xs[0]), "$"))
	if !strings.HasPrefix(entered, "{") && !strings.HasPrefix(entered, "\\{") && !strings.HasPrefix(entered, "\\left\\{") && !strings.HasPrefix(entered, "\\varnothing") && !strings.HasPrefix(entered, "\\emptyset") && !strings.HasPrefix(entered, "∅") {
		entered = "{" + entered + "}"
	}
	got, e := parseSetNode(entered, atoms, 0)
	if e != nil {
		return false, e
	}
	return got.kind == "set" && setNodeEqual(got, target), nil
}
