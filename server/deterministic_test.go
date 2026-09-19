package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDeterministicConformance(t *testing.T) {
	b, e := os.ReadFile("../shared/deterministic-fixtures.json")
	if e != nil {
		t.Fatal(e)
	}
	var cases []struct {
		Name       string             `json:"name"`
		Assessment Assessment         `json:"assessment"`
		Response   StructuredResponse `json:"response"`
		Verdict    string             `json:"verdict"`
		Error      bool               `json:"error"`
	}
	if e = json.Unmarshal(b, &cases); e != nil {
		t.Fatal(e)
	}
	for _, c := range cases {
		t.Run(c.Name, func(t *testing.T) {
			g, e := gradeAssessment(&c.Assessment, c.Response)
			if c.Error {
				if e == nil {
					t.Fatalf("expected input error, got %+v", g)
				}
				return
			}
			if e != nil || g.Verdict != c.Verdict {
				t.Fatalf("grade %q error %v; want %s", g.Verdict, e, c.Verdict)
			}
		})
	}
}
func deterministicFixture(t *testing.T) *Assessment {
	t.Helper()
	var a Assessment
	b := []byte(`{"version":1,"inputs":[{"id":"answer","kind":"math","label":"Answer"}],"requirements":[{"id":"value","description":"Give the exact result","validator":"exact","fields":["answer"],"params":{"expected":["1/2"]}}],"feedback":{"correct":"Correct.","incorrect":"Check the calculation."},"evidence":{"level":"production","interactionCost":"low","inputCapabilities":["short-text"]}}`)
	if e := json.Unmarshal(b, &a); e != nil {
		t.Fatal(e)
	}
	return &a
}
func structuredCatalog(t *testing.T, a *Assessment) json.RawMessage {
	t.Helper()
	b, e := json.Marshal(map[string]any{"question": map[string]any{"instructions": "Compute", "prompt": "Find half of one.", "officialAnswer": "1/2"}, "assessment": a, "analytics": map[string]any{"concepts": []map[string]string{{"concept": "logic", "role": "primary"}}, "skills": []map[string]string{{"skill": "calculate", "role": "primary"}}}})
	if e != nil {
		t.Fatal(e)
	}
	return b
}
func structuredSubmission() Submission {
	a := submission()
	a.Mode = "structured"
	a.Text = ""
	a.Images = []string{}
	a.Response = StructuredResponse{"answer": "0.5"}
	return a
}
func TestStructuredSubmissionNoProviderJobsAndImmutableContext(t *testing.T) {
	reply := "unused"
	g := graderFixture(t, &reply)
	calls := 0
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		t.Error("deterministic answer reached provider")
	}))
	defer provider.Close()
	g.endpoint = provider.URL
	g.key = ""
	assessment := deterministicFixture(t)
	g.catalog.Exercises["logic-1"] = structuredCatalog(t, assessment)
	for _, bad := range []StructuredResponse{nil, {}, {"answer": ""}, {"answer": "1/0"}, {"answer": "0.5", "extra": "x"}} {
		a := structuredSubmission()
		a.Response = bad
		if _, code, e := g.submit(a); e == nil || code != 400 {
			t.Fatalf("accepted invalid answer %v: %d %v", bad, code, e)
		}
	}
	for _, mode := range []string{"type", "write", "photo", "choice"} {
		a := structuredSubmission()
		a.Mode = mode
		if _, code, e := g.submit(a); e == nil || code != 400 {
			t.Fatalf("accepted wrong mode %s: %d %v", mode, code, e)
		}
	}
	a := structuredSubmission()
	a.Response["answer"] = "1/3"
	wrong, code, e := g.submit(a)
	if e != nil || code != 201 || wrong.Verdict != "incorrect" || len(wrong.Grades[0].Requirements) != 1 {
		t.Fatal(wrong, code, e)
	}
	duplicate, code, e := g.submit(a)
	if e != nil || code != 200 || duplicate.ID != a.ID {
		t.Fatal(code, e)
	}
	if e = g.recheck(a.ID, newID(), "Please reconsider"); e == nil {
		t.Fatal("deterministic recheck accepted")
	}
	a.ID = newID()
	a.Submitted++
	a.Response["answer"] = "1/2"
	right, _, e := g.submit(a)
	if e != nil || right.Verdict != "correct" || right.Presentation == nil || right.Presentation.Assessment == nil {
		t.Fatal(right, e)
	}
	var count int
	g.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&count)
	if count != 0 || g.step(context.Background()) || calls != 0 {
		t.Fatal("deterministic response created provider work", count, calls)
	}
	assessment.Requirements[0].Params = json.RawMessage(`{"expected":["9"]}`)
	g.catalog.Exercises["logic-1"] = structuredCatalog(t, assessment)
	saved, e := loadAttempt(g.server.db, right.ID)
	if e != nil {
		t.Fatal(e)
	}
	grade, e := gradeAssessment(saved.Presentation.Assessment, saved.Response)
	if e != nil || grade.Verdict != "correct" {
		t.Fatal("saved definition changed", e)
	}
	if _, e = g.evaluate(context.Background(), saved, string(g.catalog.Exercises["logic-1"]), ""); e == nil || calls != 0 {
		t.Fatal("worker bypass accepted structured response")
	}
	a.ID = newID()
	if _, code, e := g.submit(a); e == nil || code != 409 {
		t.Fatal("correct lock lost", code, e)
	}
}
func TestCatalogReadyWithoutProvider(t *testing.T) {
	s := fixture(t)
	a := deterministicFixture(t)
	raw, _ := json.Marshal(Catalog{Version: "version", Exercises: map[string]json.RawMessage{"logic-1": structuredCatalog(t, a)}})
	p := filepath.Join(t.TempDir(), "catalog.json")
	if e := os.WriteFile(p, raw, 0600); e != nil {
		t.Fatal(e)
	}
	t.Setenv("FOUNDATIONS_CATALOG", p)
	t.Setenv("OPENROUTER_API_KEY", "")
	g, e := configureGrading(s)
	if e != nil || g == nil {
		t.Fatal(g, e)
	}
	aSub := structuredSubmission()
	aSub.ContentVersion = "version"
	if _, _, e := g.submit(aSub); e != nil {
		t.Fatal(e)
	}
	g.catalog.Exercises["open-1"] = json.RawMessage(`{"question":{"prompt":"Prove it"}}`)
	aSub = structuredSubmission()
	aSub.Exercise = "open-1"
	aSub.ContentVersion = "version"
	aSub.Mode = "type"
	aSub.Response = nil
	aSub.Text = "proof"
	if _, code, e := g.submit(aSub); e == nil || code != 503 || !strings.Contains(e.Error(), "AI grading") {
		t.Fatal("missing provider did not retain open response", code, e)
	}
}

