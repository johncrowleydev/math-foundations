package main

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

type publishedCatalogFixture struct {
	exercises map[string]json.RawMessage
	metadata  []byte
}

// The published catalog contains large exercise contexts. Decode those once per
// suite, then copy their bytes without repeatedly scanning the same JSON under
// the race detector. Every caller still owns its complete mutable catalog.
var loadPublishedCatalog = sync.OnceValues(func() (publishedCatalogFixture, error) {
	root := os.Getenv("FOUNDATIONS_TEST_CONTENT_ROOT")
	if root == "" {
		root = ".."
	}
	raw, err := os.ReadFile(filepath.Join(root, "output/grading-catalog.json"))
	if err != nil {
		return publishedCatalogFixture{}, err
	}
	var catalog Catalog
	if err := json.Unmarshal(raw, &catalog); err != nil {
		return publishedCatalogFixture{}, err
	}
	exercises := catalog.Exercises
	catalog.Exercises = nil
	metadata, err := json.Marshal(catalog)
	return publishedCatalogFixture{exercises: exercises, metadata: metadata}, err
})

func (fixture publishedCatalogFixture) copy(t *testing.T) Catalog {
	t.Helper()
	var catalog Catalog
	if err := json.Unmarshal(fixture.metadata, &catalog); err != nil {
		t.Fatal(err)
	}
	catalog.Exercises = make(map[string]json.RawMessage, len(fixture.exercises))
	for id, raw := range fixture.exercises {
		catalog.Exercises[id] = bytes.Clone(raw)
	}
	return catalog
}

func publishedCatalog(t *testing.T) Catalog {
	t.Helper()
	fixture, err := loadPublishedCatalog()
	if os.IsNotExist(err) {
		t.Skip("run npm run content:build to test the published catalog")
	}
	if err != nil {
		t.Fatal(err)
	}
	return fixture.copy(t)
}

func TestPublishedCatalogFixtureCopiesAreIsolated(t *testing.T) {
	fixture := publishedCatalogFixture{
		exercises: map[string]json.RawMessage{"exercise": json.RawMessage(`{"id":1}`)},
		metadata:  []byte(`{"version":"test","reviewTemplates":[{"id":"template","question":{"choice":{"options":[{"id":"yes"}]}}}],"reviewVariants":{"template":{"selection":{"hashBytes":[0],"moduli":[1]},"variants":[{"id":"0","parameters":{"value":1},"question":{"prompt":"Synthetic"}}]}}}`),
	}
	first, second := fixture.copy(t), fixture.copy(t)
	first.Exercises["exercise"][6] = '2'
	delete(first.Exercises, "exercise")
	first.ReviewTemplates[0].Question["choice"].(map[string]any)["options"].([]any)[0].(map[string]any)["id"] = "changed"
	bank := first.ReviewVariants["template"]
	bank.Selection.HashBytes[0] = 1
	bank.Variants[0].Parameters["value"] = 2
	bank.Variants[0].Question["prompt"] = "Changed"
	delete(first.ReviewVariants, "template")
	for _, catalog := range []Catalog{second, fixture.copy(t)} {
		if string(catalog.Exercises["exercise"]) != `{"id":1}` || catalog.ReviewTemplates[0].Question["choice"].(map[string]any)["options"].([]any)[0].(map[string]any)["id"] != "yes" {
			t.Fatal("exercise or template mutation escaped its fixture copy")
		}
		bank := catalog.ReviewVariants["template"]
		if bank.Selection.HashBytes[0] != 0 || bank.Variants[0].Parameters["value"] != 1 || bank.Variants[0].Question["prompt"] != "Synthetic" {
			t.Fatal("variant mutation escaped its fixture copy")
		}
	}
}
