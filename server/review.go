package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"time"
)

// Review observations remain immutable attempts. These mutable projections can
// always be replayed, including after a grading correction or historical import.
const reviewDay int64 = 24 * 60 * 60 * 1000
const reviewInitialDays = 6.0
const reviewMaximumDays = 180.0

type ReviewTarget struct {
	Concept   string `json:"concept"`
	Skill     string `json:"skill"`
	Objective string `json:"objective,omitempty"`
}

func (t ReviewTarget) key() string { return t.Concept + ":" + t.Skill + ":" + t.Objective }

type ReviewContext struct {
	PreviousEvidenceAt *int64 `json:"previousEvidenceAt,omitempty"`
	ReviewTarget
	InstanceID       string         `json:"instanceId"`
	Kind             string         `json:"kind"`
	TemplateID       string         `json:"templateId"`
	ScheduledFor     int64          `json:"scheduledFor"`
	PresentedAt      int64          `json:"presentedAt"`
	PreviousReviewAt *int64         `json:"previousReviewAt,omitempty"`
	IntervalDays     float64        `json:"intervalDays"`
	Seed             string         `json:"seed,omitempty"`
	Parameters       map[string]int `json:"parameters,omitempty"`
}
type ReviewVariantSelection struct {
	HashBytes          []int `json:"hashBytes"`
	Moduli             []int `json:"moduli"`
	ChoiceRotationByte *int  `json:"choiceRotationByte,omitempty"`
}
type ReviewVariant struct {
	ID         string         `json:"id"`
	Parameters map[string]int `json:"parameters"`
	Question   map[string]any `json:"question"`
}
type ReviewVariantBank struct {
	Selection ReviewVariantSelection `json:"selection"`
	Variants  []ReviewVariant        `json:"variants"`
}
type ReviewTemplate struct {
	ParameterVariants *ReviewVariantBank `json:"-"`
	SourceTarget      string             `json:"sourceTarget,omitempty"`
	ReviewTarget
	ID                 string           `json:"id"`
	Family             string           `json:"family"`
	Lesson             string           `json:"lesson"`
	EvidenceLevel      string           `json:"evidenceLevel"`
	CognitiveLevel     string           `json:"cognitiveLevel"`
	InteractionCost    string           `json:"interactionCost"`
	InputCapabilities  []string         `json:"inputCapabilities"`
	ActivationConcepts []string         `json:"activationConcepts,omitempty"`
	Question           map[string]any   `json:"question"`
	Variants           []map[string]any `json:"variants,omitempty"`
	Generator          string           `json:"generator,omitempty"`
	Analytics          json.RawMessage  `json:"analytics,omitempty"`
	Teaching           json.RawMessage  `json:"-"`
}
type ReviewState struct {
	LastEvidenceAt *int64 `json:"lastEvidenceAt,omitempty"`
	ReviewTarget
	ID                          string  `json:"id"`
	DueAt                       int64   `json:"dueAt"`
	ActivatedAt                 int64   `json:"activatedAt"`
	IntervalDays                float64 `json:"intervalDays"`
	LastReviewedAt              *int64  `json:"lastReviewedAt,omitempty"`
	ConsecutiveDelayedSuccesses int     `json:"consecutiveDelayedSuccesses"`
	Reason                      string  `json:"reason"`
	EvidenceLevel               string  `json:"evidenceLevel"`
	Quick                       bool    `json:"quick"`
}
type ReviewInstance struct {
	EvidenceLevel     string          `json:"evidenceLevel"`
	CognitiveLevel    string          `json:"cognitiveLevel"`
	InteractionCost   string          `json:"interactionCost"`
	InputCapabilities []string        `json:"inputCapabilities"`
	SourceTarget      string          `json:"sourceTarget,omitempty"`
	ID                string          `json:"id"`
	Exercise          string          `json:"exercise"`
	Lesson            string          `json:"lesson"`
	Question          map[string]any  `json:"question"`
	Context           ReviewContext   `json:"context"`
	Analytics         json.RawMessage `json:"analytics,omitempty"`
	ContentVersion    string          `json:"contentVersion"`
	Teaching          json.RawMessage `json:"teaching"`
}
type ReviewSessionRequest struct {
	Kind    string `json:"kind"`
	Mode    string `json:"mode"`
	Lesson  string `json:"lesson,omitempty"`
	Concept string `json:"concept,omitempty"`
	Skill   string `json:"skill,omitempty"`
}
type ReviewSession struct {
	ID        string           `json:"id"`
	Kind      string           `json:"kind"`
	Mode      string           `json:"mode"`
	Instances []ReviewInstance `json:"instances"`
}
type reviewAnalytics struct {
	Concepts []struct {
		Concept string
		Role    string
	} `json:"concepts"`
	Skills []struct {
		Skill string
		Role  string
	} `json:"skills"`
	ConceptDefinitions []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"conceptDefinitions"`
	SkillDefinitions []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"skillDefinitions"`
}

