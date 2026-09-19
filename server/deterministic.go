package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"sort"
	"strings"
	"time"
)

// Assessment is an immutable, data-only grading definition. Never execute code
// from an authored definition or accept a definition supplied with a response.
type Assessment struct {
	Version      int                     `json:"version"`
	Inputs       []AssessmentInput       `json:"inputs"`
	Requirements []AssessmentRequirement `json:"requirements"`
	Feedback     struct {
		Correct   string `json:"correct"`
		Incorrect string `json:"incorrect"`
	} `json:"feedback"`
	Evidence AssessmentEvidence `json:"evidence"`
}
type AssessmentEvidence struct {
	Level             string   `json:"level"`
	InteractionCost   string   `json:"interactionCost"`
	InputCapabilities []string `json:"inputCapabilities"`
}
type AssessmentOption struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}
type AssessmentInput struct {
	ID         string             `json:"id"`
	Kind       string             `json:"kind"`
	Label      string             `json:"label"`
	Hint       string             `json:"hint,omitempty"`
	Options    []AssessmentOption `json:"options,omitempty"`
	EmptyLabel string             `json:"emptyLabel,omitempty"`
	Columns    []string           `json:"columns,omitempty"`
	Rows       []AssessmentRow    `json:"rows,omitempty"`
}
type AssessmentRow struct {
	Label string           `json:"label,omitempty"`
	Cells []AssessmentCell `json:"cells"`
}
type AssessmentCell struct {
	Given json.RawMessage `json:"given,omitempty"`
	ID    string          `json:"id,omitempty"`
	Kind  string          `json:"kind,omitempty"`
	Label string          `json:"label,omitempty"`
}
type AssessmentRequirement struct {
	ID            string          `json:"id"`
	Description   string          `json:"description"`
	Validator     string          `json:"validator"`
	EvidenceLevel string          `json:"evidenceLevel,omitempty"`
	Fields        []string        `json:"fields"`
	Params        json.RawMessage `json:"params"`
}
type StructuredResponse map[string]any
type AttemptPresentation struct {
	Question   map[string]any `json:"question"`
	Assessment *Assessment    `json:"assessment,omitempty"`
}
type answerField struct {
	id, kind, label string
	options         []AssessmentOption
}

