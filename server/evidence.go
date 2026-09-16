package main

import (
	"encoding/json"
	"errors"
	"strings"
)

type Assistance struct {
	AnswerPreviouslyRevealed   bool `json:"answerPreviouslyRevealed"`
	PriorIncorrectFeedbackSeen bool `json:"priorIncorrectFeedbackSeen"`
	CopiedFromRetry            bool `json:"copiedFromRetry"`
}
type Requirement struct {
	ID          string `json:"id"`
	Description string `json:"description"`
	Satisfied   bool   `json:"satisfied"`
}
type Diagnosis struct {
	Class    string   `json:"class"`
	Severity string   `json:"severity,omitempty"`
	Tags     []string `json:"tags"`
	Concepts []string `json:"concepts"`
	Skills   []string `json:"skills"`
}

func enum(v string, values ...string) bool {
	for _, x := range values {
		if x == v {
			return true
		}
	}
	return false
}
func validateGradeEvidence(g Grade) error {
	if !enum(g.Confidence, "high", "medium", "low") || len(g.Requirements) == 0 {
		return errors.New("Grader omitted requirement/confidence evidence")
	}
	ids := map[string]bool{}
	for _, r := range g.Requirements {
		if strings.TrimSpace(r.ID) == "" || strings.TrimSpace(r.Description) == "" || ids[r.ID] {
			return errors.New("Invalid explicit requirements")
		}
		ids[r.ID] = true
		if g.Verdict == "correct" && !r.Satisfied {
			return errors.New("Contradictory requirement verdict")
		}
	}
	if g.Verdict == "correct" && len(g.Diagnosis) > 0 {
		return errors.New("Correct work cannot contain error diagnoses")
	}
	if g.Verdict == "not_graded" {
		if !enum(g.NotGradedReason, "unreadable", "missing-image", "ambiguous-problem", "insufficient-context", "grader-failure") {
			return errors.New("Missing not-graded reason")
		}
	} else if g.NotGradedReason != "" {
		return errors.New("Unexpected not-graded reason")
	}
	for _, d := range g.Diagnosis {
		if !enum(d.Class, "conceptual", "procedural", "reasoning", "representation", "justification", "clerical", "prompt-compliance", "technical", "unknown") || !enum(d.Severity, "", "minor", "substantive") {
			return errors.New("Invalid diagnosis")
		}
	}
	return nil
}
func parseV5Grade(raw string) (Grade, error) {
	var g Grade
	var fields map[string]json.RawMessage
	if json.Unmarshal([]byte(raw), &fields) != nil {
		return g, errors.New("Invalid grading JSON")
	}
	for _, key := range []string{"verdict", "feedback", "issue", "improvement", "transcription", "requirements", "diagnosis", "confidence", "notGradedReason"} {
		if len(fields[key]) == 0 || string(fields[key]) == "null" {
			return g, errors.New("Grader omitted required assessment fields")
		}
	}
	if json.Unmarshal([]byte(raw), &g) != nil || !enum(g.Verdict, "correct", "incorrect", "not_graded") || strings.TrimSpace(g.Feedback) == "" {
		return g, errors.New("Incomplete assessment")
	}
	for _, text := range []string{g.Feedback, g.Issue, g.Improvement, g.Transcription} {
		if err := validateGradeText(text); err != nil {
			return g, err
		}
	}
	return g, validateGradeEvidence(g)
}
func evidenceSchema(props map[string]any) {
	str := map[string]any{"type": "string"}
	array := map[string]any{"type": "array", "items": str}
	props["requirements"] = map[string]any{"type": "array", "minItems": 1, "items": map[string]any{"type": "object", "properties": map[string]any{"id": str, "description": str, "satisfied": map[string]any{"type": "boolean"}}, "required": []string{"id", "description", "satisfied"}, "additionalProperties": false}}
	props["confidence"] = map[string]any{"type": "string", "enum": []string{"high", "medium", "low"}}
	props["notGradedReason"] = map[string]any{"type": "string", "enum": []string{"", "unreadable", "missing-image", "ambiguous-problem", "insufficient-context", "grader-failure"}}
	props["diagnosis"] = map[string]any{"type": "array", "items": map[string]any{"type": "object", "properties": map[string]any{"class": map[string]any{"type": "string", "enum": []string{"conceptual", "procedural", "reasoning", "representation", "justification", "clerical", "prompt-compliance", "technical", "unknown"}}, "severity": map[string]any{"type": "string", "enum": []string{"", "minor", "substantive"}}, "tags": array, "concepts": array, "skills": array}, "required": []string{"class", "severity", "tags", "concepts", "skills"}, "additionalProperties": false}}
}
func validateDiagnosisIDs(g Grade, context string) error {
	var x struct {
		Analytics struct {
			Concepts []struct {
				Concept string `json:"concept"`
			} `json:"concepts"`
			Skills []struct {
				Skill string `json:"skill"`
			} `json:"skills"`
		} `json:"analytics"`
	}
	json.Unmarshal([]byte(context), &x)
	for _, d := range g.Diagnosis {
		for _, id := range d.Concepts {
			found := false
			for _, c := range x.Analytics.Concepts {
				found = found || id == c.Concept
			}
			if !found {
				return errors.New("Unrecognized diagnosis concept")
			}
		}
		for _, id := range d.Skills {
			found := false
			for _, s := range x.Analytics.Skills {
				found = found || id == s.Skill
			}
			if !found {
				return errors.New("Unrecognized diagnosis skill")
			}
		}
	}
	return nil
}

const evidenceInstruction = `
First extract only explicit requirements from question.instructions and question.prompt (including the displayed mathematical task). Record requirements with stable short IDs, descriptions and satisfied flags. Neither reference answer, lesson title, section title, analytical metadata nor conventional classroom expectations can add a requirement. Determine the mathematical verdict first. Diagnose the response second. Do not search for an error merely to populate diagnostic fields. Correct work has diagnosis: []. Diagnosis is not a verdict input.
Validate the student's actual mathematical chain, including algebra and proofs beyond logic. A different valid derivation from the reference is fully correct. Independently simplifying two sides to a common expression is valid if every transformation is valid. A correct final result does not rescue a false intermediate equality or inference when shown reasoning is requested.
An otherwise correct result missing explicitly requested justification is incorrect with class prompt-compliance and tag missing-requested-justification; it is not by itself a conceptual misunderstanding. Use severity minor or substantive only when supported. Use unknown rather than speculate about the learner. Tags are short domain-specific descriptions. concepts and skills must use IDs from the supplied analytics metadata; use empty arrays when not available or not attributable.
Grade the exercise as written. When multiple reasonable interpretations exist, evaluate fairly under a reasonable interpretation. If ambiguity materially changes correctness and cannot be resolved, return not_graded with ambiguous-problem. Do not silently rewrite the problem. Other notGradedReason values are unreadable, missing-image, insufficient-context or grader-failure; use an empty string for graded responses. not_graded is not a mathematical failure.
Return confidence high, medium or low for the GRADING DECISION only, not learner understanding. Retain concise explanatory feedback. Return requirements, diagnosis, confidence and notGradedReason in addition to verdict, feedback, issue, improvement and transcription.`
const recheckEvidenceInstruction = `
Perform a fresh mathematical evaluation. Previous assessments are historical context, not evidence of correctness. Do not preserve an earlier verdict merely for consistency. Clarification helps interpret what was written but does not itself prove correctness. If fresh evaluation disagrees with a prior grade, return the new verdict plainly and explain why.`
