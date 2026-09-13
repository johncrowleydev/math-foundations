package main

import (
	"context"
	"encoding/json"
	"testing"
)

func TestChoiceGradingNeverQueuesOrCallsModel(t *testing.T) {
	reply := "should never be requested"
	g := graderFixture(t, &reply)
	g.catalog.Exercises["logic-1"] = json.RawMessage(`{"choice":{"options":[{"id":"yes","text":"Yes","feedback":"An implication and its converse can differ."},{"id":"no","text":"No","feedback":"Compare the two directions on a false consequent."}],"correctOption":"yes"}}`)
	a := submission()
	a.Mode = "choice"
	a.ChoiceID = "no"
	a.Text = "No"
	wrong, _, e := g.submit(a)
	if e != nil || wrong.Status != "graded" || wrong.Verdict != "incorrect" || wrong.Grades[0].Feedback != "Compare the two directions on a false consequent." {
		t.Fatal(wrong, e)
	}
	if g.step(context.Background()) {
		t.Fatal("choice created an AI job")
	}
	duplicate, code, e := g.submit(a)
	if e != nil || code != 200 || duplicate.ID != wrong.ID {
		t.Fatal("repeat request", e)
	}
	if e = g.recheck(a.ID, newID(), "reconsider"); e == nil {
		t.Fatal("choice allowed AI recheck")
	}
	a.ID = newID()
	a.ChoiceID = "yes"
	a.Text = "Yes"
	right, _, e := g.submit(a)
	if e != nil || right.Verdict != "correct" || right.Grades[0].Model != "deterministic" {
		t.Fatal(right, e)
	}
	a.ID = newID()
	if _, code, e := g.submit(a); e == nil || code != 409 {
		t.Fatal("correct exercise did not lock")
	}
	var jobs int
	g.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&jobs)
	if jobs != 0 {
		t.Fatal("unexpected jobs", jobs)
	}
}
func TestChoiceRejectsUnknownOrMismatchedOptions(t *testing.T) {
	reply := "unused"
	g := graderFixture(t, &reply)
	g.catalog.Exercises["logic-1"] = json.RawMessage(`{"choice":{"options":[{"id":"yes","text":"Yes","feedback":"Right"},{"id":"no","text":"No","feedback":"Wrong"}],"correctOption":"yes"}}`)
	for _, bad := range []Submission{
		{Mode: "choice", ChoiceID: "unknown", Text: "Yes"},
		{Mode: "choice", ChoiceID: "yes", Text: "No"},
		{Mode: "type", Text: "Yes"},
	} {
		a := submission()
		a.Mode = bad.Mode
		a.ChoiceID = bad.ChoiceID
		a.Text = bad.Text
		if _, code, e := g.submit(a); e == nil || code != 400 {
			t.Fatal("accepted bad choice", bad, e)
		}
	}
	a := submission()
	a.Mode = "choice"
	a.ChoiceID = "yes"
	a.Text = "Yes"
	a.ContentVersion = "old"
	if _, code, e := g.submit(a); e == nil || code != 409 {
		t.Fatal("accepted stale catalog")
	}
}
