package main

import (
	"errors"
	"regexp"
	"strings"
)

func intervalNotation(source, variable string) (string, error) {
	s := strings.Trim(strings.TrimSpace(source), "$")
	s = regexp.MustCompile(`^R\s*\\\{`).ReplaceAllString(s, "R SETMINUS {")
	s = strings.NewReplacer(`\left`, "", `\right`, "", `\mathbb{R}`, "R", `\infty`, "infinity", "∞", "infinity", `\cup`, " UNION ", "∪", " UNION ", "union", " UNION ", `\setminus`, `\`, `\backslash`, `\`, "∖", `\`, `\{`, "{", `\}`, "}", `\emptyset`, "{}", `\varnothing`, "{}", "∅", "{}").Replace(s)
	s = strings.TrimSpace(strings.ReplaceAll(s, "SETMINUS", `\`))
	if s == "R" {
		return variable + "=" + variable, nil
	}
	if s == "{}" {
		return variable + "!=" + variable, nil
	}
	minus := regexp.MustCompile(`^R\s*\\\s*\{(.*)\}$`).FindStringSubmatch(s)
	if minus != nil {
		xs, e := splitSetValues(minus[1])
		if e != nil {
			return "", e
		}
		parts := []string{}
		for _, x := range xs {
			parts = append(parts, variable+"!=("+x+")")
		}
		if len(parts) == 0 {
			return variable + "=" + variable, nil
		}
		return strings.Join(parts, " and "), nil
	}
	pieces := strings.Split(s, " UNION ")
	if len(pieces) > 64 {
		return "", errors.New("Use at most 64 intervals")
	}
	out := []string{}
	for _, raw := range pieces {
		p := strings.TrimSpace(raw)
		if len(p) < 3 || !strings.ContainsRune("[(", rune(p[0])) || !strings.ContainsRune("])", rune(p[len(p)-1])) {
			if len(pieces) > 1 {
				return "", errors.New("Write each interval with two endpoints")
			}
			return source, nil
		}
		interior := p[1 : len(p)-1]
		depth, comma := 0, false
		for _, c := range interior {
			if strings.ContainsRune("([{", c) {
				depth++
			}
			if strings.ContainsRune(")]}", c) {
				depth--
			}
			if c == ',' && depth == 0 {
				comma = true
			}
		}
		if !comma {
			if len(pieces) > 1 {
				return "", errors.New("Write each interval with two endpoints")
			}
			return source, nil
		}
		xs, e := splitSetValues(interior)
		if e != nil {
			return "", e
		}
		if len(xs) != 2 {
			if len(pieces) > 1 {
				return "", errors.New("Write each interval with two endpoints")
			}
			return source, nil
		}
		lo, hi := strings.TrimPrefix(strings.TrimSpace(xs[0]), "+"), strings.TrimPrefix(strings.TrimSpace(xs[1]), "+")
		lower, upper := lo == "-infinity", hi == "infinity"
		if lo == "infinity" || hi == "-infinity" || (lower && p[0] == '[') || (upper && p[len(p)-1] == ']') {
			return "", errors.New("Use an open endpoint at infinity")
		}
		parts := []string{}
		if !lower {
			op := ">"
			if p[0] == '[' {
				op = ">="
			}
			parts = append(parts, variable+op+"("+xs[0]+")")
		}
		if !upper {
			op := "<"
			if p[len(p)-1] == ']' {
				op = "<="
			}
			parts = append(parts, variable+op+"("+xs[1]+")")
		}
		if len(parts) == 0 {
			parts = append(parts, variable+"="+variable)
		}
		out = append(out, "("+strings.Join(parts, " and ")+")")
	}
	return strings.Join(out, " or "), nil
}