func skillDepth(skill string) string {
	if enum(skill, "prove", "justify", "explain", "reason", "evaluate") {
		return "reasoning"
	}
	if enum(skill, "recognize", "identify", "interpret", "recall") {
		return "recognition"
	}
	return "production"
}
func depth(level string) int {
	switch level {
	case "reasoning":
		return 3
	case "production":
		return 2
	default:
		return 1
	}
}
func (t ReviewTemplate) questionEvidence(q map[string]any) AssessmentEvidence {
	if a := assessmentFromQuestion(q); a != nil {
		return a.Evidence
	}
	if q["choice"] != nil {
		return AssessmentEvidence{Level: "recognition", InteractionCost: "low", InputCapabilities: []string{"tap"}}
	}
	return AssessmentEvidence{Level: t.EvidenceLevel, InteractionCost: t.InteractionCost, InputCapabilities: t.InputCapabilities}
}
func quickEvidence(e AssessmentEvidence) bool {
	if e.InteractionCost != "low" || len(e.InputCapabilities) == 0 {
		return false
	}
	for _, c := range e.InputCapabilities {
		if c != "tap" && c != "short-text" {
			return false
		}
	}
	return true
}
func (t ReviewTemplate) quick() bool {
	questions := t.Variants
	if len(questions) == 0 {
		questions = []map[string]any{t.Question}
	}
	for _, q := range questions {
		e := t.questionEvidence(q)
		if depth(e.Level) < depth(t.EvidenceLevel) || !quickEvidence(e) {
			return false
		}
	}
	return len(questions) > 0
}

func (t ReviewTemplate) sourceTarget() string {
	if t.SourceTarget != "" {
		return t.SourceTarget
	}
	return "review:" + t.ID
}
func (g *Grading) reviewTemplates() []ReviewTemplate {
	result := append([]ReviewTemplate{}, g.catalog.ReviewTemplates...)
	for i, t := range result {
		if bank, ok := g.catalog.ReviewVariants[t.ID]; ok {
			result[i].ParameterVariants = &bank
		}
		questions := t.Variants
		if len(questions) == 0 {
			questions = []map[string]any{t.Question}
		}
		changed := false
		cost := 0
		caps := map[string]bool{}
		for _, q := range questions {
			changed = changed || assessmentFromQuestion(q) != nil
			e := t.questionEvidence(q)
			cost = max(cost, map[string]int{"low": 1, "medium": 2, "high": 3}[e.InteractionCost])
			for _, c := range e.InputCapabilities {
				caps[c] = true
			}
		}
		if changed {
			result[i].InteractionCost = []string{"high", "low", "medium", "high"}[cost]
			result[i].InputCapabilities = nil
			for c := range caps {
				result[i].InputCapabilities = append(result[i].InputCapabilities, c)
			}
			sort.Strings(result[i].InputCapabilities)
		}
	}
	keys := []string{}
	for key := range g.catalog.Exercises {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		raw := g.catalog.Exercises[key]
		var item struct {
			Lesson     string
			LessonSlug string
			Question   map[string]any
			Choice     *ChoiceAssessment
			Assessment *Assessment
			Analytics  json.RawMessage
		}
		if json.Unmarshal(raw, &item) != nil {
			continue
		}
		var a reviewAnalytics
		json.Unmarshal(item.Analytics, &a)
		for _, c := range a.Concepts {
			if c.Role != "primary" {
				continue
			}
			for _, s := range a.Skills {
				if s.Role != "primary" {
					continue
				}
				level := skillDepth(s.Skill)
				if s.Skill == "recall" && item.Choice == nil {
					level = "production"
				}
				if item.Assessment != nil {
					if depth(item.Assessment.Evidence.Level) < depth(level) {
						continue
					}
					level = item.Assessment.Evidence.Level
				}
				// A choice tagged with a constructive skill cannot certify production.
				if item.Choice != nil && level != "recognition" {
					continue
				}
				q := map[string]any{}
				for k, v := range item.Question {
					q[k] = v
				}
				q["id"] = 1
				q["section"] = "review"
				q["answer"] = q["officialAnswer"]
				delete(q, "officialAnswer")
				cost := "high"
				caps := []string{"math-text", "handwriting", "photo"}
				if item.Choice != nil {
					q["choice"] = item.Choice
					cost = "low"
					caps = []string{"tap"}
				}
				if item.Assessment != nil {
					q["assessment"] = item.Assessment
					cost = item.Assessment.Evidence.InteractionCost
					caps = item.Assessment.Evidence.InputCapabilities
				}
				lesson := item.LessonSlug
				if lesson == "" {
					// Older catalogs retain only the stable exercise namespace.
					lesson = key
					if i := strings.LastIndex(key, "-"); i >= 0 {
						lesson = key[:i]
					}
				}
				result = append(result, ReviewTemplate{ReviewTarget: ReviewTarget{Concept: c.Concept, Skill: s.Skill}, ID: "exercise-" + key + "-" + c.Concept + "-" + s.Skill, Family: "fixed", SourceTarget: "exercise:" + key, Lesson: lesson, EvidenceLevel: level, CognitiveLevel: s.Skill, InteractionCost: cost, InputCapabilities: caps, Question: q, Analytics: item.Analytics, Teaching: raw})
			}
		}
	}
	// One target has one required depth; lighter representations must use a
	// distinct objective if they are meant to remain independently reviewable.
	required := map[string]int{}
	for _, t := range result {
		required[t.key()] = max(required[t.key()], depth(t.EvidenceLevel))
	}
	compatible := result[:0]
	for _, t := range result {
		if depth(t.EvidenceLevel) >= required[t.key()] {
			compatible = append(compatible, t)
		}
	}
	result = compatible
	sort.Slice(result, func(i, j int) bool { return result[i].ID < result[j].ID })
	return result
}
func reviewPut(tx *sql.Tx, key string, v any) error {
	payload, e := json.Marshal(v)
	if e != nil {
		return e
	}
	var prior string
	if tx.QueryRow("SELECT payload FROM versions JOIN records ON versions.id=records.head WHERE records.key=?", key).Scan(&prior) == nil && prior == string(payload) {
		return nil
	}
	id := newID()
	if _, e = tx.Exec("INSERT INTO versions(id,key,payload,device,updated,retained) VALUES(?,?,?,?,?,0)", id, key, string(payload), "Review", time.Now().UnixMilli()); e != nil {
		return e
	}
	res, e := tx.Exec("INSERT INTO changes(key) VALUES(?)", key)
	if e != nil {
		return e
	}
	seq, _ := res.LastInsertId()
	if _, e = tx.Exec("INSERT INTO records VALUES(?,?,?,'[]') ON CONFLICT(key) DO UPDATE SET revision=excluded.revision,head=excluded.head", key, seq, id); e != nil {
		return e
	}
	_, e = tx.Exec("DELETE FROM versions WHERE key=? AND id<>?", key, id)
	return e
}
func reviewLoad(q querier, key string, v any) error {
	var raw string
	if e := q.QueryRow("SELECT payload FROM versions JOIN records ON versions.id=records.head WHERE records.key=?", key).Scan(&raw); e != nil {
		return e
	}
	return json.Unmarshal([]byte(raw), v)
}

