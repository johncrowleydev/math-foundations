package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"reflect"
	"strings"
	"testing"
)

func catalogAPIFixture(t *testing.T) *Grading {
	t.Helper()
	g := reviewFixture(t)
	// Include both filtering paths: choice tasks cannot provide construction
	// evidence, and shallower tasks for a production target are not effective.
	g.catalog.Exercises = map[string]json.RawMessage{
		"lesson-1": json.RawMessage(`{"question":{"instructions":"Choose.","prompt":"Recognize a set.","officialAnswer":"Yes."},"choice":{"correctOption":"yes","options":[{"id":"yes","text":"Yes","feedback":"Correct"},{"id":"no","text":"No","feedback":"Try again"}]},"analytics":{"concepts":[{"concept":"sets","role":"primary"}],"skills":[{"skill":"recognize","role":"primary"}]}}`),
		"lesson-2": json.RawMessage(`{"question":{"instructions":"Prove the claim.","prompt":"Show set inclusion.","officialAnswer":"A proof."},"analytics":{"concepts":[{"concept":"set-inclusion","role":"primary"}],"skills":[{"skill":"prove","role":"primary"}]}}`),
		"lesson-3": json.RawMessage(`{"question":{"instructions":"Recall.","prompt":"Define a set.","officialAnswer":"A collection."},"analytics":{"concepts":[{"concept":"sets","role":"primary"}],"skills":[{"skill":"recall","role":"primary"}]}}`),
		"lesson-4": json.RawMessage(`{"question":{"instructions":"Choose.","prompt":"Recognize a definition.","officialAnswer":"A collection."},"choice":{"correctOption":"yes","options":[{"id":"yes","text":"A collection","feedback":"Correct"},{"id":"no","text":"An element","feedback":"Try again"}]},"analytics":{"concepts":[{"concept":"sets","role":"primary"}],"skills":[{"skill":"recall","role":"primary"}]}}`),
		"lesson-5": json.RawMessage(`{"question":{"instructions":"Choose.","prompt":"Choose a set.","officialAnswer":"A."},"choice":{"correctOption":"a","options":[{"id":"a","text":"A","feedback":"Correct"},{"id":"b","text":"B","feedback":"Try again"}]},"analytics":{"concepts":[{"concept":"sets","role":"primary"}],"skills":[{"skill":"construct","role":"primary"}]}}`),
	}
	definition := ReviewTemplate{
		ID: "definition", ReviewTarget: ReviewTarget{Concept: "existential-quantification", Skill: "recall", Objective: "witness-definition"},
		Family: "fixed", Lesson: "lesson", EvidenceLevel: "production", CognitiveLevel: "recall",
		InteractionCost: "low", InputCapabilities: []string{"short-text"}, ActivationConcepts: []string{"existential-quantification"},
		Question:  map[string]any{"id": 1, "section": "Review", "instructions": "Recall.", "prompt": "Define witness.", "answer": "A satisfying value."},
		Analytics: json.RawMessage(`{"internal":"grading metadata"}`), Teaching: json.RawMessage(`{"internal":"teaching context"}`),
	}
	variants := definition
	variants.ID, variants.Family = "definition-variants", "authored"
	variants.Variants = []map[string]any{
		definition.Question,
		{"id": 1, "section": "Review", "instructions": "Recall.", "prompt": "Name a satisfying value.", "answer": "Witness."},
	}
	generated := ReviewTemplate{
		ID: "integer-witness-selection", ReviewTarget: ReviewTarget{Concept: "existential-quantification", Skill: "interpret", Objective: "witness-selection"},
		Family: "generated", Generator: "integer-witness-sum", Lesson: "lesson", EvidenceLevel: "recognition", CognitiveLevel: "apply",
		InteractionCost: "low", InputCapabilities: []string{"tap"}, ActivationConcepts: []string{"existential-quantification"},
		Question: map[string]any{
			"id": 1, "section": "Review", "instructions": "Choose.", "prompt": "x + {{a}} = {{sum}}", "answer": "{{witness}}",
			"choice": map[string]any{"correctOption": "witness", "options": []map[string]string{
				{"id": "witness", "text": "{{witness}}", "feedback": "Correct"},
				{"id": "above", "text": "{{witnessPlusOne}}", "feedback": "Too high"},
			}},
		},
	}
	generated.ParameterVariants = canonicalReviewTemplate(t, "integer-witness-selection").ParameterVariants
	shallow := definition
	shallow.ID, shallow.EvidenceLevel = "shallow-definition", "recognition"
	g.catalog.ReviewTemplates = []ReviewTemplate{definition, variants, generated, shallow}
	return g
}

