package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestAcceptedAnswerTeXConformance(t *testing.T) {
	testDeterministicCorpus(t, "../tests/grading/fixtures/accepted-answer-tex.json")
}

// Published accepted examples are promises made by the UI. Exercise the actual
// API grader as well as the TypeScript content checks, including every authored
// variant rather than a sample selected by a review seed. Historical snapshots
// remain optional and are covered separately below.
func TestPublishedAssessmentSolutions(t *testing.T) {
	root := os.Getenv("FOUNDATIONS_TEST_CONTENT_ROOT")
	if root == "" {
		root = ".."
	}
	raw, err := os.ReadFile(filepath.Join(root, "output/grading-catalog.json"))
	if os.IsNotExist(err) {
		t.Skip("run npm run content:build to test the published catalog")
	}
	if err != nil {
		t.Fatal(err)
	}
	var catalog Catalog
	if err := json.Unmarshal(raw, &catalog); err != nil {
		t.Fatal(err)
	}
	checked := 0
	check := func(name string, question any) {
		t.Helper()
		raw, err := json.Marshal(question)
		if err != nil {
			t.Fatal(name, err)
		}
		var entry struct {
			Assessment *Assessment `json:"assessment"`
		}
		if err := json.Unmarshal(raw, &entry); err != nil {
			t.Fatal(name, err)
		}
		if entry.Assessment == nil {
			return
		}
		checked++
		t.Run(name, func(t *testing.T) {
			if entry.Assessment.Solution == nil {
				t.Fatal("published assessment is missing its accepted answer")
			}
			grade, err := gradeAssessment(entry.Assessment, entry.Assessment.Solution)
			if err != nil || grade.Verdict != "correct" {
				t.Fatalf("published accepted answer graded %q: %v", grade.Verdict, err)
			}
		})
	}
	for id, exercise := range catalog.Exercises {
		check("lesson/"+id, exercise)
	}
	for _, template := range catalog.ReviewTemplates {
		check("review/"+template.ID+"/base", template.Question)
		for index, question := range template.Variants {
			check(fmt.Sprintf("review/%s/variant-%d", template.ID, index+1), question)
		}
	}
	for id, bank := range catalog.ReviewVariants {
		for _, variant := range bank.Variants {
			check("review/"+id+"/generated-"+variant.ID, variant.Question)
		}
	}
	if checked == 0 {
		t.Fatal("published catalog contains no structured assessments")
	}
}

func TestAssessmentSolutionPreservesLegacyAttemptSnapshots(t *testing.T) {
	reply := "unused"
	g := graderFixture(t, &reply)
	assessment := deterministicFixture(t)
	g.catalog.Exercises["logic-1"] = structuredCatalog(t, assessment)
	legacySubmission := structuredSubmission()
	legacySubmission.Response = StructuredResponse{"answer": "1/3"}
	legacy, _, err := g.submit(legacySubmission)
	if err != nil || legacy.Verdict != "incorrect" {
		t.Fatal(legacy, err)
	}

	assessment.Solution = StructuredResponse{"answer": "1/2"}
	g.catalog.Exercises["logic-1"] = structuredCatalog(t, assessment)
	submission := structuredSubmission()
	submission.ID = newID()
	submission.Submitted++
	saved, _, err := g.submit(submission)
	if err != nil || saved.Verdict != "correct" {
		t.Fatal(saved, err)
	}
	if saved.Presentation == nil || saved.Presentation.Assessment == nil || !reflect.DeepEqual(saved.Presentation.Assessment.Solution, assessment.Solution) {
		t.Fatal("accepted answer lost from saved catalog assessment", saved.Presentation)
	}
	if _, err := archivedAttemptContext(saved); err != nil {
		t.Fatal("duplicated assessment disagrees after serialization", err)
	}

	// A later accepted example must not overwrite either archived presentation.
	assessment.Solution["answer"] = "0.5"
	g.catalog.Exercises["logic-1"] = structuredCatalog(t, assessment)
	current, err := loadAttempt(g.server.db, saved.ID)
	if err != nil || current.Presentation.Assessment.Solution["answer"] != "1/2" {
		t.Fatal("saved accepted answer changed with catalog", current, err)
	}
	old, err := loadAttempt(g.server.db, legacy.ID)
	if err != nil || old.Presentation.Assessment.Solution != nil {
		t.Fatal("legacy snapshot was rewritten", old, err)
	}
	raw, err := json.Marshal(old.Presentation.Assessment)
	if err != nil {
		t.Fatal(err)
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fields); err != nil {
		t.Fatal(err)
	}
	if _, exists := fields["solution"]; exists {
		t.Fatal("legacy assessment gained a solution field")
	}
}

func TestAssessmentSolutionRetainedInArchivedReview(t *testing.T) {
	g := reviewFixture(t)
	template := structuredTemplate(t, g, "production")
	assessment := template.Question["assessment"].(*Assessment)
	assessment.Solution = StructuredResponse{"answer": "1/2"}
	g.catalog.ReviewTemplates = []ReviewTemplate{template}
	session, err := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
	if err != nil || len(session.Instances) != 1 {
		t.Fatal(session, err)
	}
	instance := session.Instances[0]
	submission := structuredSubmission()
	submission.Exercise = instance.Exercise
	submission.Review = &instance.Context
	submission.ContentVersion = instance.ContentVersion
	submission.Submitted = reviewDay + 1
	saved, _, err := g.submit(submission)
	if err != nil || saved.Verdict != "correct" {
		t.Fatal(saved, err)
	}
	raw, err := json.Marshal(instance)
	if err != nil {
		t.Fatal(err)
	}
	archived := reviewFixture(t)
	archived.catalog.Version = "new-catalog"
	if err := archived.importReview(ReviewImport{
		Records:  []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}},
		Attempts: []Attempt{saved},
	}); err != nil {
		t.Fatal("archived accepted answer rejected", err)
	}
	restored, err := loadAttempt(archived.server.db, saved.ID)
	if err != nil || restored.Presentation == nil || restored.Presentation.Assessment == nil || !reflect.DeepEqual(restored.Presentation.Assessment.Solution, assessment.Solution) {
		t.Fatal("archived accepted answer lost", restored, err)
	}
	if restored.Verdict != "correct" || !reflect.DeepEqual(restored.Response, saved.Response) {
		t.Fatal("restoring an accepted answer changed the user's grade or response", restored)
	}
}
