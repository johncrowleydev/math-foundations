package main

import (
	"encoding/json"
	"reflect"
	"testing"
)

func deterministicRestoreFixture(t *testing.T, review, structured, archived, correct bool) (*Grading, ReviewImport) {
	t.Helper()
	source := reviewFixture(t)
	sub := structuredSubmission()
	sub.ContentVersion = source.catalog.Version
	sub.Submitted = reviewDay + 1
	var records []Record
	if review {
		if structured {
			source.catalog.ReviewTemplates = []ReviewTemplate{structuredTemplate(t, source, "production")}
		} else {
			source.catalog.ReviewTemplates = source.catalog.ReviewTemplates[:1]
		}
		session, err := source.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
		if err != nil || len(session.Instances) != 1 {
			t.Fatal(session, err)
		}
		instance := session.Instances[0]
		sub.Exercise, sub.Review = instance.Exercise, &instance.Context
		raw, _ := json.Marshal(instance)
		records = []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}
	} else if structured {
		source.catalog.Exercises[sub.Exercise] = structuredCatalog(t, deterministicFixture(t))
	} else {
		source.catalog.Exercises[sub.Exercise] = json.RawMessage(`{"question":{"prompt":"Choose","officialAnswer":"Yes"},"choice":{"options":[{"id":"yes","text":"Yes","feedback":"Correct"},{"id":"no","text":"No","feedback":"Try again"}],"correctOption":"yes"}}`)
	}
	if structured {
		if !correct {
			sub.Response["answer"] = "3/4"
		}
	} else {
		sub.Mode, sub.ChoiceID, sub.Text, sub.Response = "choice", "yes", "Yes", nil
		if !correct {
			sub.ChoiceID, sub.Text = "no", "No"
		}
	}
	saved, _, err := source.submit(sub)
	if err != nil {
		t.Fatal(err)
	}
	target := reviewFixture(t)
	target.catalog = source.catalog
	if archived {
		target.catalog.Version = "later-catalog"
	}
	return target, ReviewImport{Records: records, Attempts: []Attempt{saved}}
}

func TestRestoreRejectsForgedDeterministicEvidence(t *testing.T) {
	for _, review := range []bool{true, false} {
		for _, structured := range []bool{true, false} {
			for _, archived := range []bool{true, false} {
				name := "lesson"
				if review {
					name = "review"
				}
				if structured {
					name += "/structured"
				} else {
					name += "/choice"
				}
				if archived {
					name += "/archived"
				} else {
					name += "/current"
				}
				for _, change := range []struct {
					name   string
					mutate func(*Attempt)
				}{
					{"forged-success", func(a *Attempt) {
						a.Verdict = "correct"
						a.Grades[0].Verdict = "correct"
						a.Grades[0].Requirements[0].Satisfied = true
					}},
					{"forged-grade", func(a *Attempt) { a.Grades[0].Verdict = "correct" }},
					{"forged-requirement", func(a *Attempt) { a.Grades[0].Requirements[0].Satisfied = true }},
					{"missing-requirement", func(a *Attempt) { a.Grades[0].Requirements = nil }},
					{"extra-requirement", func(a *Attempt) {
						a.Grades[0].Requirements = append(a.Grades[0].Requirements, Requirement{ID: "extra", Satisfied: true})
					}},
					{"missing-grade", func(a *Attempt) { a.Grades = nil }},
					{"mode-bypass", func(a *Attempt) { a.Mode = "type" }},
					{"forged-clerical-diagnosis", func(a *Attempt) { a.Grades[0].Diagnosis = []Diagnosis{{Class: "clerical"}} }},
				} {
					t.Run(name+"/"+change.name, func(t *testing.T) {
						g, backup := deterministicRestoreFixture(t, review, structured, archived, false)
						_, before := summaryStates(t, g, 10*reviewDay)
						change.mutate(&backup.Attempts[0])
						if err := g.importReview(backup); err == nil {
							t.Fatal("accepted forged deterministic evidence")
						}
						var attempts, jobs int
						g.server.db.QueryRow("SELECT COUNT(*) FROM attempts").Scan(&attempts)
						g.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&jobs)
						if attempts != 0 || jobs != 0 {
							t.Fatal("failed restore wrote attempts or jobs", attempts, jobs)
						}
						if review {
							var instance ReviewInstance
							if reviewLoad(g.server.db, backup.Records[0].Key, &instance) == nil {
								t.Fatal("failed restore persisted instance")
							}
						}
						_, after := summaryStates(t, g, 10*reviewDay)
						if !reflect.DeepEqual(before, after) {
							t.Fatal("failed restore changed scheduling evidence")
						}
					})
				}
				for _, correct := range []bool{true, false} {
					t.Run(name+"/honest", func(t *testing.T) {
						g, backup := deterministicRestoreFixture(t, review, structured, archived, correct)
						if err := g.importReview(backup); err != nil {
							t.Fatal(err)
						}
						saved, err := loadAttempt(g.server.db, backup.Attempts[0].ID)
						if err != nil || saved.Verdict != backup.Attempts[0].Verdict || !reflect.DeepEqual(saved.Grades, backup.Attempts[0].Grades) {
							t.Fatal("changed valid historical grade", saved, err)
						}
						// Existing server data wins, even if a later import supplies altered grades.
						backup.Attempts[0].Grades = nil
						if err := g.importReview(backup); err != nil {
							t.Fatal("idempotent restore", err)
						}
					})
				}
			}
		}
	}
}