func TestReviewCatalogHTTPUsesEffectiveTemplates(t *testing.T) {
	g := catalogAPIFixture(t)
	w := call(g.server, "GET", "/api/v1/review/catalog", nil, true)
	if w.Code != http.StatusOK {
		t.Fatalf("catalog status: %d %s", w.Code, w.Body.String())
	}
	var catalog ReviewCatalog
	if err := json.Unmarshal(w.Body.Bytes(), &catalog); err != nil {
		t.Fatal(err)
	}
	if catalog.ContentVersion != g.catalog.Version {
		t.Fatal("missing content version")
	}
	items := map[string]ReviewCatalogItem{}
	for _, item := range catalog.Items {
		items[item.ID] = item
	}
	wantIDs := []string{"definition", "definition-variants", "exercise-lesson-1-sets-recognize", "exercise-lesson-2-set-inclusion-prove", "exercise-lesson-3-sets-recall", "integer-witness-selection"}
	var ids []string
	for _, item := range catalog.Items {
		ids = append(ids, item.ID)
	}
	if !reflect.DeepEqual(ids, wantIDs) {
		t.Fatalf("effective catalog (including eligibility/depth filters): %v", ids)
	}
	templates := g.reviewTemplates()
	if len(catalog.Items) != len(templates) {
		t.Fatal("API and scheduler catalog sizes differ")
	}
	for _, template := range templates {
		item, ok := items[template.ID]
		if !ok || item.Quick != template.quick() || item.ReviewTarget != template.ReviewTarget || item.EvidenceLevel != template.EvidenceLevel {
			t.Fatalf("scheduler/API mismatch: %+v %+v", template, item)
		}
	}
	for _, id := range []string{"definition", "definition-variants", "integer-witness-selection"} {
		item := items[id]
		if item.Provenance != "review-template" || item.Origin != "content/review-templates.json" || item.SourceTarget != "review:"+id || item.OriginalExercise != "" || !item.Quick {
			t.Fatalf("dedicated template provenance or Quick mismatch: %+v", item)
		}
	}
	definition := items["definition"]
	if definition.Concept != "existential-quantification" || definition.Skill != "recall" || definition.Objective != "witness-definition" || definition.EvidenceLevel != "production" || definition.CognitiveLevel != "recall" || definition.VariantCount != 0 || definition.Question["answer"] != "A satisfying value." || !reflect.DeepEqual(definition.ActivationConcepts, []string{"existential-quantification"}) {
		t.Fatalf("definition metadata: %+v", definition)
	}
	variants := items["definition-variants"]
	if variants.VariantCount != 2 || len(variants.Variants) != 2 || variants.Family != "authored" || variants.Variants[1]["answer"] != "Witness." {
		t.Fatalf("authored variants: %+v", variants)
	}
	generated := items["integer-witness-selection"]
	if !generated.Generated || generated.Generator != "integer-witness-sum" || generated.Family != "generated" || generated.EvidenceLevel != "recognition" || generated.VariantCount != 0 {
		t.Fatalf("generator metadata: %+v", generated)
	}
	for _, test := range []struct {
		id, original, concept, skill, evidence string
		quick                                  bool
	}{
		{"exercise-lesson-1-sets-recognize", "lesson-1", "sets", "recognize", "recognition", true},
		{"exercise-lesson-2-set-inclusion-prove", "lesson-2", "set-inclusion", "prove", "reasoning", false},
		{"exercise-lesson-3-sets-recall", "lesson-3", "sets", "recall", "production", false},
	} {
		item := items[test.id]
		if item.Provenance != "lesson-exercise" || item.OriginalExercise != test.original || item.Origin != "lesson:lesson" || item.SourceTarget != "exercise:"+test.original || item.Concept != test.concept || item.Skill != test.skill || item.EvidenceLevel != test.evidence || item.Quick != test.quick || item.Objective != "" || item.Generated || item.Family != "fixed" || item.Lesson != "lesson" {
			t.Fatalf("lesson exercise metadata: %+v", item)
		}
	}
	if items["exercise-lesson-1-sets-recognize"].Question["answer"] != "Yes." || items["exercise-lesson-1-sets-recognize"].Question["choice"] == nil {
		t.Fatal("reused question lost its answer or choices")
	}
	var payload map[string]json.RawMessage
	json.Unmarshal(w.Body.Bytes(), &payload)
	if len(payload) != 2 {
		t.Fatalf("unexpected catalog envelope: %s", w.Body.String())
	}
	var rawItems []map[string]json.RawMessage
	json.Unmarshal(payload["items"], &rawItems)
	for _, item := range rawItems {
		for _, internal := range []string{"analytics", "teaching", "dueAt", "intervalDays", "context", "state"} {
			if _, ok := item[internal]; ok {
				t.Fatalf("catalog exposed %s", internal)
			}
		}
	}
}

