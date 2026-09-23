package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

// Use the published catalog with synthetic evidence, never a learner database.
func BenchmarkReviewSummary(b *testing.B) {
	root := os.Getenv("FOUNDATIONS_TEST_CONTENT_ROOT")
	if root == "" {
		root = ".."
	}
	raw, err := os.ReadFile(filepath.Join(root, "output/grading-catalog.json"))
	if os.IsNotExist(err) {
		b.Skip("run npm run content:build to benchmark the published catalog")
	}
	if err != nil {
		b.Fatal(err)
	}
	var catalog Catalog
	if err = json.Unmarshal(raw, &catalog); err != nil {
		b.Fatal(err)
	}
	for _, count := range []int{0, 1000} {
		b.Run(fmt.Sprintf("attempts=%d", count), func(b *testing.B) {
			db, err := openDB(filepath.Join(b.TempDir(), "db"))
			if err != nil {
				b.Fatal(err)
			}
			defer db.Close()
			g := &Grading{server: &Server{db: db}, catalog: catalog}
			templates := g.reviewTemplates()
			g.reviewData = buildReviewCatalogData(templates)
			tx, err := db.Begin()
			if err != nil {
				b.Fatal(err)
			}
			for i := 0; i < count; i++ {
				template := templates[i%len(templates)]
				submission := Submission{ID: fmt.Sprintf("synthetic-%d", i), Exercise: template.ID, Submitted: int64(i+1) * reviewDay, Mode: "type"}
				data, _ := json.Marshal(submission)
				teaching, _ := json.Marshal(map[string]any{"analytics": template.Analytics})
				if _, err = tx.Exec("INSERT INTO attempts(id,exercise,submitted,data,context,status,verdict) VALUES(?,?,?,?,?,'graded','correct')", submission.ID, submission.Exercise, submission.Submitted, string(data), string(teaching)); err != nil {
					b.Fatal(err)
				}
			}
			if err = tx.Commit(); err != nil {
				b.Fatal(err)
			}
			if _, err = g.reviewSummary(1100 * reviewDay); err != nil {
				b.Fatal(err)
			}
			b.ReportAllocs()
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				if _, err = g.reviewSummary(1100 * reviewDay); err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func TestPreparedReviewCatalogMatchesUncachedAndReloads(t *testing.T) {
	original := reviewFixture(t)
	original.catalog.Exercises["synthetic-1"] = archivedOpenExercise()
	path := filepath.Join(t.TempDir(), "catalog.json")
	t.Setenv("FOUNDATIONS_CATALOG", path)
	t.Setenv("FOUNDATIONS_CATALOG_ARCHIVE", "")
	for _, version := range []string{"catalog-a", "catalog-b"} {
		original.catalog.Version = version
		original.catalog.ReviewTemplates[0].ID = version
		raw, err := json.Marshal(original.catalog)
		if err != nil {
			t.Fatal(err)
		}
		if err = os.WriteFile(path, raw, 0600); err != nil {
			t.Fatal(err)
		}
		prepared, err := configureGrading(original.server)
		if err != nil {
			t.Fatal(err)
		}
		if prepared.reviewData == nil {
			t.Fatal("configured catalog was not prepared")
		}
		preparedTemplates, err := json.Marshal(prepared.reviewTemplates())
		if err != nil {
			t.Fatal(err)
		}
		originalTemplates, err := json.Marshal(original.reviewTemplates())
		if err != nil {
			t.Fatal(err)
		}
		if string(preparedTemplates) != string(originalTemplates) {
			t.Fatal("prepared templates differ from the current catalog")
		}
		expected, err := original.reviewSummary(10 * reviewDay)
		if err != nil {
			t.Fatal(err)
		}
		actual, err := prepared.reviewSummary(10 * reviewDay)
		if err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(actual, expected) {
			t.Fatal("preparation changed the summary")
		}
		before, err := json.Marshal(prepared.reviewTemplates())
		if err != nil {
			t.Fatal(err)
		}
		session, err := prepared.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, 10*reviewDay)
		if err != nil {
			t.Fatal(err)
		}
		if len(session.Instances) == 0 {
			t.Fatal("no synthetic questions issued")
		}
		for _, instance := range session.Instances {
			instance.Question["prompt"] = "Changed issued copy"
			if choice, ok := instance.Question["choice"].(map[string]any); ok {
				choice["correctOption"] = "changed"
			}
		}
		after, err := json.Marshal(prepared.reviewTemplates())
		if err != nil {
			t.Fatal(err)
		}
		if string(before) != string(after) {
			t.Fatal("issuing or editing a question mutated prepared templates")
		}
	}
}

func TestReviewReplayReadsUpdatedFrozenEvidence(t *testing.T) {
	g := reviewFixture(t)
	template := g.catalog.ReviewTemplates[0]
	// A template can share multiple activation concepts without counting evidence twice.
	g.catalog.ReviewTemplates[0].ActivationConcepts = []string{"logic", "alias", "alias"}
	meta := json.RawMessage(`{"concepts":[{"concept":"alias","role":"primary"},{"concept":"logic","role":"primary"}],"skills":[{"skill":"recognize","role":"primary"}]}`)
	attempt := storeReviewAttempt(t, g, "synthetic-1", reviewDay, "correct", meta, nil)
	g.reviewData = buildReviewCatalogData(g.reviewTemplates())
	_, first := summaryStates(t, g, 10*reviewDay)
	if first[template.key()].DueAt != 7*reviewDay {
		t.Fatal("initial evidence was not replayed")
	}
	grades, _ := json.Marshal([]Grade{{Verdict: "incorrect", Diagnosis: []Diagnosis{{Class: "conceptual"}}}})
	if _, err := g.server.db.Exec("UPDATE attempts SET verdict='incorrect',grades=? WHERE id=?", string(grades), attempt.ID); err != nil {
		t.Fatal(err)
	}
	_, corrected := summaryStates(t, g, 10*reviewDay)
	if corrected[template.key()].DueAt != 2*reviewDay {
		t.Fatal("prepared catalog hid a grading correction")
	}
	storeReviewAttempt(t, g, "synthetic-1", 10*reviewDay, "correct", meta, nil)
	_, updated := summaryStates(t, g, 10*reviewDay)
	if updated[template.key()].DueAt != 12*reviewDay {
		t.Fatal("new evidence did not retain the correction penalty")
	}
}
