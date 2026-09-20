package main

import (
	"encoding/json"
	"errors"
	"math/bits"
	"regexp"
	"sort"
	"strings"
)

type graphParams struct {
	Kind     string     `json:"kind"`
	Vertices []string   `json:"vertices"`
	Edges    [][]string `json:"edges"`
	Directed bool       `json:"directed"`
	Expected []string   `json:"expected"`
	Ordered  *bool      `json:"ordered"`
	Start    string     `json:"start"`
	End      string     `json:"end"`
	EdgeIDs  []string   `json:"edgeIds"`
	Property string     `json:"property"`
}

var graphLabel = regexp.MustCompile(`^[A-Za-z0-9_]{1,32}$`)
var graphDelimiters = regexp.MustCompile(`[\s,]+`)
var graphBadCommas = regexp.MustCompile(`,\s*,|^\s*,|,\s*$`)
var graphRows = regexp.MustCompile(`[;\n]+`)

func graphUnique(xs []string) bool {
	m := map[string]bool{}
	for _, x := range xs {
		if m[x] {
			return false
		}
		m[x] = true
	}
	return true
}
func graphHas(xs []string, x string) bool {
	for _, v := range xs {
		if v == x {
			return true
		}
	}
	return false
}
func graphSame(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
func graphKey(a, b string, directed bool) string {
	if !directed && a > b {
		a, b = b, a
	}
	data, _ := json.Marshal([]string{a, b})
	return string(data)
}
func graphList(s string) ([]string, error) {
	if len(s) > 8192 {
		return nil, errors.New("Use a shorter vertex list")
	}
	s = strings.TrimSpace(s)
	for _, x := range []string{"\\left", "\\right"} {
		s = strings.ReplaceAll(s, x, "")
	}
	s = strings.NewReplacer("\\{", "{", "\\}", "}").Replace(s)
	delimiters := []rune{}
	for _, c := range s {
		if strings.ContainsRune("{([", c) {
			delimiters = append(delimiters, c)
		} else if i := strings.IndexRune("})]", c); i >= 0 {
			if len(delimiters) == 0 || delimiters[len(delimiters)-1] != rune("{(["[i]) {
				return nil, errors.New("Check the vertex-list delimiters")
			}
			delimiters = delimiters[:len(delimiters)-1]
		}
	}
	if len(delimiters) > 0 {
		return nil, errors.New("Close the vertex-list delimiters")
	}
	for _, x := range []string{"{", "}", "(", ")", "[", "]"} {
		s = strings.ReplaceAll(s, x, "")
	}
	for _, x := range []string{"→", "->", "\\to"} {
		s = strings.ReplaceAll(s, x, ",")
	}
	if s == "" || graphBadCommas.MatchString(s) {
		return nil, errors.New("Enter vertex labels separated by commas or spaces")
	}
	xs := graphDelimiters.Split(s, -1)
	if len(xs) > 512 {
		return nil, errors.New("Use a shorter vertex list")
	}
	for _, x := range xs {
		if !graphLabel.MatchString(x) {
			return nil, errors.New("Use vertex labels containing letters, digits or underscores")
		}
	}
	return xs, nil
}
func graphPairs(s string) ([][]string, error) {
	if enum(strings.TrimSpace(s), "{}", "[]", "∅", "\\emptyset", "\\varnothing") {
		return [][]string{}, nil
	}
	s = strings.ReplaceAll(strings.ReplaceAll(s, ";", ","), "-", ",")
	xs, e := graphList(s)
	if e != nil {
		return nil, e
	}
	if len(xs)%2 != 0 {
		return nil, errors.New("Enter edges as pairs, for example (a,b),(b,c)")
	}
	out := [][]string{}
	for i := 0; i < len(xs); i += 2 {
		out = append(out, xs[i:i+2])
	}
	return out, nil
}
func graphValid(p graphParams) bool {
	if len(p.Vertices) < 1 || len(p.Vertices) > 16 || !graphUnique(p.Vertices) || len(p.Edges) > 240 {
		return false
	}
	for _, v := range p.Vertices {
		if !graphLabel.MatchString(v) {
			return false
		}
	}
	keys := []string{}
	for _, e := range p.Edges {
		if len(e) != 2 || e[0] == e[1] || !graphHas(p.Vertices, e[0]) || !graphHas(p.Vertices, e[1]) {
			return false
		}
		keys = append(keys, graphKey(e[0], e[1], p.Directed))
	}
	return graphUnique(keys)
}
func graphReach(p graphParams, start string, weak bool) map[string]bool {
	seen := map[string]bool{start: true}
	pending := []string{start}
	for len(pending) > 0 {
		v := pending[len(pending)-1]
		pending = pending[:len(pending)-1]
		for _, e := range p.Edges {
			w := ""
			if e[0] == v {
				w = e[1]
			} else if (!p.Directed || weak) && e[1] == v {
				w = e[0]
			}
			if w != "" && !seen[w] {
				seen[w] = true
				pending = append(pending, w)
			}
		}
	}
	return seen
}
func graphConnected(p graphParams, weak bool) bool {
	return len(p.Vertices) > 0 && len(graphReach(p, p.Vertices[0], weak)) == len(p.Vertices)
}
func graphComponents(p graphParams) [][]string {
	done := map[string]bool{}
	out := [][]string{}
	for _, v := range p.Vertices {
		if done[v] {
			continue
		}
		row := []string{}
		for w := range graphReach(p, v, true) {
			done[w] = true
			row = append(row, w)
		}
		sort.Strings(row)
		out = append(out, row)
	}
	return out
}
func graphRoute(p graphParams, xs []string, kind string) bool {
	for _, v := range xs {
		if !graphHas(p.Vertices, v) {
			return false
		}
	}
	edges := map[string]bool{}
	for _, e := range p.Edges {
		edges[graphKey(e[0], e[1], p.Directed)] = true
	}
	used := []string{}
	for i := 1; i < len(xs); i++ {
		k := graphKey(xs[i-1], xs[i], p.Directed)
		if !edges[k] {
			return false
		}
		used = append(used, k)
	}
	if kind == "path" {
		return graphUnique(xs)
	}
	if kind == "hamiltonian-cycle" {
		min := 3
		if p.Directed {
			min = 2
		}
		return len(p.Vertices) >= min && len(xs) == len(p.Vertices)+1 && xs[0] == xs[len(xs)-1] && graphUnique(xs[:len(xs)-1])
	}
	return len(used) == len(edges) && graphUnique(used) && (kind != "euler-circuit" || xs[0] == xs[len(xs)-1])
}
func graphRowKey(xs []string) string { d, _ := json.Marshal(xs); return string(d) }
func graphTopological(p graphParams) []string {
	out := []string{}
	var visit func([]string)
	visit = func(prefix []string) {
		if len(prefix) == len(p.Vertices) {
			out = append(out, graphRowKey(prefix))
			return
		}
		for _, v := range p.Vertices {
			if graphHas(prefix, v) {
				continue
			}
			ok := true
			for _, e := range p.Edges {
				if e[1] == v && !graphHas(prefix, e[0]) {
					ok = false
					break
				}
			}
			if ok {
				visit(append(append([]string{}, prefix...), v))
			}
		}
	}
	visit([]string{})
	sort.Strings(out)
	return out
}
func graphHamiltonian(p graphParams) bool {
	n := len(p.Vertices)
	if n < 3 {
		return false
	}
	indices := map[string]int{}
	for i, v := range p.Vertices {
		indices[v] = i
	}
	neighbors := make([]uint32, n)
	for _, e := range p.Edges {
		a, b := indices[e[0]], indices[e[1]]
		neighbors[a] |= 1 << b
		neighbors[b] |= 1 << a
	}
	dp := make([]uint32, 1<<n)
	dp[1] = 1
	for mask := 1; mask < len(dp); mask += 2 {
		ends := dp[mask]
		for ends != 0 {
			end := bits.TrailingZeros32(ends)
			ends &= ends - 1
			choices := neighbors[end] &^ uint32(mask)
			for choices != 0 {
				bit := choices & -choices
				choices &= choices - 1
				dp[mask|int(bit)] |= bit
			}
		}
	}
	return dp[len(dp)-1]&neighbors[0] != 0
}
func graphEulerExists(p graphParams) bool {
	active := []string{}
	odd := 0
	for _, v := range p.Vertices {
		degree := 0
		for _, e := range p.Edges {
			if e[0] == v || e[1] == v {
				degree++
			}
		}
		if degree > 0 {
			active = append(active, v)
		}
		odd += degree % 2
	}
	if len(active) == 0 {
		return true
	}
	return len(graphReach(p, active[0], false)) == len(active) && (odd == 0 || odd == 2)
}
func validateGraph(r AssessmentRequirement) error {
	var p graphParams
	if e := jsonParams(r, &p); e != nil {
		return e
	}
	if !enum(p.Kind, "sequence", "graph-property", "spanning-tree", "connect-with-edges", "components", "all-topological-orders", "two-paths", "euler-trail", "euler-circuit", "hamiltonian-cycle") {
		return errors.New("Invalid graph kind")
	}
	fields := 1
	if enum(p.Kind, "two-paths", "graph-property") {
		fields = 2
	}
	if p.Kind == "graph-property" && p.Property == "rooted-leaf-counterexample" {
		fields = 3
	}
	if len(r.Fields) != fields {
		return errors.New("Invalid graph requirement fields")
	}
	if p.Kind == "sequence" {
		if len(p.Expected) == 0 || len(p.Expected) > 512 {
			return errors.New("Missing expected sequence")
		}
		for _, v := range p.Expected {
			if !graphLabel.MatchString(v) {
				return errors.New("Invalid expected label")
			}
		}
		if p.Ordered != nil && !*p.Ordered && !graphUnique(p.Expected) {
			return errors.New("Duplicate expected set label")
		}
		return nil
	}
	if p.Kind == "graph-property" {
		if !enum(p.Property, "weak-not-strong", "n-minus-one-not-tree", "euler-hamiltonian-mismatch", "rooted-leaf-counterexample") || p.Directed != (p.Property == "weak-not-strong") {
			return errors.New("Invalid graph property")
		}
		return nil
	}
	if !graphValid(p) {
		return errors.New("Use a finite simple authored graph with at most 16 vertices")
	}
	if p.Kind == "all-topological-orders" && (!p.Directed || len(p.Vertices) > 8 || len(graphTopological(p)) == 0) {
		return errors.New("Topological enumeration requires a DAG with at most eight vertices")
	}
	if p.Kind == "two-paths" && (!graphHas(p.Vertices, p.Start) || !graphHas(p.Vertices, p.End) || p.Start == p.End) {
		return errors.New("Paths need distinct authored endpoints")
	}
	if p.Kind == "spanning-tree" {
		if len(p.EdgeIDs) != len(p.Edges) || !graphUnique(p.EdgeIDs) {
			return errors.New("Spanning edges need unique IDs")
		}
		for _, id := range p.EdgeIDs {
			if id == "" {
				return errors.New("Missing edge ID")
			}
		}
	}
	if enum(p.Kind, "spanning-tree", "connect-with-edges", "components") && p.Directed {
		return errors.New("This task requires an undirected graph")
	}
	return nil
}
func checkGraph(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	var p graphParams
	if e := jsonParams(r, &p); e != nil {
		return false, e
	}
	if p.Kind == "spanning-tree" {
		raw, ok := response[r.Fields[0]].([]any)
		ids := []string{}
		if ok {
			for _, v := range raw {
				s, ok := v.(string)
				if !ok {
					return false, errors.New("Select edges")
				}
				ids = append(ids, s)
			}
		} else if vs, ok := response[r.Fields[0]].([]string); ok {
			ids = vs
		} else {
			return false, errors.New("Select the edges of a spanning tree")
		}
		if !graphUnique(ids) {
			return false, nil
		}
		edges := [][]string{}
		for _, id := range ids {
			i := -1
			for j, v := range p.EdgeIDs {
				if v == id {
					i = j
					break
				}
			}
			if i < 0 {
				return false, nil
			}
			edges = append(edges, p.Edges[i])
		}
		p.Edges = edges
		return len(edges) == len(p.Vertices)-1 && graphConnected(p, false), nil
	}
	values, e := responseStrings(r, response)
	if e != nil {
		return false, e
	}
	var xs []string
	if !enum(p.Kind, "components", "all-topological-orders", "connect-with-edges") {
		xs, e = graphList(values[0])
		if e != nil {
			return false, e
		}
	}
	if p.Kind == "sequence" {
		expected := append([]string{}, p.Expected...)
		if p.Ordered != nil && !*p.Ordered {
			if !graphUnique(xs) {
				return false, nil
			}
			sort.Strings(xs)
			sort.Strings(expected)
		}
		return graphSame(xs, expected), nil
	}
	if p.Kind == "graph-property" {
		edges, e := graphPairs(values[1])
		if e != nil {
			return false, e
		}
		p.Vertices, p.Edges = xs, edges
		if !graphValid(p) {
			return false, nil
		}
		switch p.Property {
		case "rooted-leaf-counterexample":
			roots, e := graphList(values[2])
			if e != nil {
				return false, e
			}
			if len(roots) != 1 || !graphHas(p.Vertices, roots[0]) || len(p.Edges) != len(p.Vertices)-1 || !graphConnected(p, false) {
				return false, nil
			}
			leaves, one := 0, false
			for _, v := range p.Vertices {
				children := 0
				for _, edge := range p.Edges {
					if edge[0] == v || edge[1] == v {
						children++
					}
				}
				if v != roots[0] {
					children--
				}
				if children == 0 {
					leaves++
				}
				if children == 1 {
					one = true
				}
			}
			return one && leaves != len(p.Vertices)-leaves+1, nil

		case "weak-not-strong":
			strong := true
			for _, v := range p.Vertices {
				if len(graphReach(p, v, false)) != len(p.Vertices) {
					strong = false
				}
			}
			return graphConnected(p, true) && !strong, nil
		case "n-minus-one-not-tree":
			return len(p.Edges) == len(p.Vertices)-1 && !graphConnected(p, false), nil
		default:
			return graphEulerExists(p) != graphHamiltonian(p), nil
		}
	}
	if p.Kind == "connect-with-edges" {
		edges, e := graphPairs(values[0])
		if e != nil {
			return false, e
		}
		need := len(graphComponents(p)) - 1
		p.Edges = append(append([][]string{}, p.Edges...), edges...)
		return graphValid(p) && len(edges) == need && graphConnected(p, false), nil
	}
	if enum(p.Kind, "components", "all-topological-orders") {
		actual := []string{}
		for _, row := range graphRows.Split(values[0], -1) {
			vs, e := graphList(row)
			if e != nil {
				return false, e
			}
			if p.Kind == "components" {
				sort.Strings(vs)
			}
			actual = append(actual, graphRowKey(vs))
		}
		sort.Strings(actual)
		if !graphUnique(actual) {
			return false, nil
		}
		expected := []string{}
		if p.Kind == "components" {
			for _, row := range graphComponents(p) {
				expected = append(expected, graphRowKey(row))
			}
			sort.Strings(expected)
		} else {
			expected = graphTopological(p)
		}
		return graphSame(actual, expected), nil
	}
	if p.Kind == "two-paths" {
		ys, e := graphList(values[1])
		if e != nil {
			return false, e
		}
		if graphSame(xs, ys) {
			return false, nil
		}
		for _, row := range [][]string{xs, ys} {
			if row[0] != p.Start || row[len(row)-1] != p.End || !graphRoute(p, row, "path") {
				return false, nil
			}
		}
		return true, nil
	}
	return graphRoute(p, xs, p.Kind), nil
}