func TestReviewCatalogPreviewUsesSchedulerGenerationWithoutPersistence(t *testing.T) {
	g := catalogAPIFixture(t)
	before, _ := json.Marshal(g.catalog)
	preview := func(id, seed string) ReviewCatalogPreview {
		t.Helper()
		w := call(g.server, "GET", "/api/v1/review/catalog/"+id+"/preview?seed="+url.QueryEscape(seed), nil, true)
		if w.Code != http.StatusOK {
			t.Fatalf("preview status: %d %s", w.Code, w.Body.String())
		}
		var result ReviewCatalogPreview
		if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		if result.TemplateID != id || result.Seed != seed || result.Parameters == nil {
			t.Fatalf("preview envelope: %+v", result)
		}
		if strings.Contains(w.Body.String(), "{{") || strings.Contains(w.Body.String(), `"context"`) || strings.Contains(w.Body.String(), `"instanceId"`) {
			t.Fatalf("preview contains unexpanded slots or learner context: %s", w.Body.String())
		}
		return result
	}
	generated := preview("integer-witness-selection", "sample 1")
	if !reflect.DeepEqual(generated, preview("integer-witness-selection", "sample 1")) {
		t.Fatal("same seed did not reproduce the same preview")
	}
	if reflect.DeepEqual(generated.Parameters, preview("integer-witness-selection", "sample 2").Parameters) {
		t.Fatal("different sample seeds did not vary generated parameters")
	}
	params := generated.Parameters
	if params["witness"]+params["a"] != params["sum"] || generated.Question["choice"] == nil {
		t.Fatalf("incorrect generated question: %+v", generated)
	}
	for _, template := range g.reviewTemplates() {
		for _, seed := range []string{"sample 1", "sample 2"} {
			result := preview(template.ID, seed)
			issued := instantiateReview(template, ReviewState{}, "focused-practice", "instance", seed, g.catalog.Version, reviewDay)
			if !reflect.DeepEqual(result.Question, issued.Question) {
				t.Fatalf("preview differs from issued question for %s", template.ID)
			}
			if len(result.Parameters) > 0 && !reflect.DeepEqual(result.Parameters, issued.Context.Parameters) {
				t.Fatal("preview differs from issued parameters")
			}
		}
	}
	if w := call(g.server, "GET", "/api/v1/review/catalog", nil, true); w.Code != http.StatusOK {
		t.Fatal(w.Code)
	}
	for _, table := range []string{"records", "versions", "changes", "operations", "attempts", "grading_jobs"} {
		var count int
		if err := g.server.db.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&count); err != nil || count != 0 {
			t.Fatalf("read-only catalog/preview populated %s: %d %v", table, count, err)
		}
	}
	after, _ := json.Marshal(g.catalog)
	if string(before) != string(after) {
		t.Fatal("preview mutated authored catalog")
	}
}