func (a *Assessment) fields() []answerField {
	var fields []answerField
	for _, in := range a.Inputs {
		switch in.Kind {
		case "grid":
			for _, row := range in.Rows {
				for _, cell := range row.Cells {
					if len(cell.Given) == 0 {
						fields = append(fields, answerField{cell.ID, cell.Kind, cell.Label, nil})
					}
				}
			}
		case "interval":
			for _, suffix := range []string{"lower", "upper", "leftClosed", "rightClosed"} {
				kind := "text"
				if strings.HasSuffix(suffix, "Closed") {
					kind = "boolean"
				}
				fields = append(fields, answerField{in.ID + "." + suffix, kind, in.Label, nil})
			}
		default:
			fields = append(fields, answerField{in.ID, in.Kind, in.Label, in.Options})
		}
	}
	return fields
}
func validateAssessment(a *Assessment) error {
	if a == nil || a.Version != 1 || len(a.Inputs) == 0 || len(a.Inputs) > 128 || len(a.Requirements) == 0 || len(a.Requirements) > 1024 || strings.TrimSpace(a.Feedback.Correct) == "" || strings.TrimSpace(a.Feedback.Incorrect) == "" {
		return errors.New("Invalid deterministic assessment")
	}
	if !enum(a.Evidence.Level, "recognition", "production", "reasoning") || !enum(a.Evidence.InteractionCost, "low", "medium", "high") || len(a.Evidence.InputCapabilities) == 0 {
		return errors.New("Invalid assessment evidence")
	}
	for _, c := range a.Evidence.InputCapabilities {
		if !enum(c, "tap", "short-text", "math-text") {
			return errors.New("Unsupported assessment input capability")
		}
	}
	ids := map[string]bool{}
	for _, in := range a.Inputs {
		if in.ID == "" || ids[in.ID] || in.Label == "" || !enum(in.Kind, "text", "math", "boolean", "select", "multiselect", "grid", "interval") {
			return errors.New("Invalid assessment input")
		}
		ids[in.ID] = true
		if enum(in.Kind, "select", "multiselect") {
			if len(in.Options) == 0 || len(in.Options) > 256 {
				return errors.New("Invalid assessment options")
			}
			opts := map[string]bool{}
			for _, o := range in.Options {
				if o.ID == "" || o.Label == "" || opts[o.ID] {
					return errors.New("Invalid assessment option")
				}
				opts[o.ID] = true
			}
		}
		if in.Kind == "grid" {
			if len(in.Columns) == 0 || len(in.Columns) > 64 || len(in.Rows) == 0 || len(in.Rows) > 256 {
				return errors.New("Invalid assessment grid")
			}
			for _, row := range in.Rows {
				if len(row.Cells) != len(in.Columns) {
					return errors.New("Invalid assessment row")
				}
				for _, c := range row.Cells {
					if len(c.Given) > 0 {
						var v any
						if json.Unmarshal(c.Given, &v) != nil {
							return errors.New("Invalid given cell")
						}
						switch v.(type) {
						case string, bool:
						default:
							return errors.New("Invalid given cell")
						}
						if c.ID != "" || c.Kind != "" {
							return errors.New("Given cell cannot be editable")
						}
					} else if c.ID == "" || !enum(c.Kind, "boolean", "text") {
						return errors.New("Invalid editable cell")
					}
				}
			}
		}
	}
	fields := map[string]answerField{}
	for _, f := range a.fields() {
		if f.id == "" || len(f.id) > 200 || fields[f.id].id != "" {
			return errors.New("Duplicate assessment field")
		}
		fields[f.id] = f
	}
	if len(fields) == 0 || len(fields) > 2048 {
		return errors.New("Invalid assessment field count")
	}
	requirements := map[string]bool{}
	covered := map[string]bool{}
	for _, r := range a.Requirements {
		if r.ID == "" || r.Description == "" || requirements[r.ID] || len(r.Fields) == 0 {
			return errors.New("Invalid assessment requirement")
		}
		if r.EvidenceLevel != "" && !enum(r.EvidenceLevel, "recognition", "production", "reasoning") {
			return errors.New("Invalid requirement evidence")
		}
		requirements[r.ID] = true
		seen := map[string]bool{}
		for _, f := range r.Fields {
			if fields[f].id == "" || seen[f] {
				return errors.New("Unknown or repeated requirement field")
			}
			seen[f] = true
			covered[f] = true
		}
		if err := validateRequirement(r, fields); err != nil {
			return fmt.Errorf("Requirement %s: %w", r.ID, err)
		}
	}
	for k := range fields {
		if !covered[k] {
			return errors.New("Ungraded assessment field")
		}
	}
	return nil
}
func validateResponse(a *Assessment, response StructuredResponse) error {
	if response == nil {
		return errors.New("Complete the answer before submitting")
	}
	fields := a.fields()
	if len(response) != len(fields) {
		return errors.New("Complete every answer field")
	}
	for _, f := range fields {
		v, ok := response[f.id]
		if !ok || v == nil {
			return fmt.Errorf("Complete %s", f.id)
		}
		switch f.kind {
		case "boolean":
			if _, ok := v.(bool); !ok {
				return fmt.Errorf("Choose true or false for %s", f.id)
			}
		case "multiselect":
			var values []string
			switch x := v.(type) {
			case []string:
				values = x
			case []any:
				for _, i := range x {
					s, ok := i.(string)
					if !ok {
						return errors.New("Invalid selection")
					}
					values = append(values, s)
				}
			default:
				return errors.New("Invalid selection")
			}
			seen := map[string]bool{}
			for _, s := range values {
				known := false
				for _, o := range f.options {
					known = known || o.ID == s
				}
				if !known || seen[s] {
					return errors.New("Unknown or duplicate selection")
				}
				seen[s] = true
			}
		default:
			s, ok := v.(string)
			if !ok || strings.TrimSpace(s) == "" || len(s) > 4096 {
				return fmt.Errorf("Enter an answer for %s", f.id)
			}
			if f.kind == "select" {
				found := false
				for _, o := range f.options {
					found = found || o.ID == s
				}
				if !found {
					return errors.New("Unknown selection")
				}
			}
		}
	}
	return nil
}
func gradeAssessment(a *Assessment, response StructuredResponse) (Grade, error) {
	if err := validateAssessment(a); err != nil {
		return Grade{}, err
	}
	if err := validateResponse(a, response); err != nil {
		return Grade{}, err
	}
	g := Grade{Verdict: "correct", Feedback: a.Feedback.Correct, Model: "deterministic", PromptVersion: "structured-1", At: time.Now().UnixMilli(), Confidence: "high", Diagnosis: []Diagnosis{}}
	for _, r := range a.Requirements {
		ok, err := checkRequirement(r, response)
		if err != nil {
			return Grade{}, fmt.Errorf("%s: %w", r.Description, err)
		}
		g.Requirements = append(g.Requirements, Requirement{ID: r.ID, Description: r.Description, Satisfied: ok})
		if !ok {
			g.Verdict = "incorrect"
			g.Feedback = a.Feedback.Incorrect
		}
	}
	return g, nil
}
func assessmentFromQuestion(q map[string]any) *Assessment {
	if q["assessment"] == nil {
		return nil
	}
	b, err := json.Marshal(q["assessment"])
	if err != nil {
		return nil
	}
	var a Assessment
	if json.Unmarshal(b, &a) != nil {
		return nil
	}
	return &a
}
func responseStrings(r AssessmentRequirement, response StructuredResponse) ([]string, error) {
	out := []string{}
	for _, f := range r.Fields {
		s, ok := response[f].(string)
		if !ok {
			return nil, errors.New("Expected a typed answer")
		}
		out = append(out, s)
	}
	return out, nil
}
func jsonParams(r AssessmentRequirement, v any) error {
	if len(r.Params) == 0 {
		return errors.New("Missing validator parameters")
	}
	return json.Unmarshal(r.Params, v)
}
func stringSet(xs []string) []string {
	ys := append([]string{}, xs...)
	sort.Strings(ys)
	out := []string{}
	for _, s := range ys {
		if len(out) == 0 || out[len(out)-1] != s {
			out = append(out, s)
		}
	}
	return out
}
func normalizedTerm(s string, sensitive bool) string {
	s = strings.Join(strings.Fields(s), " ")
	if !sensitive {
		s = strings.ToLower(s)
	}
	return s
}

