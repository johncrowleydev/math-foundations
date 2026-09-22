package main

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func reviewFixture(t *testing.T) *Grading {
	t.Helper()
	s := fixture(t)
	meta := func(concept string, skills ...string) json.RawMessage {
		links := []map[string]string{}
		for _, skill := range skills {
			links = append(links, map[string]string{"skill": skill, "role": "primary"})
		}
		raw, _ := json.Marshal(map[string]any{"concepts": []map[string]string{{"concept": concept, "role": "primary"}}, "skills": links})
		return raw
	}
	template := func(id, concept, skill, level, cost string) ReviewTemplate {
		return ReviewTemplate{ReviewTarget: ReviewTarget{Concept: concept, Skill: skill}, ID: id, Family: "fixed", Lesson: "lesson", EvidenceLevel: level, InteractionCost: cost, InputCapabilities: []string{"tap"}, Analytics: meta(concept, skill), Question: map[string]any{"id": 1, "section": "review", "instructions": "Choose", "prompt": id, "answer": "Yes", "choice": map[string]any{"correctOption": "yes", "options": []map[string]string{{"id": "yes", "text": "Yes", "feedback": "Correct"}, {"id": "no", "text": "No", "feedback": "Try again"}}}}}
	}
	quick := template("quick", "logic", "recognize", "recognition", "low")
	deep := template("deep", "logic", "prove", "reasoning", "high")
	delete(deep.Question, "choice")
	deep.InputCapabilities = []string{"math-text"}
	other := template("other", "sets", "interpret", "recognition", "low")
	g := &Grading{server: s, catalog: Catalog{Version: "review-v1", Exercises: map[string]json.RawMessage{}, ReviewTemplates: []ReviewTemplate{quick, deep, other}}}
	s.grading = g
	return g
}
func storeReviewAttempt(t *testing.T, g *Grading, exercise string, at int64, verdict string, analytics json.RawMessage, review *ReviewContext, diagnoses ...Diagnosis) Attempt {
	t.Helper()
	a := Attempt{Submission: Submission{ID: newID(), Exercise: exercise, Submitted: at, ContentVersion: g.catalog.Version, Mode: "type", Text: "Synthetic answer", Review: review}, Status: "graded", Verdict: verdict, Analytics: analytics, Grades: []Grade{{Verdict: verdict, Diagnosis: diagnoses}}}
	data, _ := json.Marshal(a.Submission)
	grades, _ := json.Marshal(a.Grades)
	teaching, _ := json.Marshal(map[string]any{"analytics": analytics})
	if _, e := g.server.db.Exec("INSERT INTO attempts(id,exercise,submitted,data,context,status,verdict,grades) VALUES(?,?,?,?,?,'graded',?,?)", a.ID, exercise, at, string(data), string(teaching), verdict, string(grades)); e != nil {
		t.Fatal(e)
	}
	return a
}
func summaryStates(t *testing.T, g *Grading, now int64) (map[string]any, map[string]ReviewState) {
	t.Helper()
	summary, e := g.reviewSummary(now)
	if e != nil {
		t.Fatal(e)
	}
	states := map[string]ReviewState{}
	for _, s := range summary["targets"].([]ReviewState) {
		states[s.ID] = s
	}
	return summary, states
}
func TestReviewSchedulerSignals(t *testing.T) {
	tests := []struct {
		name   string
		signal reviewSignal
		days   float64
	}{
		{"clean", reviewSignal{Correct: true}, 6}, {"unsure", reviewSignal{Correct: true, Unsure: true}, 3}, {"one error", reviewSignal{Correct: true, Errors: 1}, 2}, {"many errors", reviewSignal{Correct: true, Errors: 2}, 1}, {"clerical", reviewSignal{Clerical: true}, 6}, {"failure", reviewSignal{}, 1}, {"revealed", reviewSignal{Correct: true, Assisted: true}, 1},
		{"delayed success", reviewSignal{Correct: true, Delayed: true, Kind: "scheduled-review"}, 12}, {"focused due success", reviewSignal{Correct: true, Delayed: true, Kind: "focused-practice"}, 7.5}, {"delayed unsure", reviewSignal{Correct: true, Delayed: true, Unsure: true}, 7.2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := ReviewState{IntervalDays: 6}
			a := scheduleReview(state, tt.signal, reviewDay)
			b := scheduleReview(state, tt.signal, reviewDay)
			if !reflect.DeepEqual(a, b) {
				t.Fatal("nondeterministic scheduler")
			}
			if diff := a.IntervalDays - tt.days; diff > 0.00001 || diff < -0.00001 {
				t.Fatalf("interval %v want %v", a.IntervalDays, tt.days)
			}
			if a.DueAt != reviewDay+int64(a.IntervalDays*float64(reviewDay)) {
				t.Fatal("due date")
			}
			if a.Reason == "" {
				t.Fatal("missing explanation")
			}
		})
	}
}
func TestReviewPassiveExposureDoesNotActivateAndHistoricalEvidenceDoes(t *testing.T) {
	g := reviewFixture(t)
	if _, e := g.server.mutate(Mutation{ID: newID(), Key: "exposure/logic", Device: "test", Payload: json.RawMessage(`{"at":1,"concept":"logic","source":"lesson","sourceId":"lesson"}`)}); e != nil {
		t.Fatal(e)
	}
	_, states := summaryStates(t, g, 10*reviewDay)
	if len(states) != 0 {
		t.Fatal("passive exposure activated review")
	}
	a := g.catalog.ReviewTemplates[0].Analytics
	storeReviewAttempt(t, g, "lesson-1", reviewDay, "correct", a, nil)
	_, states = summaryStates(t, g, 10*reviewDay)
	s := states["logic:recognize:"]
	if s.DueAt != 7*reviewDay || s.ActivatedAt != reviewDay || s.LastReviewedAt != nil || s.LastEvidenceAt == nil {
		t.Fatalf("historical bootstrap: %+v", s)
	}
}
func TestReviewDefinitionActivationDoesNotInventRecallSuccess(t *testing.T) {
	g := reviewFixture(t)
	definition := g.catalog.ReviewTemplates[0]
	definition.ID = "definition"
	definition.Skill = "recall"
	definition.Objective = "term"
	definition.EvidenceLevel = "production"
	definition.InputCapabilities = []string{"short-text"}
	g.catalog.ReviewTemplates = append(g.catalog.ReviewTemplates, definition)
	storeReviewAttempt(t, g, "lesson-1", reviewDay, "correct", g.catalog.ReviewTemplates[0].Analytics, nil)
	_, states := summaryStates(t, g, reviewDay)
	s := states[definition.key()]
	if s.LastReviewedAt != nil || s.IntervalDays != 0 || s.DueAt != reviewDay {
		t.Fatalf("fabricated recall success: %+v", s)
	}
}
func TestReviewQuickDefersDeepWithoutMutation(t *testing.T) {
	g := reviewFixture(t)
	for i, temp := range g.catalog.ReviewTemplates {
		storeReviewAttempt(t, g, fmt.Sprint("lesson-", i), reviewDay, "correct", temp.Analytics, nil)
	}
	summary, before := summaryStates(t, g, 10*reviewDay)
	if summary["due"] != 3 || summary["quick"] != 2 || summary["deeper"] != 1 {
		t.Fatal(summary)
	}
	session, e := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "quick"}, 10*reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	if len(session.Instances) != 2 {
		t.Fatal(session)
	}
	for _, instance := range session.Instances {
		if instance.Context.Skill == "prove" {
			t.Fatal("deep question in Quick")
		}
		storeReviewAttempt(t, g, instance.Exercise, 10*reviewDay, "correct", instance.Analytics, &instance.Context)
	}
	summary, after := summaryStates(t, g, 10*reviewDay)
	if summary["due"] != 1 || summary["quick"] != 0 || summary["deeper"] != 1 {
		t.Fatal(summary)
	}
	if !reflect.DeepEqual(before["logic:prove:"], after["logic:prove:"]) {
		t.Fatal("Quick changed deep due state")
	}
}
func TestReviewFocusedFiltersAndMassedPractice(t *testing.T) {
	g := reviewFixture(t)
	req := ReviewSessionRequest{Kind: "focused-practice", Mode: "regular", Lesson: "lesson", Concept: "logic", Skill: "prove"}
	first, e := g.planReview(req, reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	if len(first.Instances) != 1 || first.Instances[0].Context.Kind != "focused-practice" {
		t.Fatal(first)
	}
	instance := first.Instances[0]
	storeReviewAttempt(t, g, instance.Exercise, reviewDay, "correct", instance.Analytics, &instance.Context)
	_, states := summaryStates(t, g, reviewDay)
	initial := states["logic:prove:"]
	second, e := g.planReview(req, reviewDay+1000)
	if e != nil {
		t.Fatal(e)
	}
	instance = second.Instances[0]
	storeReviewAttempt(t, g, instance.Exercise, reviewDay+1000, "correct", instance.Analytics, &instance.Context)
	_, states = summaryStates(t, g, reviewDay+1000)
	if states["logic:prove:"].DueAt != initial.DueAt {
		t.Fatal("massed practice postponed due date")
	}
	third, e := g.planReview(req, 10*reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	instance = third.Instances[0]
	storeReviewAttempt(t, g, instance.Exercise, 10*reviewDay, "correct", instance.Analytics, &instance.Context)
	_, states = summaryStates(t, g, 10*reviewDay)
	if states["logic:prove:"].IntervalDays != 7.5 {
		t.Fatalf("focused due evidence ignored or treated cold: %+v", states)
	}
}
func TestReviewDepthAndExplicitWeakerLinks(t *testing.T) {
	g := reviewFixture(t)
	deep := g.catalog.ReviewTemplates[1]
	deep.Analytics = json.RawMessage(`{"concepts":[{"concept":"logic","role":"primary"}],"skills":[{"skill":"prove","role":"primary"},{"skill":"recognize","role":"primary"}]}`)
	g.catalog.ReviewTemplates[1] = deep
	storeReviewAttempt(t, g, "proof", reviewDay, "correct", deep.Analytics, nil)
	_, states := summaryStates(t, g, 10*reviewDay)
	if len(states) != 2 {
		t.Fatalf("deep primary evidence did not satisfy explicit weaker links: %+v", states)
	}
	quick, e := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "quick"}, 10*reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	instance := quick.Instances[0]
	storeReviewAttempt(t, g, instance.Exercise, 10*reviewDay, "correct", instance.Analytics, &instance.Context)
	_, states = summaryStates(t, g, 10*reviewDay)
	if states["logic:prove:"].DueAt != 7*reviewDay {
		t.Fatal("recognition cleared proof")
	}
	// Same knowledge target cannot silently downgrade required evidence depth.
	shallow := deep
	shallow.ID = "shallow"
	shallow.EvidenceLevel = "recognition"
	shallow.InteractionCost = "low"
	g.catalog.ReviewTemplates = append(g.catalog.ReviewTemplates, shallow)
	for _, template := range g.reviewTemplates() {
		if template.ID == "shallow" {
			t.Fatal("weaker template substitutes for required reasoning")
		}
	}
}
func TestReviewInterleavingAndFilters(t *testing.T) {
	g := reviewFixture(t)
	session, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	if len(session.Instances) != 3 {
		t.Fatal(session)
	}
	for i := 1; i < len(session.Instances); i++ {
		if session.Instances[i-1].Context.Concept == session.Instances[i].Context.Concept {
			t.Fatal("avoidable adjacent concept repetition")
		}
	}
	empty, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Skill: "prove"}, reviewDay)
	if e != nil || len(empty.Instances) != 0 {
		t.Fatal("incompatible filter ignored")
	}
}
func TestReviewGenerationReproducibilityAndAnswers(t *testing.T) {
	template := canonicalReviewTemplate(t, "integer-witness-selection")
	for n := 0; n < 100; n++ {
		seed := fmt.Sprint(n)
		a := instantiateReview(template, ReviewState{}, "scheduled-review", "id", seed, "v", 1)
		b := instantiateReview(template, ReviewState{}, "scheduled-review", "id", seed, "v", 1)
		if !reflect.DeepEqual(a, b) {
			t.Fatal("instance unreproducible")
		}
		p := a.Context.Parameters
		if p["witness"]+p["a"] != p["sum"] || p["witnessPlusOne"] == p["witness"] || p["witnessMinusOne"] == p["witness"] {
			t.Fatal("invalid generated answer")
		}
		raw, _ := json.Marshal(a.Question)
		if strings.Contains(string(raw), "{{") {
			t.Fatal("unexpanded parameter")
		}
	}
}
func TestReviewSubmissionContextAndIdempotency(t *testing.T) {
	g := reviewFixture(t)
	session, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Concept: "logic"}, reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	instance := session.Instances[0]
	a := Submission{ID: newID(), Exercise: instance.Exercise, Submitted: reviewDay + 10, ContentVersion: instance.ContentVersion, Mode: "choice", ChoiceID: "yes", Text: "Yes", Review: &instance.Context}
	accepted, status, e := g.submit(a)
	if e != nil || status != 201 || accepted.Verdict != "correct" || !reflect.DeepEqual(accepted.Review, a.Review) {
		t.Fatalf("%+v %v %v", accepted, status, e)
	}
	_, status, e = g.submit(a)
	if e != nil || status != 200 {
		t.Fatal("offline retry is not idempotent", status, e)
	}
	a.ID = newID()
	forged := *a.Review
	forged.Kind = "scheduled-review"
	a.Review = &forged
	if _, status, e = g.submit(a); e == nil || status != 400 {
		t.Fatal("accepted forged context")
	}
}
func TestReviewExportImportRoundTripAndNoStateOverwrite(t *testing.T) {
	g := reviewFixture(t)
	session, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Concept: "logic"}, reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	instance := session.Instances[0]
	a := Submission{ID: newID(), Exercise: instance.Exercise, Submitted: reviewDay + 10, ContentVersion: instance.ContentVersion, Mode: "choice", ChoiceID: "yes", Text: "Yes", Review: &instance.Context}
	attempt, _, e := g.submit(a)
	if e != nil {
		t.Fatal(e)
	}
	_, before := summaryStates(t, g, 10*reviewDay)
	backup := ReviewImport{Attempts: []Attempt{attempt}}
	for _, key := range []string{"review-instance/" + instance.ID, "review-session/" + session.ID, "review-activation/" + instance.Context.key(), "review-state/" + instance.Context.key()} {
		r, e := record(g.server.db, key)
		if e != nil {
			t.Fatal(e)
		}
		backup.Records = append(backup.Records, r)
	}
	h := reviewFixture(t)
	if e = h.importReview(backup); e != nil {
		t.Fatal(e)
	}
	if e = h.importReview(backup); e != nil {
		t.Fatal("repeated import", e)
	}
	_, after := summaryStates(t, h, 10*reviewDay)
	if !reflect.DeepEqual(before, after) {
		t.Fatalf("state changed through import: %+v %+v", before, after)
	}
	restored, e := loadAttempt(h.server.db, a.ID)
	if e != nil || !reflect.DeepEqual(restored.Review, attempt.Review) {
		t.Fatal("lost review context", e)
	}
	backup.Records[len(backup.Records)-1].Payload = json.RawMessage(`{"dueAt":1,"intervalDays":999}`)
	if e = h.importReview(backup); e != nil {
		t.Fatal(e)
	}
	_, after = summaryStates(t, h, 10*reviewDay)
	if !reflect.DeepEqual(before, after) {
		t.Fatal("client state overwrote server")
	}
}
func TestReviewImportPreservesLegacyBudgetStatus(t *testing.T) {
	for _, legacy := range []bool{true, false} {
		t.Run(fmt.Sprintf("legacy=%t", legacy), func(t *testing.T) {
			g := reviewFixture(t)
			storeReviewAttempt(t, g, "lesson", reviewDay, "correct", g.catalog.ReviewTemplates[0].Analytics, nil)
			now := 20 * reviewDay
			session, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "quick", Concept: "logic", BudgetMinutes: 5}, now)
			if err != nil || len(session.Instances) != 1 {
				t.Fatalf("create issued task: %+v, %v", session, err)
			}
			original := session.Instances[0]
			if legacy {
				session.Instances[0].Category, session.Instances[0].EstimatedSeconds = "", 0
				session.ReviewPlanEstimate = ReviewPlanEstimate{}
			} else {
				// Modern imports still reconstruct cost from trusted content.
				session.Instances[0].Category, session.Instances[0].EstimatedSeconds = "proof", 999999
			}
			instanceRaw, _ := json.Marshal(session.Instances[0])
			sessionRaw, _ := json.Marshal(session)
			backup := ReviewImport{Records: []Record{
				{Key: "review-instance/" + original.ID, Version: Version{Payload: instanceRaw}},
				{Key: "review-session/" + session.ID, Version: Version{Payload: sessionRaw}},
			}}
			h := reviewFixture(t)
			if err := h.importReview(backup); err != nil {
				t.Fatal(err)
			}
			var restored ReviewInstance
			if err := reviewLoad(h.server.db, "review-instance/"+original.ID, &restored); err != nil {
				t.Fatal(err)
			}
			var restoredSession ReviewSession
			if err := reviewLoad(h.server.db, "review-session/"+session.ID, &restoredSession); err != nil {
				t.Fatal(err)
			}
			if len(restoredSession.Instances) != 1 || !reflect.DeepEqual(restoredSession.Instances[0], restored) {
				t.Fatal("session lost canonical restored instance")
			}
			if !reflect.DeepEqual(restored.Context, original.Context) || restored.ContentVersion != original.ContentVersion {
				t.Fatal("restore changed issued task identity")
			}
			if legacy {
				if restored.Category != "" || restored.EstimatedSeconds != 0 {
					t.Fatal("legacy import acquired a time reservation", restored.Category, restored.EstimatedSeconds)
				}
			} else {
				if restored.Category != original.Category || restored.EstimatedSeconds != original.EstimatedSeconds {
					t.Fatal("modern import did not reconstruct trusted cost")
				}
				summary, err := h.reviewSummary(now)
				if err != nil || summary["reservedMinutes"] != 1 {
					t.Fatal("modern import lost allowance reservation", summary, err)
				}
			}
		})
	}
}
func TestReviewRegradeReplayAndClericalRetries(t *testing.T) {
	for _, class := range []string{"clerical", "prompt-compliance", "conceptual"} {
		t.Run(class, func(t *testing.T) {
			g := reviewFixture(t)
			meta := g.catalog.ReviewTemplates[0].Analytics
			first := storeReviewAttempt(t, g, "lesson", reviewDay, "incorrect", meta, nil, Diagnosis{Class: class})
			storeReviewAttempt(t, g, "lesson", reviewDay+1000, "correct", meta, nil)
			_, states := summaryStates(t, g, reviewDay+1000)
			want := 6.0
			if class == "conceptual" {
				want = 2
			}
			if states["logic:recognize:"].IntervalDays != want {
				t.Fatal(states)
			}
			if _, e := g.server.db.Exec("UPDATE attempts SET verdict='correct',grades='[{\"verdict\":\"correct\"}]' WHERE id=?", first.ID); e != nil {
				t.Fatal(e)
			}
			_, states = summaryStates(t, g, reviewDay+1000)
			if states["logic:recognize:"].IntervalDays != 6 {
				t.Fatal("regrade was counted as another failure")
			}
		})
	}
}