type reviewSignal struct {
	Correct, Unsure, Assisted, Clerical bool
	Errors                              int
	Kind                                string
	Delayed                             bool
}

func scheduleReview(s ReviewState, signal reviewSignal, at int64) ReviewState {
	days := reviewInitialDays
	reason := "Clean success; check retention after six days"
	switch {
	case signal.Assisted:
		days = 1
		reason = "Answer revealed or copied; retrieve independently tomorrow"
	case !signal.Correct && !signal.Clerical:
		days = 1
		reason = "Substantive error; revisit tomorrow"
	case signal.Errors > 1:
		days = 1
		reason = "Multiple substantive errors; revisit tomorrow"
	case signal.Errors == 1:
		days = 2
		reason = "Correction after a substantive error; revisit in two days"
	case signal.Unsure:
		days = 3
		reason = "Correct but unsure; revisit in three days"
	case signal.Clerical:
		reason = "Clerical or prompt-compliance issue; retain the normal interval"
	}
	if signal.Delayed && signal.Correct && !signal.Assisted && signal.Errors == 0 {
		// Only explicitly scheduled review is eligible for cold-retrieval weighting.
		// Lesson/legacy attempts may be deliberately selected or primed, like
		// focused practice; missing context must not imply a scheduled review.
		factor := 1.25
		if signal.Kind == "scheduled-review" {
			factor = 2.0
		}
		if signal.Unsure {
			factor = 1.2
		}
		days = max(days, s.IntervalDays*factor)
		s.ConsecutiveDelayedSuccesses++
		reason = "Successful delayed retrieval; interval expanded"
	} else if (!signal.Correct && !signal.Clerical) || signal.Assisted {
		s.ConsecutiveDelayedSuccesses = 0
	}
	if signal.Clerical {
		days = max(days, s.IntervalDays)
	}
	days = min(days, reviewMaximumDays)
	s.IntervalDays = days
	s.DueAt = at + int64(days*float64(reviewDay))
	s.LastEvidenceAt = &at
	if enum(signal.Kind, "scheduled-review", "focused-practice") {
		s.LastReviewedAt = &at
	}
	s.Reason = reason
	return s
}
func substantive(a Attempt) bool {
	if a.Verdict != "incorrect" {
		return false
	}
	if len(a.Grades) == 0 {
		return true
	}
	ds := a.Grades[len(a.Grades)-1].Diagnosis
	if len(ds) == 0 {
		return true
	}
	for _, d := range ds {
		if !enum(d.Class, "clerical", "prompt-compliance", "technical") {
			return true
		}
	}
	return false
}