func validateRequirement(r AssessmentRequirement, fields map[string]answerField) error {
	switch r.Validator {
	case "boolean":
		var p struct {
			Expected []bool `json:"expected"`
		}
		if jsonParams(r, &p) != nil || len(p.Expected) != len(r.Fields) {
			return errors.New("Invalid boolean parameters")
		}
	case "term":
		var p struct {
			Accepted []string `json:"accepted"`
		}
		if jsonParams(r, &p) != nil || len(p.Accepted) == 0 || len(r.Fields) != 1 {
			return errors.New("Invalid term parameters")
		}
	case "selection":
		var p struct {
			Expected []string `json:"expected"`
		}
		if jsonParams(r, &p) != nil || p.Expected == nil || len(r.Fields) != 1 {
			return errors.New("Invalid selection parameters")
		}
	case "exact", "tuple":
		var p struct {
			Expected []string `json:"expected"`
		}
		if jsonParams(r, &p) != nil || len(p.Expected) == 0 || (r.Validator == "exact" && len(p.Expected) != len(r.Fields)) || (r.Validator == "tuple" && len(r.Fields) != 1) {
			return errors.New("Invalid exact parameters")
		}
		for _, v := range p.Expected {
			if _, e := parseExact(v); e != nil {
				return e
			}
		}
	case "matrix":
		var p struct {
			Expected [][]string `json:"expected"`
		}
		if jsonParams(r, &p) != nil || len(p.Expected) == 0 || len(p.Expected[0]) == 0 {
			return errors.New("Invalid matrix parameters")
		}
		for _, row := range p.Expected {
			if len(row) != len(p.Expected[0]) {
				return errors.New("Invalid matrix shape")
			}
			for _, v := range row {
				if _, e := parseExact(v); e != nil {
					return e
				}
			}
		}
		if len(r.Fields) != 1 && len(r.Fields) != len(p.Expected)*len(p.Expected[0]) {
			return errors.New("Invalid matrix field count")
		}
	case "boolean-formula":
		var p struct {
			Expected  string   `json:"expected"`
			Variables []string `json:"variables"`
			Form      string   `json:"form"`
			Structure string   `json:"structure"`
		}
		if jsonParams(r, &p) != nil || len(r.Fields) != 1 || len(p.Variables) > 8 || len(p.Variables) == 0 || !enum(p.Form, "", "nnf", "no-implication", "contrapositive") {
			return errors.New("Invalid formula parameters")
		}
		if _, err := parseBoolean(p.Expected, p.Variables); err != nil {
			return err
		}
		if p.Form == "contrapositive" && p.Structure == "" {
			return errors.New("Contrapositive needs a structural target")
		}
		if p.Structure != "" {
			if _, err := parseBoolean(p.Structure, p.Variables); err != nil {
				return err
			}
		}
	case "expression":
		var p expressionParams
		if jsonParams(r, &p) != nil || len(r.Fields) != 1 || len(p.Variables) > 8 {
			return errors.New("Invalid expression parameters")
		}
		if p.extended() {
			_, err := extendedExpressionEquivalent(p.Expected, p.Expected, p)
			return err
		}
		if _, err := parsePolynomial(p.Expected, p.Variables); err != nil {
			return err
		}
	case "linear":
		return validateLinear(r)
	case "quantified-formula":
		var p quantifiedParams
		if jsonParams(r, &p) != nil || len(r.Fields) != 1 || len(p.Domains) == 0 || !enum(p.Form, "", "nnf") {
			return errors.New("Invalid quantified formula parameters")
		}
		if _, e := parseQuantified(p.Expected, p.Domains, p.Predicates); e != nil {
			return e
		}
	case "inequality":
		var p struct {
			Expected string `json:"expected"`
			Variable string `json:"variable"`
		}
		if jsonParams(r, &p) != nil || len(r.Fields) != 1 || p.Variable == "" {
			return errors.New("Invalid inequality parameters")
		}
		if _, e := inequalityEquivalent(p.Expected, p.Expected, p.Variable); e != nil {
			return e
		}
	case "set":
		var p struct {
			Expected []string `json:"expected"`
		}
		if jsonParams(r, &p) != nil || p.Expected == nil || len(r.Fields) != 1 {
			return errors.New("Invalid finite set parameters")
		}

	case "boolean-model":
		var p booleanModelParams
		if jsonParams(r, &p) != nil || len(p.Variables) == 0 || len(p.Variables) > 8 {
			return errors.New("Invalid Boolean model")
		}
		vars := []string{}
		for v, f := range p.Variables {
			if fields[f].kind != "boolean" {
				return errors.New("Boolean model needs truth fields")
			}
			vars = append(vars, v)
		}
		for _, c := range p.Conditions {
			if _, e := parseBoolean(c.Formula, vars); e != nil {
				return e
			}
		}
		for f, s := range p.Checks {
			if fields[f].kind != "boolean" {
				return errors.New("Unknown Boolean model field")
			}
			if _, e := parseBoolean(s, vars); e != nil {
				return e
			}
		}

	case "witness":
		var p witnessParams
		if jsonParams(r, &p) != nil || len(p.Variables) == 0 || len(p.Conditions) == 0 {
			return errors.New("Invalid witness definition")
		}
		vars := []string{}
		for _, v := range p.Variables {
			if v.Name == "" || fields[v.Field].id == "" {
				return errors.New("Invalid witness variable")
			}
			vars = append(vars, v.Name)
		}
		for _, c := range p.Conditions {
			if !enum(c.Op, "=", "!=", "<", "<=", ">", ">=", "divides", "not-divides") {
				return errors.New("Unknown witness comparison")
			}
			if _, e := parsePolynomial(c.Left, vars); e != nil {
				return e
			}
			if _, e := parsePolynomial(c.Right, vars); e != nil {
				return e
			}
		}
	case "interval":
		var p struct {
			Lower       string `json:"lower"`
			Upper       string `json:"upper"`
			LeftClosed  *bool  `json:"leftClosed"`
			RightClosed *bool  `json:"rightClosed"`
		}
		if jsonParams(r, &p) != nil || len(r.Fields) != 4 || p.Lower == "" || p.Upper == "" || p.LeftClosed == nil || p.RightClosed == nil {
			return errors.New("Invalid interval definition")
		}

	default:
		return errors.New("Unsupported deterministic validator: " + r.Validator)
	}
	return nil
}
func checkRequirement(r AssessmentRequirement, response StructuredResponse) (bool, error) {
	switch r.Validator {
	case "boolean":
		var p struct {
			Expected []bool `json:"expected"`
		}
		jsonParams(r, &p)
		for i, f := range r.Fields {
			v, ok := response[f].(bool)
			if !ok {
				return false, errors.New("Expected true or false")
			}
			if v != p.Expected[i] {
				return false, nil
			}
		}
		return true, nil
	case "term":
		var p struct {
			Accepted      []string `json:"accepted"`
			CaseSensitive bool     `json:"caseSensitive"`
		}
		jsonParams(r, &p)
		xs, e := responseStrings(r, response)
		if e != nil {
			return false, e
		}
		for _, s := range p.Accepted {
			if normalizedTerm(s, p.CaseSensitive) == normalizedTerm(xs[0], p.CaseSensitive) {
				return true, nil
			}
		}
		return false, nil
	case "selection":
		var p struct {
			Expected []string `json:"expected"`
		}
		jsonParams(r, &p)
		xs := []string{}
		for _, f := range r.Fields {
			switch v := response[f].(type) {
			case string:
				xs = append(xs, v)
			case []string:
				xs = append(xs, v...)
			case []any:
				for _, s := range v {
					xs = append(xs, s.(string))
				}
			default:
				return false, errors.New("Expected a selection")
			}
		}
		return reflect.DeepEqual(stringSet(xs), stringSet(p.Expected)), nil
	case "exact", "tuple", "matrix":
		return checkExactRequirement(r, response)
	case "boolean-formula":
		return checkBooleanRequirement(r, response)
	case "boolean-model":
		return booleanModel(r, response)
	case "linear":
		return checkLinear(r, response)
	case "quantified-formula":
		return checkQuantified(r, response)
	case "set":
		return checkSet(r, response)
	case "inequality":
		var p struct {
			Expected string `json:"expected"`
			Variable string `json:"variable"`
		}
		jsonParams(r, &p)
		xs, e := responseStrings(r, response)
		if e != nil {
			return false, e
		}
		return inequalityEquivalent(xs[0], p.Expected, p.Variable)
	case "witness":
		return checkWitness(r, response)
	case "interval":
		return checkInterval(r, response)
	case "expression":
		var p expressionParams
		jsonParams(r, &p)
		xs, e := responseStrings(r, response)
		if e != nil {
			return false, e
		}
		if p.extended() {
			return extendedExpressionEquivalent(xs[0], p.Expected, p)
		}
		actual, e := parsePolynomial(xs[0], p.Variables)
		if e != nil {
			return false, e
		}
		expected, e := parsePolynomial(p.Expected, p.Variables)
		if e != nil {
			return false, e
		}
		if !actual.equal(expected) {
			return false, nil
		}
		var restrictions struct {
			Domain []string `json:"domain"`
		}
		jsonParams(r, &restrictions)
		domain := []rationalPoly{}
		for _, s := range restrictions.Domain {
			v, e := parsePolynomial(s, p.Variables)
			if e != nil {
				return false, e
			}
			domain = append(domain, v)
		}
		return samePolynomialDomain(actual, expected, domain)
	}
	return false, errors.New("Unsupported deterministic validator")
}