func TestReviewCatalogRoutesNeedNoLearnerDatabase(t *testing.T) {
	g := catalogAPIFixture(t)
	s := &Server{grading: &Grading{catalog: g.catalog}}
	mux := http.NewServeMux()
	s.reviewCatalogRoutes(mux)
	for _, path := range []string{"/api/v1/review/catalog", "/api/v1/review/catalog/integer-witness-selection/preview?seed=fresh"} {
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != http.StatusOK {
			t.Fatalf("catalog depends on learner database: %d %s", w.Code, w.Body.String())
		}
	}
}

func TestReviewCatalogHTTPErrorsAndEmptyCatalog(t *testing.T) {
	g := catalogAPIFixture(t)
	for _, path := range []string{"/api/v1/review/catalog", "/api/v1/review/catalog/definition/preview?seed=test"} {
		if w := call(g.server, "GET", path, nil, false); w.Code != http.StatusUnauthorized {
			t.Fatalf("unauthenticated catalog access: %d", w.Code)
		}
	}
	for _, test := range []struct {
		path string
		code int
	}{
		{"/api/v1/review/catalog/definition/preview", http.StatusBadRequest},
		{"/api/v1/review/catalog/definition/preview?seed=%20", http.StatusBadRequest},
		{"/api/v1/review/catalog/definition/preview?seed=" + strings.Repeat("a", 257), http.StatusBadRequest},
		{"/api/v1/review/catalog/missing/preview?seed=test", http.StatusNotFound},
		{"/api/v1/review/catalog/shallow-definition/preview?seed=test", http.StatusNotFound},
		{"/api/v1/review/catalog/exercise-lesson-4-sets-recall/preview?seed=test", http.StatusNotFound},
	} {
		if w := call(g.server, "GET", test.path, nil, true); w.Code != test.code {
			t.Errorf("%s: want %d, got %d", test.path, test.code, w.Code)
		}
	}
	g.catalog = Catalog{Version: "empty"}
	w := call(g.server, "GET", "/api/v1/review/catalog", nil, true)
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), `"items":[]`) {
		t.Fatalf("empty catalog: %d %s", w.Code, w.Body.String())
	}
	g.server.grading = nil
	for _, path := range []string{"/api/v1/review/catalog", "/api/v1/review/catalog/definition/preview?seed=test"} {
		if w := call(g.server, "GET", path, nil, true); w.Code != http.StatusServiceUnavailable {
			t.Fatalf("missing catalog: %d", w.Code)
		}
	}
}

func TestPublishedReviewCatalogHTTP(t *testing.T) {
	raw, err := os.ReadFile("../output/grading-catalog.json")
	if os.IsNotExist(err) {
		t.Skip("run npm run content to test the published catalog")
	}
	if err != nil {
		t.Fatal(err)
	}
	g := reviewFixture(t)
	if err = json.Unmarshal(raw, &g.catalog); err != nil {
		t.Fatal(err)
	}
	w := call(g.server, "GET", "/api/v1/review/catalog", nil, true)
	var catalog ReviewCatalog
	if w.Code != http.StatusOK || json.Unmarshal(w.Body.Bytes(), &catalog) != nil {
		t.Fatalf("published catalog: %d", w.Code)
	}
	dedicated, lessons := 0, 0
	for _, item := range catalog.Items {
		if item.Provenance == "lesson-exercise" {
			lessons++
		} else if item.Provenance == "review-template" {
			dedicated++
		}
		if item.ID == "witness-definition-variants" && (item.Objective != "witness-definition" || item.EvidenceLevel != "production" || !item.Quick || item.VariantCount != 2) {
			t.Fatalf("published definition metadata: %+v", item)
		}
	}
	if dedicated != len(g.catalog.ReviewTemplates) || lessons == 0 {
		t.Fatalf("published source coverage: %d dedicated, %d lesson exercises", dedicated, lessons)
	}
}