func TestReviewPersistenceRestartAndArchivedBackup(t *testing.T) {
	g := reviewFixture(t)
	session, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Concept: "logic"}, reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	instance := session.Instances[0]
	submitted := Submission{ID: newID(), Exercise: instance.Exercise, Submitted: reviewDay + 1, Mode: "choice", ChoiceID: "yes", Text: "Yes", ContentVersion: instance.ContentVersion, Review: &instance.Context}
	attempt, _, e := g.submit(submitted)
	if e != nil {
		t.Fatal(e)
	}
	path := filepath.Join(t.TempDir(), "backup.db")
	if _, e = g.server.db.Exec("VACUUM INTO ?", path); e != nil {
		t.Fatal(e)
	}
	db, e := openDB(path)
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	reopened := &Grading{server: &Server{db: db}, catalog: g.catalog}
	_, before := summaryStates(t, g, 10*reviewDay)
	_, after := summaryStates(t, reopened, 10*reviewDay)
	if !reflect.DeepEqual(before, after) {
		t.Fatal("lost state on restart")
	}
	var saved ReviewInstance
	if e = reviewLoad(db, "review-instance/"+instance.ID, &saved); e != nil || !reflect.DeepEqual(saved.Context, instance.Context) {
		t.Fatal("lost stored instance", e)
	}
	backup := ReviewImport{Attempts: []Attempt{attempt}}
	r, e := record(db, "review-instance/"+instance.ID)
	if e != nil {
		t.Fatal(e)
	}
	backup.Records = append(backup.Records, r)
	newer := reviewFixture(t)
	newer.catalog.Version = "newer"
	newer.catalog.ReviewTemplates[0].Question["instructions"] = "A changed current question"
	if e = newer.importReview(backup); e != nil {
		t.Fatal("cannot restore archived context", e)
	}
	var archived ReviewInstance
	reviewLoad(newer.server.db, "review-instance/"+instance.ID, &archived)
	if archived.Question["instructions"] != "Choose" || string(archived.Teaching) != string(instance.Teaching) {
		t.Fatal("rewrote historical task")
	}
}
func TestReviewImportRejectsMalformedOrTamperedInstances(t *testing.T) {
	g := reviewFixture(t)
	session, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick", Concept: "logic"}, reviewDay)
	if e != nil {
		t.Fatal(e)
	}
	instance := session.Instances[0]
	instance.Question["instructions"] = "Tampered"
	raw, _ := json.Marshal(instance)
	h := reviewFixture(t)
	if e = h.importReview(ReviewImport{Records: []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}}); e == nil {
		t.Fatal("accepted altered current template")
	}
	instance.ContentVersion = "old"
	raw, _ = json.Marshal(instance)
	if e = h.importReview(ReviewImport{Records: []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}}); e == nil {
		t.Fatal("accepted inconsistent archived context")
	}
}
func TestReviewAuthoredVariantsReproduceAndDifferentSeedsVary(t *testing.T) {
	tplt := ReviewTemplate{ID: "definition", Variants: []map[string]any{{"prompt": "Define the term"}, {"prompt": "Name this definition"}}}
	seen := map[string]bool{}
	for n := 0; n < 20; n++ {
		seed := fmt.Sprint(n)
		a := instantiateReview(tplt, ReviewState{}, "focused-practice", "id", seed, "v", 1)
		b := instantiateReview(tplt, ReviewState{}, "focused-practice", "id", seed, "v", 1)
		if !reflect.DeepEqual(a.Question, b.Question) {
			t.Fatal("authored variant changed")
		}
		seen[a.Question["prompt"].(string)] = true
	}
	if len(seen) != 2 {
		t.Fatal("never selected alternate variant")
	}
}
