package main

import (
	"errors"
	"regexp"
	"strings"
)

type compositionLetter struct {
	name    string
	inverse bool
}
type compositionParams struct {
	Expected, Form string
	Functions      map[string][]string
}

func parseComposition(source string, functions map[string][]string) ([]compositionLetter, bool, error) {
	if len(source) > 4096 {
		return nil, false, errors.New("Use a shorter composition")
	}
	s := strings.Trim(strings.TrimSpace(source), "$")
	s = strings.NewReplacer(`\left`, "", `\right`, "", `\circ`, " o ", "∘", " o ", `\operatorname{id}`, "id", `\mathrm{id}`, "id", `\,`, " ", `\;`, " ", `\quad`, " ", `\qquad`, " ", "{", "(", "}", ")", "−", "-").Replace(s)
	ts := regexp.MustCompile(`[A-Za-z][A-Za-z0-9_]*|\d+|[^\s]`).FindAllString(s, -1)
	if len(ts) > 256 {
		return nil, false, errors.New("Use fewer composition factors")
	}
	at, compound := 0, false
	take := func(t string) bool {
		if at < len(ts) && ts[at] == t {
			at++
			return true
		}
		return false
	}
	var atom, product func(int) ([]compositionLetter, error)
	atom = func(depth int) ([]compositionLetter, error) {
		if depth > 32 {
			return nil, errors.New("Use fewer nested compositions")
		}
		word := []compositionLetter{}
		if take("(") {
			var e error
			word, e = product(depth + 1)
			if e != nil {
				return nil, e
			}
			if !take(")") {
				return nil, errors.New("Close the composition parentheses")
			}
		} else {
			if at >= len(ts) {
				return nil, errors.New("Enter the named functions")
			}
			name := ts[at]
			at++
			if name != "id" && name != "I" {
				if _, ok := functions[name]; !ok {
					return nil, errors.New("Use the named functions, composition, and inverse exponents")
				}
				word = append(word, compositionLetter{name, false})
			}
		}
		for take("^") {
			grouped, negative := take("("), take("-")
			if !take("1") || (grouped && !take(")")) {
				return nil, errors.New("Use exponent -1 for a function inverse")
			}
			if negative {
				if len(word) > 1 {
					compound = true
				}
				out := []compositionLetter{}
				for i := len(word) - 1; i >= 0; i-- {
					out = append(out, compositionLetter{word[i].name, !word[i].inverse})
				}
				word = out
			}
		}
		return word, nil
	}
	product = func(depth int) ([]compositionLetter, error) {
		word, e := atom(depth)
		if e != nil {
			return nil, e
		}
		for take("o") {
			next, e := atom(depth)
			if e != nil {
				return nil, e
			}
			word = append(word, next...)
		}
		return word, nil
	}
	word, e := product(0)
	if e == nil && at != len(ts) {
		e = errors.New("Join function names with o or \\circ")
	}
	return word, compound, e
}
func reducedComposition(word []compositionLetter) []compositionLetter {
	out := []compositionLetter{}
	for _, x := range word {
		if len(out) > 0 && out[len(out)-1].name == x.name && out[len(out)-1].inverse != x.inverse {
			out = out[:len(out)-1]
		} else {
			out = append(out, x)
		}
	}
	return out
}
func compositionType(word []compositionLetter, functions map[string][]string) ([2]string, bool) {
	if len(word) == 0 {
		return [2]string{}, true
	}
	types := [][2]string{}
	for _, x := range word {
		t := functions[x.name]
		if x.inverse {
			types = append(types, [2]string{t[1], t[0]})
		} else {
			types = append(types, [2]string{t[0], t[1]})
		}
	}
	for i := 0; i+1 < len(types); i++ {
		if types[i][0] != types[i+1][1] {
			return [2]string{}, false
		}
	}
	return [2]string{types[len(types)-1][0], types[0][1]}, true
}
func checkComposition(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p compositionParams
	jsonParams(r, &p)
	xs, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	a, compound, e := parseComposition(xs[0], p.Functions)
	if e != nil {
		return false, e
	}
	b, _, e := parseComposition(p.Expected, p.Functions)
	if e != nil {
		return false, e
	}
	ta, validA := compositionType(a, p.Functions)
	tb, validB := compositionType(b, p.Functions)
	if !validA || !validB || (len(a) > 0 && ta != tb) || (len(a) == 0 && tb[0] != tb[1]) || (p.Form == "individual-inverses" && compound) {
		return false, nil
	}
	a, b = reducedComposition(a), reducedComposition(b)
	if len(a) != len(b) {
		return false, nil
	}
	for i, x := range a {
		if x != b[i] {
			return false, nil
		}
	}
	return true, nil
}
func validateComposition(r AssessmentRequirement) error {
	var p compositionParams
	if jsonParams(r, &p) != nil || len(r.Fields) != 1 || len(p.Functions) < 1 || len(p.Functions) > 8 || !enum(p.Form, "", "individual-inverses") {
		return errors.New("Invalid composition definition")
	}
	for name, signature := range p.Functions {
		if !validIdentifier(name) || enum(name, "id", "I", "o") || len(signature) != 2 || signature[0] == "" || signature[1] == "" {
			return errors.New("Invalid function signature")
		}
	}
	word, _, e := parseComposition(p.Expected, p.Functions)
	if e != nil {
		return e
	}
	if _, ok := compositionType(word, p.Functions); !ok {
		return errors.New("Composition target has incompatible domains")
	}
	return nil
}
