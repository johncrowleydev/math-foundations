package main

import (
	"encoding/json"
	"errors"
)

// Archived lesson attempts must use their original definition, never today's
// catalog. Browser snapshots place the assessment inside question; server
// snapshots also include it alongside question.
func archivedAttemptContext(a Attempt) (map[string]json.RawMessage, error) {
	context := map[string]json.RawMessage{"importedHistoricalContext": json.RawMessage("true")}
	if len(a.Analytics) > 0 {
		context["analytics"] = a.Analytics
	}
	if a.Presentation == nil {
		return context, nil
	}
	question := map[string]any{}
	for key, value := range a.Presentation.Question {
		question[key] = value
	}
	for _, key := range []string{"assessment", "choice"} {
		if question[key] != nil {
			raw, err := json.Marshal(question[key])
			if err != nil {
				return nil, err
			}
			context[key] = raw
		}
	}
	if a.Presentation.Assessment != nil {
		raw, err := json.Marshal(a.Presentation.Assessment)
		if err != nil {
			return nil, err
		}
		if question["assessment"] != nil && !jsonEquivalent(context["assessment"], raw) {
			return nil, errors.New("Conflicting archived assessment definitions")
		}
		context["assessment"] = raw
	}
	question["officialAnswer"] = question["answer"]
	delete(question, "answer")
	context["question"], _ = json.Marshal(question)
	return context, nil
}

// Import is observational: reject contradictory deterministic evidence instead
// of rewriting historical grades or letting it advance the Review schedule.
// Only mathematical outcomes are compared; feedback and timestamps stay intact.
func validateImportedDeterministicGrade(a Attempt, context map[string]json.RawMessage, requireDefinition bool) error {
	var assessment *Assessment
	var choice *ChoiceAssessment
	for key, dst := range map[string]any{"assessment": &assessment, "choice": &choice} {
		if raw := context[key]; len(raw) > 0 {
			if err := json.Unmarshal(raw, dst); err != nil {
				return err
			}
		}
	}
	if assessment != nil && choice != nil {
		return errors.New("Conflicting imported assessment definitions")
	}
	if assessment == nil && choice == nil {
		if requireDefinition && enum(a.Mode, "structured", "choice") {
			return errors.New("Missing deterministic grading context")
		}
		return nil // Unverifiable historical/open work retains its original grade.
	}
	if (assessment != nil && a.Mode != "structured") || (choice != nil && a.Mode != "choice") {
		return errors.New("Imported assessment mode disagrees")
	}
	if assessment != nil {
		if err := validateAssessment(assessment); err != nil {
			return err
		}
	}
	if a.Status != "graded" && !enum(a.Verdict, "correct", "incorrect") && len(a.Grades) == 0 {
		return nil // Preserve ungraded work, including syntactically invalid responses.
	}
	var expected Grade
	if assessment != nil {
		grade, err := gradeAssessment(assessment, a.Response)
		if err != nil {
			return err
		}
		expected = grade
	} else {
		for _, option := range choice.Options {
			if option.ID == a.ChoiceID && option.Text == a.Text {
				expected.Verdict = "incorrect"
				if option.ID == choice.CorrectOption {
					expected.Verdict = "correct"
				}
				expected.Requirements = []Requirement{{ID: "selection", Satisfied: expected.Verdict == "correct"}}
				break
			}
		}
		if expected.Verdict == "" {
			return errors.New("Imported answer does not match a choice")
		}
	}
	if a.Verdict != expected.Verdict || len(a.Grades) == 0 {
		return errors.New("Imported verdict disagrees with deterministic grading")
	}
	for _, grade := range a.Grades {
		if grade.Verdict != expected.Verdict || len(grade.Diagnosis) > 0 {
			return errors.New("Imported grade disagrees with deterministic grading")
		}
		// Choice grades from before requirement evidence was introduced remain
		// readable. Structured grades have always included every requirement.
		if choice != nil && len(grade.Requirements) == 0 && enum(grade.PromptVersion, "", "authored-choice-1") {
			continue
		}
		if len(grade.Requirements) != len(expected.Requirements) {
			return errors.New("Imported requirements disagree with deterministic grading")
		}
		remaining := map[string]bool{}
		for _, r := range expected.Requirements {
			remaining[r.ID] = r.Satisfied
		}
		for _, r := range grade.Requirements {
			if satisfied, ok := remaining[r.ID]; !ok || satisfied != r.Satisfied {
				return errors.New("Imported requirements disagree with deterministic grading")
			}
			delete(remaining, r.ID)
		}
	}
	return nil
}