func contextHasDeterministic(raw string) bool {
	var c struct {
		Choice     json.RawMessage `json:"choice"`
		Assessment json.RawMessage `json:"assessment"`
	}
	if json.Unmarshal([]byte(raw), &c) != nil {
		return false
	}
	return len(c.Choice) > 0 && string(c.Choice) != "null" || len(c.Assessment) > 0 && string(c.Assessment) != "null"
}

func jsonEquivalent(a, b []byte) bool {
	var x, y any
	return json.Unmarshal(a, &x) == nil && json.Unmarshal(b, &y) == nil && reflect.DeepEqual(x, y)
}
func validateCatalogAssessments(c Catalog) error {
	validate := func(raw json.RawMessage) error {
		var v struct {
			Assessment *Assessment       `json:"assessment"`
			Choice     *ChoiceAssessment `json:"choice"`
		}
		if e := json.Unmarshal(raw, &v); e != nil {
			return e
		}
		if v.Assessment == nil {
			return nil
		}
		if v.Choice != nil {
			return errors.New("Conflicting deterministic assessment definitions")
		}
		return validateAssessment(v.Assessment)
	}
	for id, raw := range c.Exercises {
		if e := validate(raw); e != nil {
			return fmt.Errorf("Exercise %s: %w", id, e)
		}
	}
	for _, t := range c.ReviewTemplates {
		for _, q := range append([]map[string]any{t.Question}, t.Variants...) {
			raw, _ := json.Marshal(q)
			if e := validate(raw); e != nil {
				return fmt.Errorf("Review template %s: %w", t.ID, e)
			}
		}
	}
	return nil
}