// Replay only structured active evidence. Passive exposure records are never read.
func (g *Grading) reviewStates(tx *sql.Tx, templates []ReviewTemplate) (map[string]ReviewState, error) {
	states := map[string]ReviewState{}
	previous := map[string]ReviewState{}
	rows, e := tx.Query("SELECT payload FROM versions JOIN records ON versions.id=records.head WHERE records.key LIKE 'review-state/%'")
	if e != nil {
		return nil, e
	}
	for rows.Next() {
		var raw string
		if e = rows.Scan(&raw); e != nil {
			rows.Close()
			return nil, e
		}
		var state ReviewState
		if json.Unmarshal([]byte(raw), &state) == nil {
			previous[state.key()] = state
		}
	}
	e = rows.Err()
	rows.Close()
	if e != nil {
		return nil, e
	}
	required := func(t ReviewTemplate) int { return max(depth(t.EvidenceLevel), depth(previous[t.key()].EvidenceLevel)) }
	byTarget := map[string][]ReviewTemplate{}
	for _, t := range templates {
		byTarget[t.key()] = append(byTarget[t.key()], t)
	}
	activate := func(t ReviewTemplate, at int64) {
		key := t.key()
		s, ok := states[key]
		if !ok {
			s = ReviewState{ReviewTarget: t.ReviewTarget, ID: key, ActivatedAt: at, DueAt: at, Reason: "Active practice requested", EvidenceLevel: t.EvidenceLevel}
			if required(t) > depth(t.EvidenceLevel) {
				s.EvidenceLevel = previous[key].EvidenceLevel
			}
		}
		if at < s.ActivatedAt {
			s.ActivatedAt = at
			if s.LastEvidenceAt == nil {
				s.DueAt = at
			}
		}
		s.Quick = s.Quick || t.quick()
		states[key] = s
	}
	rows, e = tx.Query("SELECT payload FROM versions JOIN records ON versions.id=records.head WHERE records.key LIKE 'review-activation/%'")
	if e != nil {
		return nil, e
	}
	for rows.Next() {
		var raw string
		rows.Scan(&raw)
		var v struct {
			Target ReviewTarget
			At     int64
		}
		if json.Unmarshal([]byte(raw), &v) == nil {
			for _, t := range byTarget[v.Target.key()] {
				activate(t, v.At)
			}
		}
	}
	e = rows.Err()
	rows.Close()
	if e != nil {
		return nil, e
	}
	rows, e = tx.Query("SELECT id FROM attempts ORDER BY submitted,id")
	if e != nil {
		return nil, e
	}
	ids := []string{}
	for rows.Next() {
		var id string
		rows.Scan(&id)
		ids = append(ids, id)
	}
	e = rows.Err()
	rows.Close()
	if e != nil {
		return nil, e
	}
	errorsByExercise := map[string]int{}
	for _, id := range ids {
		a, e := loadAttempt(tx, id)
		if e != nil {
			return nil, e
		}
		var meta reviewAnalytics
		json.Unmarshal(a.Analytics, &meta)
		var observed []ReviewTemplate
		observedDepth := 3
		if a.Mode == "choice" {
			observedDepth = 1
		}
		if a.Mode == "structured" {
			observedDepth = 0
			if a.Presentation != nil && a.Presentation.Assessment != nil {
				observedDepth = depth(a.Presentation.Assessment.Evidence.Level)
			}
		}
		if a.Review != nil {
			observedDepth = 0
			var instance ReviewInstance
			if reviewLoad(tx, "review-instance/"+a.Review.InstanceID, &instance) == nil && instance.EvidenceLevel != "" {
				observedDepth = depth(instance.EvidenceLevel)
			}
			for _, t := range byTarget[a.Review.key()] {
				if required(t) <= observedDepth {
					observed = append(observed, t)
				}
			}
		}
		for _, t := range templates {
			matched := false
			for _, c := range meta.Concepts {
				if c.Role == "primary" && (c.Concept == t.Concept || contains(t.ActivationConcepts, c.Concept)) {
					matched = true
				}
			}
			if !matched {
				continue
			}
			if t.Objective != "" {
				activate(t, a.Submitted)
				continue
			}
			for _, sk := range meta.Skills {
				if sk.Role == "primary" && sk.Skill == t.Skill {
					activate(t, a.Submitted)
					if required(t) <= observedDepth {
						observed = append(observed, t)
					}
					break
				}
			}
		}
		seen := map[string]bool{}
		for _, t := range observed {
			if seen[t.key()] {
				continue
			}
			seen[t.key()] = true
			activate(t, a.Submitted)
			s := states[t.key()]
			if a.Verdict != "correct" && a.Verdict != "incorrect" {
				continue
			}
			delayed := s.LastEvidenceAt != nil && a.Submitted-*s.LastEvidenceAt >= reviewDay && a.Submitted >= s.DueAt
			kind := "lesson"
			if a.Review != nil {
				kind = a.Review.Kind
				if a.Review.PreviousEvidenceAt != nil && a.Review.PresentedAt-*a.Review.PreviousEvidenceAt < reviewDay {
					delayed = false
				}
			}
			signal := reviewSignal{Correct: a.Verdict == "correct", Unsure: a.Unsure != nil && *a.Unsure, Assisted: a.Revealed || (a.Assistance != nil && (a.Assistance.AnswerPreviouslyRevealed || a.Assistance.CopiedFromRetry)), Clerical: a.Verdict == "incorrect" && !substantive(a), Errors: errorsByExercise[a.Exercise], Kind: kind, Delayed: delayed}
			// Early massed practice never postpones an established due date. Failures still shorten it.
			next := scheduleReview(s, signal, a.Submitted)
			if s.LastEvidenceAt != nil && !delayed && a.Review != nil && a.Review.PresentedAt > s.ActivatedAt && next.DueAt > s.DueAt {
				next.DueAt = s.DueAt
				next.IntervalDays = s.IntervalDays
				next.Reason = s.Reason
			}
			states[t.key()] = next
		}
		if substantive(a) {
			errorsByExercise[a.Exercise]++
		} else if a.Verdict == "correct" {
			// This success still includes the errors from its correction episode
			// above. Later attempts start fresh; ungraded work never ends an episode.
			delete(errorsByExercise, a.Exercise)
		}
	}
	for key, s := range previous {
		if _, ok := states[key]; !ok && len(byTarget[key]) == 0 {
			s.Quick = false
			s.Reason = "Deeper retrieval remains due; no compatible question is available"
			states[key] = s
		}
	}
	for key, s := range states {
		s.Quick = false
		compatible := false
		for _, t := range byTarget[key] {
			questions := t.Variants
			if len(questions) == 0 {
				questions = []map[string]any{t.Question}
			}
			for _, q := range questions {
				if depth(t.questionEvidence(q).Level) >= required(t) {
					compatible = true
				}
			}
			if depth(t.EvidenceLevel) >= required(t) {
				s.Quick = s.Quick || t.quick()
			}
		}
		if !compatible {
			if old, ok := previous[key]; ok {
				s = old
			}
			s.Quick = false
			s.Reason = "Deeper retrieval remains due; no compatible question is available"
		}
		states[key] = s
		if e := reviewPut(tx, "review-state/"+key, s); e != nil {
			return nil, e
		}
	}
	return states, nil
}
func contains(values []string, v string) bool {
	for _, x := range values {
		if x == v {
			return true
		}
	}
	return false
}

