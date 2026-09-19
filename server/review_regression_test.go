package main

import (
	"math"
	"reflect"
	"testing"
)

func TestReviewCorrectedExerciseCanDemonstrateLaterRetention(t *testing.T) {
	g := reviewFixture(t)
	meta := g.catalog.ReviewTemplates[0].Analytics
	storeReviewAttempt(t, g, "lesson-1", reviewDay, "incorrect", meta, nil, Diagnosis{Class: "conceptual"})
	storeReviewAttempt(t, g, "lesson-1", reviewDay+1000, "correct", meta, nil)

	for _, step := range []struct {
		name string
		at   int64
		days float64
	}{
		{"immediate correction retains retry penalty", reviewDay + 1000, 2},
		{"later clean attempt has no stale error", 10 * reviewDay, 6},
		{"ordinary practice expands conservatively", 20 * reviewDay, 7.5},
	} {
		t.Run(step.name, func(t *testing.T) {
			if step.at > reviewDay+1000 {
				storeReviewAttempt(t, g, "lesson-1", step.at, "correct", meta, nil)
			}
			_, states := summaryStates(t, g, step.at)
			state := states["logic:recognize:"]
			if state.IntervalDays != step.days || state.DueAt != step.at+int64(step.days*float64(reviewDay)) {
				t.Errorf("state after %s: %+v; want interval %v days", step.name, state, step.days)
			}
			if state.LastReviewedAt != nil {
				t.Error("ordinary lesson evidence fabricated review history")
			}
			_, replayed := summaryStates(t, g, step.at)
			if !reflect.DeepEqual(states, replayed) {
				t.Error("replaying unchanged evidence changed review state")
			}
		})
	}
}

func TestReviewRetryErrorsPersistUntilCorrectAndThenStartFresh(t *testing.T) {
	g := reviewFixture(t)
	meta := g.catalog.ReviewTemplates[0].Analytics
	storeReviewAttempt(t, g, "lesson-1", reviewDay, "incorrect", meta, nil, Diagnosis{Class: "conceptual"})
	storeReviewAttempt(t, g, "lesson-1", reviewDay+1000, "not_graded", meta, nil)
	storeReviewAttempt(t, g, "lesson-1", reviewDay+2000, "correct", meta, nil)
	_, states := summaryStates(t, g, reviewDay+2000)
	if states["logic:recognize:"].IntervalDays != 2 {
		t.Fatalf("not_graded cleared the unresolved substantive error: %+v", states)
	}

	storeReviewAttempt(t, g, "lesson-1", 10*reviewDay, "incorrect", meta, nil, Diagnosis{Class: "conceptual"})
	storeReviewAttempt(t, g, "lesson-1", 10*reviewDay+1000, "correct", meta, nil)
	_, states = summaryStates(t, g, 10*reviewDay+1000)
	if states["logic:recognize:"].IntervalDays != 2 {
		t.Errorf("new correction counted an error from an already corrected attempt: %+v", states)
	}

	storeReviewAttempt(t, g, "lesson-1", 20*reviewDay, "incorrect", meta, nil, Diagnosis{Class: "conceptual"})
	storeReviewAttempt(t, g, "lesson-1", 20*reviewDay+1000, "incorrect", meta, nil, Diagnosis{Class: "conceptual"})
	storeReviewAttempt(t, g, "lesson-1", 20*reviewDay+2000, "correct", meta, nil)
	_, states = summaryStates(t, g, 20*reviewDay+2000)
	if states["logic:recognize:"].IntervalDays != 1 {
		t.Errorf("multiple errors in the current retry sequence were lost: %+v", states)
	}
}

func TestReviewDelayedExpansionRequiresExplicitScheduledContext(t *testing.T) {
	for _, kind := range []string{"", "lesson", "focused-practice", "scheduled-review"} {
		name := kind
		if name == "" {
			name = "absent context"
		}
		for _, unsure := range []bool{false, true} {
			label := name + "/clean"
			if unsure {
				label = name + "/unsure"
			}
			t.Run(label, func(t *testing.T) {
				want := 7.5
				if kind == "scheduled-review" {
					want = 12
				}
				if unsure {
					want = 7.2
				}
				state := scheduleReview(ReviewState{IntervalDays: 6}, reviewSignal{Correct: true, Delayed: true, Kind: kind, Unsure: unsure}, 10*reviewDay)
				if math.Abs(state.IntervalDays-want) > 0.00001 {
					t.Errorf("interval = %v; want %v for kind %q, unsure %v", state.IntervalDays, want, kind, unsure)
				}
			})
		}
	}
}
