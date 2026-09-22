package main

import (
	"net/http"
	"strings"
)

// ReviewCatalogItem is an authoring projection of an effective scheduler
// template. Keep it explicit so learner context and grading internals cannot
// accidentally become part of the authoring API.
type ReviewCatalogItem struct {
	Category         string `json:"category"`
	EstimatedSeconds int    `json:"estimatedSeconds"`
	ReviewTarget
	ID                 string           `json:"id"`
	Family             string           `json:"family"`
	Lesson             string           `json:"lesson"`
	EvidenceLevel      string           `json:"evidenceLevel"`
	CognitiveLevel     string           `json:"cognitiveLevel"`
	InteractionCost    string           `json:"interactionCost"`
	InputCapabilities  []string         `json:"inputCapabilities"`
	Quick              bool             `json:"quick"`
	Provenance         string           `json:"provenance"`
	SourceTarget       string           `json:"sourceTarget"`
	Origin             string           `json:"origin"`
	OriginalExercise   string           `json:"originalExercise,omitempty"`
	Generated          bool             `json:"generated"`
	Generator          string           `json:"generator,omitempty"`
	VariantCount       int              `json:"variantCount"`
	Question           map[string]any   `json:"question"`
	Variants           []map[string]any `json:"variants,omitempty"`
	ActivationConcepts []string         `json:"activationConcepts,omitempty"`
}

type ReviewCatalog struct {
	ContentVersion string              `json:"contentVersion"`
	Items          []ReviewCatalogItem `json:"items"`
}

type ReviewCatalogPreview struct {
	TemplateID string         `json:"templateId"`
	Seed       string         `json:"seed"`
	Parameters map[string]int `json:"parameters"`
	Question   map[string]any `json:"question"`
}

func (g *Grading) reviewCatalog() ReviewCatalog {
	catalog := ReviewCatalog{ContentVersion: g.catalog.Version, Items: []ReviewCatalogItem{}}
	for _, template := range g.reviewTemplates() {
		item := ReviewCatalogItem{
			ReviewTarget: template.ReviewTarget, ID: template.ID, Family: template.Family,
			Lesson: template.Lesson, EvidenceLevel: template.EvidenceLevel,
			CognitiveLevel: template.CognitiveLevel, InteractionCost: template.InteractionCost,
			InputCapabilities: template.InputCapabilities, Quick: template.quick(),
			Provenance: "review-template", SourceTarget: template.sourceTarget(),
			Origin: "content/review-templates.json", Generated: template.Generator != "",
			Generator: template.Generator, VariantCount: len(template.Variants),
			Question: template.Question, Variants: template.Variants,
			ActivationConcepts: template.ActivationConcepts,
		}
		item.Category, item.EstimatedSeconds = template.questionCost(template.Question)
		if strings.HasPrefix(template.SourceTarget, "exercise:") {
			item.Provenance = "lesson-exercise"
			// The compiled exercise catalog retains its lesson slug and stable
			// exercise key, not the original authored file path.
			item.Origin = "lesson:" + template.Lesson
			item.OriginalExercise = strings.TrimPrefix(template.SourceTarget, "exercise:")
		}
		catalog.Items = append(catalog.Items, item)
	}
	return catalog
}

func (s *Server) reviewCatalogRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/review/catalog", func(w http.ResponseWriter, r *http.Request) {
		if s.grading == nil {
			http.Error(w, "Review unavailable", http.StatusServiceUnavailable)
			return
		}
		writeJSON(w, http.StatusOK, s.grading.reviewCatalog())
	})
	mux.HandleFunc("GET /api/v1/review/catalog/{id}/preview", func(w http.ResponseWriter, r *http.Request) {
		if s.grading == nil {
			http.Error(w, "Review unavailable", http.StatusServiceUnavailable)
			return
		}
		seed := r.URL.Query().Get("seed")
		if strings.TrimSpace(seed) == "" || len(seed) > 256 {
			http.Error(w, "Provide a seed of 1–256 bytes", http.StatusBadRequest)
			return
		}
		for _, template := range s.grading.reviewTemplates() {
			if template.ID != r.PathValue("id") {
				continue
			}
			question, parameters := instantiateReviewQuestion(template, seed)
			if parameters == nil {
				parameters = map[string]int{}
			}
			writeJSON(w, http.StatusOK, ReviewCatalogPreview{
				TemplateID: template.ID, Seed: seed, Parameters: parameters, Question: question,
			})
			return
		}
		http.Error(w, "Review template not found", http.StatusNotFound)
	})
}
