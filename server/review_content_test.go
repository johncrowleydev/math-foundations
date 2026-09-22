package main

import (
	"encoding/json"
	"reflect"
	"testing"
)

// Exercise the compiled authoring/scheduling boundary: new recognition cards
// must neither disappear from the effective pool nor hide older, deeper work.
func TestLessonReviewContentPreservesExistingEffectiveTemplates(t *testing.T) {
	g := &Grading{catalog: publishedCatalog(t)}
	lessons := map[string]bool{}
	for _, exercise := range g.catalog.Exercises {
		var location struct{ LessonSlug string }
		if err := json.Unmarshal(exercise, &location); err != nil {
			t.Fatal(err)
		}
		lessons[location.LessonSlug] = true
	}
	legacy := map[string]bool{
		"witness-definition": true, "witness-definition-variants": true,
		"integer-witness-selection": true,
	}
	baseline := &Grading{catalog: g.catalog}
	baseline.catalog.ReviewTemplates = nil
	for _, template := range g.catalog.ReviewTemplates {
		if legacy[template.ID] {
			baseline.catalog.ReviewTemplates = append(baseline.catalog.ReviewTemplates, template)
		}
	}
	if len(baseline.catalog.ReviewTemplates) != len(legacy) {
		t.Fatal("an original dedicated template was removed")
	}
	effective := map[string]ReviewTemplate{}
	for _, template := range g.reviewTemplates() {
		effective[template.ID] = template
	}
	for _, old := range baseline.reviewTemplates() {
		if current, exists := effective[old.ID]; !exists || !reflect.DeepEqual(current, old) {
			t.Errorf("content additions removed or changed existing effective template %s", old.ID)
		}
	}
	for _, template := range g.catalog.ReviewTemplates {
		if _, exists := effective[template.ID]; !exists {
			t.Errorf("dedicated template is filtered out by evidence depth: %s", template.ID)
		}
		if legacy[template.ID] {
			continue
		}
		if !lessons[template.Lesson] {
			t.Errorf("dedicated template has no instructional lesson: %s", template.ID)
		}
		questions := append([]map[string]any{template.Question}, template.Variants...)
		for _, question := range questions {
			_, choice := question["choice"]
			if template.Skill == "recall" && !choice && assessmentFromQuestion(question) == nil {
				t.Errorf("new terminology template requires provider grading: %s", template.ID)
			}
			if template.EvidenceLevel != "recognition" && choice {
				t.Errorf("new constructive work is mislabeled as a choice: %s", template.ID)
			}
		}
	}
}