// instantiateReviewQuestion is shared by issued learner instances and read-only
// catalog previews. Selection of complete authored variants needs no learner state.
func instantiateReviewQuestion(t ReviewTemplate, seed string) (map[string]any, map[string]int) {
	hash := sha256.Sum256([]byte(seed))
	q := t.Question
	var params map[string]int
	if len(t.Variants) > 0 {
		q = t.Variants[int(hash[0])%len(t.Variants)]
	}
	if t.ParameterVariants != nil {
		bank := t.ParameterVariants
		index := 0
		for i, modulus := range bank.Selection.Moduli {
			index = index*modulus + int(hash[bank.Selection.HashBytes[i]])%modulus
		}
		variant := bank.Variants[index]
		q = variant.Question
		params = make(map[string]int, len(variant.Parameters))
		for key, value := range variant.Parameters {
			params[key] = value
		}
	}
	// Clone the complete authored question before rotating display positions;
	// frozen instances never share mutable maps with the canonical catalog.
	raw, _ := json.Marshal(q)
	var question map[string]any
	json.Unmarshal(raw, &question)
	if t.ParameterVariants != nil && t.ParameterVariants.Selection.ChoiceRotationByte != nil {
		if choice, ok := question["choice"].(map[string]any); ok {
			if options, ok := choice["options"].([]any); ok && len(options) > 1 {
				offset := int(hash[*t.ParameterVariants.Selection.ChoiceRotationByte]) % len(options)
				choice["options"] = append(append([]any{}, options[offset:]...), options[:offset]...)
			}
		}
	}
	return question, params
}
func instantiateReview(t ReviewTemplate, s ReviewState, kind, id, seed, version string, now int64) ReviewInstance {
	question, params := instantiateReviewQuestion(t, seed)
	context := ReviewContext{PreviousEvidenceAt: s.LastEvidenceAt, ReviewTarget: t.ReviewTarget, InstanceID: id, Kind: kind, TemplateID: t.ID, ScheduledFor: s.DueAt, PresentedAt: now, PreviousReviewAt: s.LastReviewedAt, IntervalDays: s.IntervalDays, Seed: seed, Parameters: params}
	teaching := map[string]any{}
	json.Unmarshal(t.Teaching, &teaching)
	gradingQuestion := map[string]any{}
	for k, v := range question {
		gradingQuestion[k] = v
	}
	gradingQuestion["officialAnswer"] = question["answer"]
	teaching["question"] = gradingQuestion
	teaching["choice"] = question["choice"]
	if question["assessment"] != nil {
		teaching["assessment"] = question["assessment"]
	} else {
		delete(teaching, "assessment")
	}
	if assessment := assessmentFromQuestion(question); assessment != nil {
		t.EvidenceLevel = assessment.Evidence.Level
		t.InteractionCost = assessment.Evidence.InteractionCost
		t.InputCapabilities = assessment.Evidence.InputCapabilities
	}
	teaching["analytics"] = t.Analytics
	teachingRaw, _ := json.Marshal(teaching)
	return ReviewInstance{EvidenceLevel: t.EvidenceLevel, CognitiveLevel: t.CognitiveLevel, InteractionCost: t.InteractionCost, InputCapabilities: t.InputCapabilities, SourceTarget: t.sourceTarget(), ID: id, Exercise: "review-" + id, Lesson: t.Lesson, Question: question, Context: context, Analytics: t.Analytics, ContentVersion: version, Teaching: teachingRaw}
}

var reviewReferenceLink = regexp.MustCompile(`\[([^\]]+)\]\(ref:[^)]+\)`)

// Compare the task a learner sees, independently of its curriculum tags and
// grading metadata. Option order and internal field IDs do not make a new task.
func reviewQuestionFingerprint(question map[string]any) string {
	var visible func(any) any
	visible = func(value any) any {
		switch v := value.(type) {
		case string:
			return strings.Join(strings.Fields(reviewReferenceLink.ReplaceAllString(v, "$1")), " ")
		case []any:
			result := make([]any, len(v))
			for i, item := range v {
				result[i] = visible(item)
			}
			return result
		case map[string]any:
			result := map[string]any{}
			for key, item := range v {
				if key == "id" || key == "feedback" || key == "correctOption" {
					continue
				}
				result[key] = visible(item)
				if key == "options" {
					if options, ok := result[key].([]any); ok {
						sort.Slice(options, func(i, j int) bool {
							a, _ := json.Marshal(options[i])
							b, _ := json.Marshal(options[j])
							return string(a) < string(b)
						})
					}
				}
			}
			return result
		default:
			return value
		}
	}
	task := map[string]any{}
	for _, key := range []string{"prompt", "instructions", "math", "table", "choice"} {
		if value, ok := question[key]; ok && value != nil && value != "" {
			task[key] = visible(value)
		}
	}
	if assessment, ok := question["assessment"].(map[string]any); ok {
		task["inputs"] = visible(assessment["inputs"])
	}
	data, _ := json.Marshal(task)
	return string(data)
}