func TestRestoreUsesOriginalDeterministicDefinition(t *testing.T) {
	t.Run("nested-archived-assessment", func(t *testing.T) {
		g, backup := deterministicRestoreFixture(t, false, true, true, true)
		backup.Attempts[0].Presentation.Assessment = nil
		if err := g.importReview(backup); err != nil {
			t.Fatal(err)
		}
		saved, err := loadAttempt(g.server.db, backup.Attempts[0].ID)
		if err != nil || saved.Presentation.Assessment == nil {
			t.Fatal("lost nested assessment", err)
		}
	})
	t.Run("nested-archived-forgery", func(t *testing.T) {
		g, backup := deterministicRestoreFixture(t, false, true, true, true)
		backup.Attempts[0].Presentation.Assessment = nil
		backup.Attempts[0].Response["answer"] = "3/4"
		if err := g.importReview(backup); err == nil {
			t.Fatal("trusted forged nested snapshot grade")
		}
	})
	t.Run("conflicting-archived-assessments", func(t *testing.T) {
		g, backup := deterministicRestoreFixture(t, false, true, true, true)
		altered := deterministicFixture(t)
		altered.Requirements[0].Params = json.RawMessage(`{"expected":["3/4"]}`)
		backup.Attempts[0].Presentation.Question["assessment"] = altered
		if err := g.importReview(backup); err == nil {
			t.Fatal("accepted conflicting assessment snapshots")
		}
	})
	t.Run("current-catalog-outranks-presentation", func(t *testing.T) {
		g, backup := deterministicRestoreFixture(t, false, true, false, true)
		backup.Attempts[0].Response["answer"] = "3/4"
		altered := deterministicFixture(t)
		altered.Requirements[0].Params = json.RawMessage(`{"expected":["3/4"]}`)
		backup.Attempts[0].Presentation.Assessment = altered
		backup.Attempts[0].Presentation.Question["assessment"] = altered
		if err := g.importReview(backup); err == nil {
			t.Fatal("presentation overrode current catalog")
		}
	})
	t.Run("unverifiable-open-history", func(t *testing.T) {
		g, backup := deterministicRestoreFixture(t, false, true, true, true)
		a := &backup.Attempts[0]
		a.Mode, a.Text, a.Response, a.Presentation = "type", "An old proof", nil, nil
		a.Grades = []Grade{{Verdict: "correct", Model: "historical-model", Feedback: "Historical feedback"}}
		if err := g.importReview(backup); err != nil {
			t.Fatal("regraded old open response using new catalog", err)
		}
		saved, err := loadAttempt(g.server.db, a.ID)
		if err != nil || !reflect.DeepEqual(saved.Grades, a.Grades) {
			t.Fatal("changed open history", err)
		}
	})
	t.Run("ungraded-invalid-work", func(t *testing.T) {
		g, backup := deterministicRestoreFixture(t, true, true, true, false)
		a := &backup.Attempts[0]
		a.Status, a.Verdict, a.Grades = "error", "", nil
		a.Response["answer"] = "unsupported syntax"
		if err := g.importReview(backup); err != nil {
			t.Fatal("lost ungraded saved work", err)
		}
	})
	t.Run("legacy-choice-grade", func(t *testing.T) {
		g, backup := deterministicRestoreFixture(t, false, false, true, true)
		backup.Attempts[0].Grades[0].PromptVersion = "authored-choice-1"
		backup.Attempts[0].Grades[0].Requirements = nil
		if err := g.importReview(backup); err != nil {
			t.Fatal("lost legacy choice history", err)
		}
	})
}
