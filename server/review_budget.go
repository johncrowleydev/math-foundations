package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"regexp"
	"strings"
)

const defaultReviewBudgetMinutes = 25

var errReviewBudget = errors.New("Review budget must be a whole number from 5 to 60 minutes")

// Estimated work is deliberately separate from interaction cost/evidence depth.
var reviewCategorySeconds = map[string]int{
	"definition": 20, "true-false": 20, "multiple-choice": 30,
	"short-answer": 60, "short-application": 120, "deep-reasoning": 300, "proof": 600,
}
var proofCostWords = regexp.MustCompile(`(?i)\b(prove|proof|show that)\b`)
var recallCostWords = regexp.MustCompile(`(?i)\b(state|name|identify|define)\b`)

func (t ReviewTemplate) questionCost(q map[string]any) (string, int) {
	category := t.Category
	if v, ok := q["category"].(string); ok && reviewCategorySeconds[v] > 0 {
		category = v
	}
	if reviewCategorySeconds[category] == 0 {
		category = ""
	}
	skills := []string{t.Skill}
	var meta reviewAnalytics
	json.Unmarshal(t.Analytics, &meta)
	for _, skill := range meta.Skills {
		if skill.Role == "primary" {
			skills = append(skills, skill.Skill)
		}
	}
	if category == "" && contains(skills, "recall") && !contains(skills, "prove") && !contains(skills, "justify") && !contains(skills, "explain") && !contains(skills, "reason") && !contains(skills, "evaluate") {
		category = "definition"
	}
	if category == "" && q["choice"] != nil {
		var choice ChoiceAssessment
		raw, _ := json.Marshal(q["choice"])
		json.Unmarshal(raw, &choice)
		labels := map[string]bool{}
		for _, option := range choice.Options {
			labels[strings.ToLower(strings.TrimSpace(option.Text))] = true
		}
		category = "multiple-choice"
		if len(choice.Options) == 2 && labels["true"] && labels["false"] {
			category = "true-false"
		}
	}
	if category == "" {
		if a := assessmentFromQuestion(q); a != nil {
			category = "short-application"
			if len(a.Inputs) == 1 {
				switch a.Inputs[0].Kind {
				case "boolean":
					category = "true-false"
				case "select":
					category = "multiple-choice"
				case "text", "math":
					if a.Evidence.InteractionCost == "low" {
						category = "short-answer"
					}
				}
			}
		}
	}
	if category == "" {
		prompt, _ := q["prompt"].(string)
		instructions, _ := q["instructions"].(string)
		text := instructions + " " + prompt
		switch {
		case contains(skills, "prove") || proofCostWords.MatchString(text):
			category = "proof"
		case contains(skills, "justify") || contains(skills, "explain") || contains(skills, "reason") || contains(skills, "evaluate") || t.EvidenceLevel == "reasoning":
			category = "deep-reasoning"
		case recallCostWords.MatchString(text):
			category = "short-answer"
		default:
			category = "short-application"
		}
	}
	return category, reviewCategorySeconds[category]
}
func deepReviewCategory(category string) bool {
	return category == "proof" || category == "deep-reasoning"
}
func reviewBudget(minutes int) (int, error) {
	if minutes == 0 {
		return defaultReviewBudgetMinutes, nil
	}
	if minutes < 5 || minutes > 60 {
		return 0, errReviewBudget
	}
	return minutes, nil
}

type ReviewPlanEstimate struct {
	BudgetMinutes      int `json:"budgetMinutes"`
	EstimatedMinutes   int `json:"estimatedMinutes"`
	ReservedMinutes    int `json:"reservedMinutes"`
	RemainingMinutes   int `json:"remainingMinutes"`
	PlannedQuick       int `json:"plannedQuick"`
	PlannedApplication int `json:"plannedApplication"`
	PlannedDeep        int `json:"plannedDeep"`
}
type reviewAllowance struct {
	Seconds    int
	DeepRecent bool
	Targets    map[string]bool
	Sources    map[string]bool
	Questions  map[string]bool
}

// Reserve budgeted scheduled work for 24 elapsed hours, whether answered, skipped,
// offline, or abandoned. Pre-budget queues never reserved a time allowance.
// Clicking Start again cannot issue the same day's budgeted work.
// Focused practice remains deliberate extra work, but still delays another deep task.
func reviewIssuedAllowance(tx *sql.Tx, templates []ReviewTemplate, now int64) (reviewAllowance, error) {
	usage := reviewAllowance{Targets: map[string]bool{}, Sources: map[string]bool{}, Questions: map[string]bool{}}
	rows, err := tx.Query("SELECT payload FROM versions JOIN records ON versions.id=records.head WHERE records.key LIKE 'review-instance/%'")
	if err != nil {
		return usage, err
	}
	defer rows.Close()
	for rows.Next() {
		var raw string
		if err := rows.Scan(&raw); err != nil {
			return usage, err
		}
		var instance ReviewInstance
		if err := json.Unmarshal([]byte(raw), &instance); err != nil {
			return usage, err
		}
		// The old count-based planner issued potentially hours of work at once.
		// Do not retroactively charge it or let its unvisited tasks block a new
		// plan. Attempts still supply their normal scheduling evidence.
		if instance.EstimatedSeconds <= 0 {
			continue
		}
		at := instance.Context.PresentedAt
		if at > now || at <= now-7*reviewDay {
			continue
		}
		// The positive estimate identifies budgeted issuance; derive the amount
		// from the frozen task, not today's curriculum or the stored estimate.
		template := ReviewTemplate{ReviewTarget: instance.Context.ReviewTarget, Category: instance.Category, EvidenceLevel: instance.EvidenceLevel, Analytics: instance.Analytics}
		category, seconds := template.questionCost(instance.Question)
		if deepReviewCategory(category) {
			usage.DeepRecent = true
		}
		if instance.Context.Kind != "scheduled-review" || at <= now-reviewDay {
			continue
		}
		usage.Seconds += seconds
		usage.Targets[instance.Context.key()] = true
		usage.Sources[instance.SourceTarget] = true
		usage.Questions[reviewQuestionFingerprint(instance.Question)] = true
		var meta reviewAnalytics
		json.Unmarshal(instance.Analytics, &meta)
		for _, t := range templates {
			if depth(instance.EvidenceLevel) >= depth(t.EvidenceLevel) && t.matchesEvidence(meta) {
				usage.Targets[t.key()] = true
			}
		}
	}
	return usage, rows.Err()
}
func reviewPlanSeconds(instances []ReviewInstance) (total, deep int) {
	for _, instance := range instances {
		total += instance.EstimatedSeconds
		if deepReviewCategory(instance.Category) {
			deep += instance.EstimatedSeconds
		}
	}
	return
}
func estimateReviewPlan(instances []ReviewInstance, minutes int, usage reviewAllowance) ReviewPlanEstimate {
	total, _ := reviewPlanSeconds(instances)
	result := ReviewPlanEstimate{BudgetMinutes: minutes, EstimatedMinutes: (total + 59) / 60, ReservedMinutes: (usage.Seconds + 59) / 60, RemainingMinutes: max(0, minutes*60-usage.Seconds-total) / 60}
	for _, instance := range instances {
		switch instance.Category {
		case "proof", "deep-reasoning":
			result.PlannedDeep++
		case "short-application":
			result.PlannedApplication++
		default:
			result.PlannedQuick++
		}
	}
	return result
}