func structuredTemplate(t *testing.T, g *Grading, level string) ReviewTemplate {
	x := g.catalog.ReviewTemplates[0]
	x.ID = "structured"
	x.Skill = "construct"
	x.EvidenceLevel = level
	x.Family = "fixed"
	x.Question = map[string]any{"id": 1, "section": "Review", "instructions": "Compute", "prompt": "One half", "answer": "1/2", "assessment": deterministicFixture(t)}
	x.Analytics = json.RawMessage(`{"concepts":[{"concept":"logic","role":"primary"}],"skills":[{"skill":"construct","role":"primary"}]}`)
	return x
}
func TestStructuredReviewSnapshotsRestoreAndEvidence(t *testing.T) {
	g := reviewFixture(t)
	template := structuredTemplate(t, g, "production")
	g.catalog.ReviewTemplates = []ReviewTemplate{template}
	if !g.reviewTemplates()[0].quick() {
		t.Fatal("short production answer not Quick compatible")
	}
	session, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
	if e != nil || len(session.Instances) != 1 {
		t.Fatal(session, e)
	}
	instance := session.Instances[0]
	a := structuredSubmission()
	a.Exercise = instance.Exercise
	a.Review = &instance.Context
	a.ContentVersion = instance.ContentVersion
	a.Submitted = reviewDay + 1
	saved, _, e := g.submit(a)
	if e != nil || saved.Verdict != "correct" {
		t.Fatal(saved, e)
	}
	restored := reviewFixture(t)
	restored.catalog.ReviewTemplates = []ReviewTemplate{template}
	raw, _ := json.Marshal(instance)
	records := []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}
	if e = restored.importReview(ReviewImport{Records: records, Attempts: []Attempt{saved}}); e != nil {
		t.Fatal("current restore", e)
	}
	archived := reviewFixture(t)
	archived.catalog.Version = "new-catalog"
	if e = archived.importReview(ReviewImport{Records: records, Attempts: []Attempt{saved}}); e != nil {
		t.Fatal("archived restore", e)
	}
	again, e := loadAttempt(archived.server.db, a.ID)
	if e != nil || again.Presentation == nil || again.Presentation.Assessment == nil {
		t.Fatal("lost archived checker", again, e)
	}
	if e = archived.recheck(a.ID, newID(), "recheck"); e == nil {
		t.Fatal("restore enabled AI recheck")
	}
	var jobs int
	archived.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&jobs)
	if jobs != 0 {
		t.Fatal("restore created model job")
	}
	// A shallow answer never advances a deeper family target, including after an update.
	deep := reviewFixture(t)
	deepTemplate := structuredTemplate(t, deep, "reasoning")
	deep.catalog.ReviewTemplates = []ReviewTemplate{deepTemplate}
	practice, e := deep.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
	if e != nil || len(practice.Instances) != 1 {
		t.Fatal(practice, e)
	}
	issued := practice.Instances[0]
	if issued.EvidenceLevel != "production" {
		t.Fatal("instance overstated evidence", issued.EvidenceLevel)
	}
	a = structuredSubmission()
	a.Exercise = issued.Exercise
	a.Review = &issued.Context
	a.ContentVersion = issued.ContentVersion
	a.Submitted = reviewDay + 1
	if _, _, e = deep.submit(a); e != nil {
		t.Fatal(e)
	}
	_, states := summaryStates(t, deep, 2*reviewDay)
	state := states[deepTemplate.key()]
	if state.EvidenceLevel != "reasoning" || state.LastEvidenceAt != nil || state.DueAt != reviewDay || state.Quick {
		t.Fatal("production satisfied deeper target", state)
	}
	due, e := deep.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular"}, 2*reviewDay)
	if e != nil || len(due.Instances) != 0 {
		t.Fatal("scheduled an insufficient answer", due, e)
	}
	deep.catalog.ReviewTemplates = nil
	_, states = summaryStates(t, deep, 3*reviewDay)
	if s := states[deepTemplate.key()]; s.EvidenceLevel != "reasoning" || s.DueAt != reviewDay {
		t.Fatal("removed template lost deep due state", s)
	}
}
func TestStructuredReviewArchivedTamperRejected(t *testing.T) {
	g := reviewFixture(t)
	t1 := structuredTemplate(t, g, "production")
	instance := instantiateReview(t1, ReviewState{ReviewTarget: t1.ReviewTarget}, "focused-practice", newID(), "seed", "old", reviewDay)
	q := instance.Question["assessment"].(map[string]any)
	q["version"] = float64(2)
	raw, _ := json.Marshal(instance)
	if e := g.importReview(ReviewImport{Records: []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}}); e == nil {
		t.Fatal("accepted altered archived definition")
	}
}
