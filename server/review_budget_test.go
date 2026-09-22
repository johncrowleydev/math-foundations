package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"sync"
	"testing"
)

func budgetFixture(t *testing.T, quick, application, deep int) *Grading {
	t.Helper()
	g := reviewFixture(t)
	base := g.catalog.ReviewTemplates[0]
	g.catalog.ReviewTemplates = nil
	tx, err := g.server.db.Begin()
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback()
	for index, category := range []string{"multiple-choice", "short-application", "proof"} {
		for i := 0; i < []int{quick, application, deep}[index]; i++ {
			id := fmt.Sprintf("%s-%02d", category, i)
			template := base
			template.ID, template.Concept, template.Category = id, id, category
			template.Question = map[string]any{"id": 1, "section": "Synthetic", "prompt": id, "answer": "Fixture"}
			template.Analytics = nil
			if category == "proof" {
				template.Skill, template.EvidenceLevel = "prove", "reasoning"
			}
			g.catalog.ReviewTemplates = append(g.catalog.ReviewTemplates, template)
			if err := reviewPut(tx, "review-activation/"+template.key(), map[string]any{"target": template.ReviewTarget, "at": reviewDay}); err != nil {
				t.Fatal(err)
			}
		}
	}
	if err := tx.Commit(); err != nil {
		t.Fatal(err)
	}
	return g
}

func TestReviewBudgetReservesAllIssuedWorkAcrossRepeatedStarts(t *testing.T) {
	g := budgetFixture(t, 40, 0, 0)
	now := 20 * reviewDay
	req := ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular", BudgetMinutes: 5}
	preview, err := g.reviewSummary(now, 5)
	if err != nil {
		t.Fatal(err)
	}
	if preview["estimatedMinutes"] != 5 || preview["plannedQuick"] != 10 {
		t.Fatal(preview)
	}
	session, err := g.planReview(req, now)
	if err != nil {
		t.Fatal(err)
	}
	if len(session.Instances) != 10 || session.EstimatedMinutes != 5 || session.RemainingMinutes != 0 {
		t.Fatal(session)
	}
	// One completed answer, one started answer and eight unvisited questions all
	// retain their time reservations; neither retries nor abandoning reset them.
	first := session.Instances[0]
	storeReviewAttempt(t, g, first.Exercise, now+1, "correct", first.Analytics, &first.Context)
	second := session.Instances[1]
	storeReviewAttempt(t, g, second.Exercise, now+1, "incorrect", second.Analytics, &second.Context)
	repeat, err := g.planReview(req, now+2)
	if err != nil || len(repeat.Instances) != 0 || repeat.ReservedMinutes != 5 {
		t.Fatalf("unlimited repeated starts: %+v, %v", repeat, err)
	}
	nextDay, err := g.planReview(req, now+reviewDay)
	if err != nil || len(nextDay.Instances) != 10 {
		t.Fatalf("allowance did not renew: %+v, %v", nextDay, err)
	}
}

func TestReviewBudgetLargerTargetOnlyIssuesNewWork(t *testing.T) {
	g := budgetFixture(t, 40, 0, 0)
	now := 20 * reviewDay
	first, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "quick", BudgetMinutes: 5}, now)
	if err != nil {
		t.Fatal(err)
	}
	second, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular", BudgetMinutes: 10}, now)
	if err != nil {
		t.Fatal(err)
	}
	if len(first.Instances) != 10 || len(second.Instances) != 10 || second.ReservedMinutes != 5 {
		t.Fatalf("wrong reservation: %+v", second)
	}
	seen := map[string]bool{}
	for _, instance := range first.Instances {
		seen[instance.Context.key()] = true
	}
	for _, instance := range second.Instances {
		if seen[instance.Context.key()] {
			t.Fatal("reissued today's target")
		}
	}
}

func TestReviewDeepWeeklyCadenceAndMinorityOfActualPlan(t *testing.T) {
	g := budgetFixture(t, 10, 5, 2)
	now := 20 * reviewDay
	req := ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular"}
	session, err := g.planReview(req, now)
	if err != nil {
		t.Fatal(err)
	}
	total, deep := reviewPlanSeconds(session.Instances)
	if session.PlannedDeep != 1 || total != 1500 || deep != 600 {
		t.Fatalf("wrong balanced mix: %+v", session.ReviewPlanEstimate)
	}
	nextDay, err := g.planReview(req, now+reviewDay)
	if err != nil || nextDay.PlannedDeep != 0 {
		t.Fatalf("proof repeated before weekly opportunity: %+v %v", nextDay, err)
	}
	nextWeek, err := g.planReview(req, now+7*reviewDay)
	if err != nil || nextWeek.PlannedDeep != 1 {
		t.Fatalf("proof opportunity never returns: %+v %v", nextWeek, err)
	}
	lone := budgetFixture(t, 1, 0, 1)
	_, before := summaryStates(t, lone, now)
	sparse, err := lone.planReview(req, now)
	if err != nil || sparse.PlannedDeep != 0 || len(sparse.Instances) != 1 {
		t.Fatalf("deep dominates a small plan: %+v %v", sparse, err)
	}
	_, after := summaryStates(t, lone, now)
	if !reflect.DeepEqual(before, after) {
		t.Fatal("budget deferral changed due states")
	}
	deliberate, err := lone.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular", Skill: "prove"}, now)
	if err != nil || deliberate.PlannedDeep != 1 {
		t.Fatal("intentional proof practice unavailable", err)
	}
}