func (g *Grading) planReview(req ReviewSessionRequest, now int64) (ReviewSession, error) {
	session := ReviewSession{ID: newID(), Kind: req.Kind, Mode: req.Mode, Instances: []ReviewInstance{}}
	if !enum(req.Kind, "scheduled-review", "focused-practice") || !enum(req.Mode, "regular", "quick") {
		return session, errors.New("Invalid review mode")
	}
	templates := g.reviewTemplates()
	tx, e := g.server.db.Begin()
	if e != nil {
		return session, e
	}
	defer tx.Rollback()
	states, e := g.reviewStates(tx, templates)
	if e != nil {
		return session, e
	}
	grouped := map[string][]ReviewTemplate{}
	for _, t := range templates {
		if req.Lesson != "" && t.Lesson != req.Lesson || req.Concept != "" && t.Concept != req.Concept || req.Skill != "" && t.Skill != req.Skill || req.Mode == "quick" && !t.quick() {
			continue
		}
		s, active := states[t.key()]
		if req.Kind == "scheduled-review" && (!active || s.DueAt > now) {
			continue
		}
		seed := session.ID + ":" + t.key()
		question, _ := instantiateReviewQuestion(t, seed)
		evidence := t.questionEvidence(question)
		required := max(depth(t.EvidenceLevel), depth(s.EvidenceLevel))
		if req.Kind == "scheduled-review" && depth(evidence.Level) < required {
			continue
		}
		if req.Mode == "quick" && !quickEvidence(evidence) {
			continue
		}
		grouped[t.key()] = append(grouped[t.key()], t)
	}
	keys := []string{}
	for k := range grouped {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool {
		a, b := states[keys[i]].DueAt, states[keys[j]].DueAt
		if a != b {
			return a < b
		}
		return keys[i] < keys[j]
	})
	previous := ""
	usedSources := map[string]bool{}
	usedQuestions := map[string]bool{}
	for len(keys) > 0 && len(session.Instances) < 30 {
		pick := 0
		for i, k := range keys {
			if grouped[k][0].Concept != previous {
				pick = i
				break
			}
		}
		key := keys[pick]
		keys = append(keys[:pick], keys[pick+1:]...)
		candidates := grouped[key]
		seed := session.ID + ":" + key
		hash := sha256.Sum256([]byte(seed))
		var t ReviewTemplate
		fingerprint := ""
		for offset := range candidates {
			candidate := candidates[(int(hash[0])+offset)%len(candidates)]
			if usedSources[candidate.sourceTarget()] {
				continue
			}
			question, _ := instantiateReviewQuestion(candidate, seed)
			candidateFingerprint := reviewQuestionFingerprint(question)
			if usedQuestions[candidateFingerprint] {
				continue
			}
			t, fingerprint = candidate, candidateFingerprint
			break
		}
		// A skipped target remains due; selecting a duplicate is not evidence.
		if fingerprint == "" {
			continue
		}
		usedSources[t.sourceTarget()] = true
		usedQuestions[fingerprint] = true
		s, active := states[key]
		if !active {
			s = ReviewState{ReviewTarget: t.ReviewTarget, ID: key, ActivatedAt: now, DueAt: now, Reason: "Active practice requested", Quick: t.quick(), EvidenceLevel: t.EvidenceLevel}
			if e = reviewPut(tx, "review-activation/"+key, map[string]any{"target": t.ReviewTarget, "at": now}); e != nil {
				return session, e
			}
			if e = reviewPut(tx, "review-state/"+key, s); e != nil {
				return session, e
			}
		}
		instance := instantiateReview(t, s, req.Kind, newID(), seed, g.catalog.Version, now)
		session.Instances = append(session.Instances, instance)
		previous = t.Concept
		if e = reviewPut(tx, "review-instance/"+instance.ID, instance); e != nil {
			return session, e
		}
	}
	if e = reviewPut(tx, "review-session/"+session.ID, session); e != nil {
		return session, e
	}
	return session, tx.Commit()
}
func (g *Grading) reviewSummary(now int64) (map[string]any, error) {
	templates := g.reviewTemplates()
	tx, e := g.server.db.Begin()
	if e != nil {
		return nil, e
	}
	defer tx.Rollback()
	states, e := g.reviewStates(tx, templates)
	if e != nil {
		return nil, e
	}
	targets := []ReviewState{}
	due, quick := 0, 0
	for _, s := range states {
		targets = append(targets, s)
		if s.DueAt <= now {
			due++
			if s.Quick {
				quick++
			}
		}
	}
	sort.Slice(targets, func(i, j int) bool {
		if targets[i].DueAt != targets[j].DueAt {
			return targets[i].DueAt < targets[j].DueAt
		}
		return targets[i].ID < targets[j].ID
	})
	concepts, skills, lessons := map[string]string{}, map[string]string{}, map[string]string{}
	for _, t := range templates {
		concepts[t.Concept] = t.Concept
		skills[t.Skill] = t.Skill
		if _, ok := lessons[t.Lesson]; !ok {
			lessons[t.Lesson] = t.Lesson
		}
		var teaching struct{ Lesson string }
		if json.Unmarshal(t.Teaching, &teaching) == nil && teaching.Lesson != "" {
			lessons[t.Lesson] = teaching.Lesson
		}
	}
	for _, t := range templates {
		var a reviewAnalytics
		json.Unmarshal(t.Analytics, &a)
		for _, c := range a.ConceptDefinitions {
			if _, ok := concepts[c.ID]; ok {
				concepts[c.ID] = c.Name
			}
		}
		for _, s := range a.SkillDefinitions {
			if _, ok := skills[s.ID]; ok {
				skills[s.ID] = s.Name
			}
		}
	}
	options := func(m map[string]string, id, name string) []map[string]string {
		keys := []string{}
		for k := range m {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		out := []map[string]string{}
		for _, k := range keys {
			out = append(out, map[string]string{id: k, name: m[k]})
		}
		return out
	}
	result := map[string]any{"due": due, "quick": quick, "deeper": due - quick, "targets": targets, "concepts": options(concepts, "id", "name"), "skills": options(skills, "id", "name"), "lessons": options(lessons, "slug", "title")}
	return result, tx.Commit()
}
func (s *Server) reviewRoutes(mux *http.ServeMux) {
	s.reviewCatalogRoutes(mux)
	mux.HandleFunc("POST /api/v1/review/import", func(w http.ResponseWriter, r *http.Request) {
		if s.grading == nil {
			http.Error(w, "Review unavailable", 503)
			return
		}
		var v ReviewImport
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<20))
		decoder.DisallowUnknownFields()
		if decoder.Decode(&v) != nil {
			http.Error(w, "Invalid review backup", 400)
			return
		}
		if err := s.grading.importReview(v); err != nil {
			http.Error(w, err.Error(), 409)
			return
		}
		writeJSON(w, 200, map[string]bool{"imported": true})
	})
	mux.HandleFunc("GET /api/v1/review", func(w http.ResponseWriter, r *http.Request) {
		if s.grading == nil {
			http.Error(w, "Review unavailable", 503)
			return
		}
		result, e := s.grading.reviewSummary(time.Now().UnixMilli())
		if e != nil {
			http.Error(w, "Review unavailable", 503)
			return
		}
		writeJSON(w, 200, result)
	})
	mux.HandleFunc("POST /api/v1/review/sessions", func(w http.ResponseWriter, r *http.Request) {
		if s.grading == nil {
			http.Error(w, "Review unavailable", 503)
			return
		}
		var req ReviewSessionRequest
		d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8192))
		d.DisallowUnknownFields()
		if d.Decode(&req) != nil {
			http.Error(w, "Invalid session", 400)
			return
		}
		session, e := s.grading.planReview(req, time.Now().UnixMilli())
		if e != nil {
			http.Error(w, e.Error(), 400)
			return
		}
		writeJSON(w, 201, session)
	})
}