func TestReviewBudgetSummaryDoesNotIssueOrReserveWork(t *testing.T) {
	g := budgetFixture(t, 10, 1, 1)
	a, err := g.reviewSummary(20 * reviewDay)
	if err != nil {
		t.Fatal(err)
	}
	b, err := g.reviewSummary(20 * reviewDay)
	if err != nil || !reflect.DeepEqual(a, b) {
		t.Fatal("unstable preview", err)
	}
	var count int
	if err := g.server.db.QueryRow("SELECT COUNT(*) FROM records WHERE key LIKE 'review-instance/%' OR key LIKE 'review-session/%'").Scan(&count); err != nil || count != 0 {
		t.Fatal("preview issued records", err, count)
	}
}

func TestReviewBudgetLegacyInstancesUseFrozenQuestion(t *testing.T) {
	g := budgetFixture(t, 10, 0, 0)
	now := 20 * reviewDay
	session, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular", BudgetMinutes: 5}, now)
	if err != nil {
		t.Fatal(err)
	}
	tx, _ := g.server.db.Begin()
	for _, instance := range session.Instances {
		instance.Category, instance.EstimatedSeconds = "", 0
		instance.Context.Skill = "prove"
		instance.Question["prompt"] = "Prove the synthetic statement."
		if err := reviewPut(tx, "review-instance/"+instance.ID, instance); err != nil {
			t.Fatal(err)
		}
	}
	tx.Commit()
	summary, err := g.reviewSummary(now)
	if err != nil || summary["reservedMinutes"] != 100 || summary["estimatedMinutes"] != 0 {
		t.Fatal("legacy costs lost", summary, err)
	}
}

func TestReviewBudgetValidation(t *testing.T) {
	g := reviewFixture(t)
	for _, value := range []int{-1, 1, 4, 61, 100000} {
		if _, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular", BudgetMinutes: value}, reviewDay); err == nil {
			t.Fatal("invalid budget accepted", value)
		}
		if _, err := g.reviewSummary(reviewDay, value); err == nil {
			t.Fatal("invalid preview budget accepted", value)
		}
	}
}

func TestReviewCostPreservesEvidenceAndFrozenQuestion(t *testing.T) {
	g := reviewFixture(t)
	template := g.catalog.ReviewTemplates[1]
	before, _ := json.Marshal(template.Question)
	instance := instantiateReview(template, ReviewState{}, "scheduled-review", "id", "seed", "v", reviewDay)
	if instance.Category != "proof" || instance.EstimatedSeconds != 600 || instance.EvidenceLevel != "reasoning" {
		t.Fatal(instance)
	}
	after, _ := json.Marshal(instance.Question)
	if string(before) != string(after) {
		t.Fatal("cost metadata changed frozen question")
	}
	template.Category = "definition"
	instance = instantiateReview(template, ReviewState{}, "scheduled-review", "id", "seed", "v", reviewDay)
	if instance.Category != "definition" || instance.EstimatedSeconds != 20 || instance.EvidenceLevel != "reasoning" {
		t.Fatal("cost rewrote evidence depth")
	}
}

func TestReviewBudgetConcurrentStartsShareOneAllowance(t *testing.T) {
	g := budgetFixture(t, 30, 0, 0)
	var pending sync.WaitGroup
	sessions := make(chan ReviewSession, 2)
	errs := make(chan error, 2)
	for range 2 {
		pending.Add(1)
		go func() {
			defer pending.Done()
			session, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular", BudgetMinutes: 5}, 20*reviewDay)
			sessions <- session
			errs <- err
		}()
	}
	pending.Wait()
	close(sessions)
	close(errs)
	for err := range errs {
		if err != nil {
			t.Fatal(err)
		}
	}
	total := 0
	for session := range sessions {
		seconds, _ := reviewPlanSeconds(session.Instances)
		total += seconds
	}
	if total != 300 {
		t.Fatal("concurrent starts exceeded the shared allowance", total)
	}
}

func TestReviewBudgetHTTPContract(t *testing.T) {
	g := reviewFixture(t)
	for _, value := range []string{"4", "61", "word", "12.5"} {
		response := call(g.server, "GET", "/api/v1/review?budgetMinutes="+value, nil, true)
		if response.Code != http.StatusBadRequest {
			t.Fatal("invalid HTTP budget accepted", value, response.Code)
		}
	}
	response := call(g.server, "GET", "/api/v1/review?budgetMinutes=10", nil, true)
	var summary ReviewPlanEstimate
	if response.Code != http.StatusOK || json.Unmarshal(response.Body.Bytes(), &summary) != nil || summary.BudgetMinutes != 10 {
		t.Fatal("missing HTTP preview contract", response.Body.String())
	}
}

func TestReviewBudgetIsTimeBasedBeyondOldThirtyItemCap(t *testing.T) {
	g := budgetFixture(t, 80, 0, 0)
	for i := range g.catalog.ReviewTemplates {
		g.catalog.ReviewTemplates[i].Category = "definition"
	}
	session, err := g.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular"}, 20*reviewDay)
	if err != nil || len(session.Instances) != 75 || session.EstimatedMinutes != 25 {
		t.Fatalf("old item-count cap prevented a full time allowance: %+v, %v", session.ReviewPlanEstimate, err)
	}
}

func TestReviewRecallCostsDoNotDowngradeRequiredReasoning(t *testing.T) {
	g := reviewFixture(t)
	template := g.catalog.ReviewTemplates[0]
	template.Skill = "recall"
	category, seconds := template.questionCost(template.Question)
	if category != "definition" || seconds != 20 {
		t.Fatal("terminology choices lost their low cost")
	}
	template.Analytics = json.RawMessage(`{"skills":[{"skill":"recall","role":"primary"},{"skill":"justify","role":"primary"}]}`)
	delete(template.Question, "choice")
	category, seconds = template.questionCost(template.Question)
	if category != "deep-reasoning" || seconds != 300 {
		t.Fatal("recall tag concealed required reasoning")
	}
}