// Imports restore observations, never overwrite authoritative server data or
// accept client due dates. Mutable scheduling projections are replayed.
type ReviewImport struct {
	Records  []Record  `json:"records"`
	Attempts []Attempt `json:"attempts"`
}

func (g *Grading) importReview(v ReviewImport) error {
	if len(v.Records) > 10000 || len(v.Attempts) > 50000 {
		return errors.New("Review import too large")
	}
	templates := g.reviewTemplates()
	byID := map[string]ReviewTemplate{}
	for _, t := range templates {
		byID[t.ID] = t
	}
	tx, e := g.server.db.Begin()
	if e != nil {
		return e
	}
	defer tx.Rollback()
	for _, r := range v.Records {
		if !strings.HasPrefix(r.Key, "review-instance/") {
			continue
		}
		var instance ReviewInstance
		if json.Unmarshal(r.Payload, &instance) != nil || instance.ID == "" || !regexpID(instance.ID) || r.Key != "review-instance/"+instance.ID || instance.Exercise != "review-"+instance.ID || instance.Context.InstanceID != instance.ID || !enum(instance.Context.Kind, "focused-practice", "scheduled-review") || instance.Context.PresentedAt <= 0 {
			return errors.New("Invalid imported review instance")
		}
		var existing ReviewInstance
		if reviewLoad(tx, r.Key, &existing) == nil {
			continue
		}
		if instance.Context.IntervalDays < 0 || instance.Context.IntervalDays > reviewMaximumDays || instance.Context.ScheduledFor < 0 || instance.Context.TemplateID == "" || instance.Context.Concept == "" || instance.Context.Skill == "" || !enum(instance.EvidenceLevel, "recognition", "production", "reasoning") {
			return errors.New("Invalid imported instance context")
		}
		if instance.ContentVersion == g.catalog.Version {
			t, ok := byID[instance.Context.TemplateID]
			if !ok || instance.Context.ReviewTarget != t.ReviewTarget {
				return errors.New("Imported review target mismatch")
			}
			state := ReviewState{ReviewTarget: t.ReviewTarget, DueAt: instance.Context.ScheduledFor, IntervalDays: instance.Context.IntervalDays, LastReviewedAt: instance.Context.PreviousReviewAt, LastEvidenceAt: instance.Context.PreviousEvidenceAt}
			rebuilt := instantiateReview(t, state, instance.Context.Kind, instance.ID, instance.Context.Seed, instance.ContentVersion, instance.Context.PresentedAt)
			original, _ := json.Marshal(instance.Question)
			expected, _ := json.Marshal(rebuilt.Question)
			expectedContext, _ := json.Marshal(rebuilt.Context)
			actualContext, _ := json.Marshal(instance.Context)
			if string(original) != string(expected) || string(expectedContext) != string(actualContext) {
				return errors.New("Imported question differs from its reproducible template")
			}
			instance = rebuilt
		} else {
			// An explicit user backup can carry an archived server-issued task. Keep
			// that immutable task rather than fabricating its old question from today.
			var teaching struct {
				Question   map[string]any
				Choice     any
				Assessment *Assessment
				Analytics  json.RawMessage
			}
			if instance.ContentVersion == "" || json.Unmarshal(instance.Teaching, &teaching) != nil || len(teaching.Question) == 0 {
				return errors.New("Missing archived grading context")
			}
			for _, field := range []string{"instructions", "prompt", "math", "table"} {
				x, _ := json.Marshal(instance.Question[field])
				y, _ := json.Marshal(teaching.Question[field])
				if string(x) != string(y) {
					return errors.New("Archived question and grading context disagree")
				}
			}
			answer, _ := json.Marshal(instance.Question["answer"])
			official, _ := json.Marshal(teaching.Question["officialAnswer"])
			choice, _ := json.Marshal(instance.Question["choice"])
			gradingChoice, _ := json.Marshal(teaching.Choice)
			if string(answer) != string(official) || string(choice) != string(gradingChoice) {
				return errors.New("Archived answer and grading context disagree")
			}
			inputAssessment, _ := json.Marshal(instance.Question["assessment"])
			gradingAssessment, _ := json.Marshal(teaching.Assessment)
			if !jsonEquivalent(inputAssessment, gradingAssessment) {
				return errors.New("Archived assessment and grading context disagree")
			}
			if teaching.Assessment != nil {
				if err := validateAssessment(teaching.Assessment); err != nil {
					return err
				}
				evidence := teaching.Assessment.Evidence
				if instance.EvidenceLevel != evidence.Level || instance.InteractionCost != evidence.InteractionCost || strings.Join(instance.InputCapabilities, ",") != strings.Join(evidence.InputCapabilities, ",") {
					return errors.New("Archived assessment evidence disagrees")
				}
			}
			var meta any
			if json.Unmarshal(teaching.Analytics, &meta) != nil {
				return errors.New("Archived analytical evidence missing")
			}
			canonical, _ := json.Marshal(meta)
			meta = nil
			if json.Unmarshal(instance.Analytics, &meta) != nil {
				return errors.New("Archived analytical evidence invalid")
			}
			incoming, _ := json.Marshal(meta)
			if string(canonical) != string(incoming) {
				return errors.New("Archived analytical evidence mismatch")
			}
		}
		if e = reviewPut(tx, r.Key, instance); e != nil {
			return e
		}
	}
	for _, r := range v.Records {
		if strings.HasPrefix(r.Key, "review-activation/") {
			var activation struct {
				Target ReviewTarget `json:"target"`
				At     int64        `json:"at"`
			}
			if json.Unmarshal(r.Payload, &activation) != nil || activation.At <= 0 || r.Key != "review-activation/"+activation.Target.key() {
				return errors.New("Invalid imported activation")
			}
			found := false
			for _, t := range templates {
				found = found || t.ReviewTarget == activation.Target
			}
			if !found {
				continue
			}
			var old any
			if reviewLoad(tx, r.Key, &old) == nil {
				continue
			}
			if e = reviewPut(tx, r.Key, activation); e != nil {
				return e
			}
		}
		if strings.HasPrefix(r.Key, "review-session/") {
			var session ReviewSession
			if json.Unmarshal(r.Payload, &session) != nil || r.Key != "review-session/"+session.ID || !regexpID(session.ID) {
				return errors.New("Invalid imported session")
			}
			var old any
			if reviewLoad(tx, r.Key, &old) == nil {
				continue
			}
			for i, instance := range session.Instances {
				if e = reviewLoad(tx, "review-instance/"+instance.ID, &session.Instances[i]); e != nil {
					return errors.New("Imported session is missing an instance")
				}
			}
			if e = reviewPut(tx, r.Key, session); e != nil {
				return e
			}
		}
	}
	for _, a := range v.Attempts {
		if len(a.ID) < 16 || len(a.ID) > 80 || !regexpID(a.ID) || a.Submitted <= 0 {
			return errors.New("Invalid imported attempt")
		}
		if _, err := loadAttempt(tx, a.ID); err == nil {
			continue
		}
		teaching := g.catalog.Exercises[a.Exercise]
		if a.Review != nil {
			var instance ReviewInstance
			if e = reviewLoad(tx, "review-instance/"+a.Review.InstanceID, &instance); e != nil {
				return errors.New("Imported attempt is missing its review instance")
			}
			expected, _ := json.Marshal(instance.Context)
			received, _ := json.Marshal(a.Review)
			if string(expected) != string(received) || a.Exercise != instance.Exercise || a.ContentVersion != instance.ContentVersion {
				return errors.New("Imported attempt review context mismatch")
			}
			teaching = instance.Teaching
		}
		if len(teaching) == 0 {
			continue
		}
		var context map[string]json.RawMessage
		if e = json.Unmarshal(teaching, &context); e != nil {
			return e
		}
		trustedContext := a.Review != nil || a.ContentVersion == g.catalog.Version
		if !trustedContext {
			if context, e = archivedAttemptContext(a); e != nil {
				return e
			}
		}
		if e = validateImportedDeterministicGrade(a, context, trustedContext); e != nil {
			return e
		}
		if a.Review == nil {
			context["importedHistoricalContext"] = json.RawMessage("true")
		}
		teaching, _ = json.Marshal(context)
		if !enum(a.Status, "graded", "not_graded", "error", "cancelled") {
			continue
		}
		if !enum(a.Verdict, "", "correct", "incorrect", "not_graded") {
			return errors.New("Invalid imported verdict")
		}
		data, _ := json.Marshal(a.Submission)
		grades, _ := json.Marshal(a.Grades)
		if _, e = tx.Exec("INSERT INTO attempts(id,exercise,submitted,data,context,status,verdict,error,grades) VALUES(?,?,?,?,?,?,?,?,?)", a.ID, a.Exercise, a.Submitted, string(data), string(teaching), a.Status, a.Verdict, a.Error, string(grades)); e != nil {
			return e
		}
		if a.Transcription != "" {
			if _, e = tx.Exec("INSERT INTO attempt_transcriptions(id,text,source_hash) VALUES(?,?,?)", a.ID, a.Transcription, contentHash(data)); e != nil {
				return e
			}
		}
		if e = emitAttempt(tx, a.ID); e != nil {
			return e
		}
	}
	if _, e = g.reviewStates(tx, templates); e != nil {
		return e
	}
	return tx.Commit()
}
