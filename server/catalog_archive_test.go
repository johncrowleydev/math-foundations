package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

const archivedTestVersion = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

func archivedCatalogFixture(t *testing.T, exercises map[string]json.RawMessage) (string, []byte) {
	t.Helper()
	// Historical catalogs may describe generated reviews without today's banks.
	raw, err := json.Marshal(Catalog{Version: archivedTestVersion, Exercises: exercises, ReviewTemplates: []ReviewTemplate{{ID: "old-review", Generator: "old-generator"}}})
	if err != nil {
		t.Fatal(err)
	}
	source := filepath.Join(t.TempDir(), "grading-catalog.json")
	if err = os.WriteFile(source, raw, 0600); err != nil {
		t.Fatal(err)
	}
	directory := filepath.Join(t.TempDir(), "catalogs")
	if err = archiveCatalogCommand([]string{"archive-catalog", source, directory}); err != nil {
		t.Fatal(err)
	}
	return directory, raw
}

func archivedOpenExercise() json.RawMessage {
	return json.RawMessage(`{"lessonTitle":"Synthetic archived lesson","question":{"instructions":"Explain.","prompt":"Original synthetic question.","officialAnswer":"Original explanation."},"teaching":"Original teaching context.","analytics":{"version":"original-evidence","concepts":[{"concept":"original-concept","role":"primary"}],"skills":[{"skill":"explain","role":"primary"}]}}`)
}

func submitArchivedHTTP(t *testing.T, g *Grading, a Submission, code int) Attempt {
	t.Helper()
	body, err := json.Marshal(a)
	if err != nil {
		t.Fatal(err)
	}
	w := call(g.server, http.MethodPost, "/api/v1/attempts", body, true)
	if w.Code != code {
		t.Fatalf("submission status=%d want=%d body=%s", w.Code, code, w.Body.String())
	}
	var saved Attempt
	if code < 300 {
		if err = json.Unmarshal(w.Body.Bytes(), &saved); err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(saved.Submission, a) {
			t.Fatal("archive lookup changed the original submission")
		}
	}
	return saved
}

func TestArchivedLessonSubmissionRetainsOriginalContextAcrossRestart(t *testing.T) {
	for _, removed := range []bool{false, true} {
		t.Run(map[bool]string{false: "changed-question", true: "removed-exercise"}[removed], func(t *testing.T) {
			reply := `{"verdict":"correct","feedback":"Synthetic archived work accepted.","issue":"","improvement":"","transcription":""}`
			g := graderFixture(t, &reply)
			original := archivedOpenExercise()
			g.catalogArchive, _ = archivedCatalogFixture(t, map[string]json.RawMessage{"logic-1": original})
			if removed {
				delete(g.catalog.Exercises, "logic-1")
			} else {
				g.catalog.Exercises["logic-1"] = json.RawMessage(`{"question":{"instructions":"A different question.","officialAnswer":"Different answer."}}`)
			}
			a := submission()
			a.ContentVersion = archivedTestVersion
			a.Revealed = true
			started, duration := a.Submitted-1000, int64(500)
			a.StartedAt, a.ActiveDurationMs = &started, &duration
			saved := submitArchivedHTTP(t, g, a, http.StatusCreated)
			if saved.Presentation == nil || saved.Presentation.Question["prompt"] != "Original synthetic question." || saved.Presentation.Question["answer"] != "Original explanation." {
				t.Fatal("original question/answer snapshot was not returned")
			}
			var originalItem struct{ Analytics json.RawMessage }
			json.Unmarshal(original, &originalItem)
			if !jsonEquivalent(saved.Analytics, originalItem.Analytics) {
				t.Fatal("original evidence mapping was not retained")
			}
			var stored string
			if err := g.server.db.QueryRow("SELECT context FROM attempts WHERE id=?", a.ID).Scan(&stored); err != nil || stored != string(original) {
				t.Fatal("grading context did not retain exact archived bytes", err)
			}
			submitArchivedHTTP(t, g, a, http.StatusOK)
			forged := a
			forged.ContentVersion = g.catalog.Version
			submitArchivedHTTP(t, g, forged, http.StatusConflict)

			// A new grading service no longer needs the archive once accepted: the
			// attempt's database context remains authoritative for grading/recheck.
			restarted := &Grading{server: g.server, catalog: Catalog{Version: "future-version", Exercises: map[string]json.RawMessage{}}, key: g.key, endpoint: g.endpoint, client: g.client}
			g.server.grading = restarted
			if !restarted.step(context.Background()) {
				t.Fatal("accepted archived response did not enter normal grading")
			}
			graded := submitArchivedHTTP(t, restarted, a, http.StatusOK)
			if graded.Verdict != "correct" || len(graded.Grades) != 1 {
				t.Fatal("archived response lost its grade")
			}
			if err := restarted.recheck(a.ID, newID(), "Reconsider the synthetic explanation."); err != nil {
				t.Fatal(err)
			}
			if !restarted.step(context.Background()) {
				t.Fatal("frozen context could not be rechecked")
			}
			rechecked := submitArchivedHTTP(t, restarted, a, http.StatusOK)
			if len(rechecked.Grades) != 2 || !reflect.DeepEqual(graded.Grades[0], rechecked.Grades[0]) {
				t.Fatal("recheck changed existing history")
			}
			if err := g.server.db.QueryRow("SELECT context FROM attempts WHERE id=?", a.ID).Scan(&stored); err != nil || stored != string(original) {
				t.Fatal("restart/recheck changed the frozen context", err)
			}
		})
	}
}

func TestArchivedDeterministicContractsOverrideChangedCurrentContracts(t *testing.T) {
	for _, structured := range []bool{false, true} {
		t.Run(map[bool]string{false: "choice", true: "structured"}[structured], func(t *testing.T) {
			reply := "provider must never run"
			g := graderFixture(t, &reply)
			g.key = ""
			a := submission()
			var original json.RawMessage
			if structured {
				a = structuredSubmission()
				original = structuredCatalog(t, deterministicFixture(t))
				g.catalog.Exercises[a.Exercise] = bytes.ReplaceAll(original, []byte(`"expected":["1/2"]`), []byte(`"expected":["3/4"]`))
			} else {
				a.Mode, a.ChoiceID, a.Text = "choice", "yes", "Yes"
				original = json.RawMessage(`{"question":{"instructions":"Choose.","officialAnswer":"Yes"},"choice":{"options":[{"id":"yes","text":"Yes","feedback":"Original correct feedback"},{"id":"no","text":"No","feedback":"Original incorrect feedback"}],"correctOption":"yes"}}`)
				g.catalog.Exercises[a.Exercise] = bytes.ReplaceAll(original, []byte(`"correctOption":"yes"`), []byte(`"correctOption":"no"`))
			}
			a.ContentVersion = archivedTestVersion
			g.catalogArchive, _ = archivedCatalogFixture(t, map[string]json.RawMessage{a.Exercise: original})
			saved := submitArchivedHTTP(t, g, a, http.StatusCreated)
			if saved.Verdict != "correct" || len(saved.Grades) != 1 || saved.Grades[0].Model != "deterministic" {
				t.Fatal("response was not graded using its original deterministic contract")
			}
			if !structured && saved.Grades[0].Feedback != "Original correct feedback" {
				t.Fatal("choice feedback came from a different version")
			}
			if g.step(context.Background()) {
				t.Fatal("deterministic archived answer created a provider job")
			}
			submitArchivedHTTP(t, g, a, http.StatusOK)
			if err := g.recheck(a.ID, newID(), "Reconsider."); err == nil {
				t.Fatal("archived deterministic attempt allowed AI recheck")
			}
		})
	}
}

func TestArchivedCatalogFailureIsSafeAndDoesNotCreateAttempts(t *testing.T) {
	for _, scenario := range []string{"disabled", "unknown", "traversal", "missing-exercise", "wrong-version", "corrupt", "not-file", "symlink"} {
		t.Run(scenario, func(t *testing.T) {
			reply := "unused"
			g := graderFixture(t, &reply)
			g.catalogArchive, _ = archivedCatalogFixture(t, map[string]json.RawMessage{"logic-1": archivedOpenExercise()})
			a := submission()
			a.ContentVersion = archivedTestVersion
			archivePath := filepath.Join(g.catalogArchive, archivedTestVersion+".json")
			status := http.StatusConflict
			switch scenario {
			case "disabled":
				g.catalogArchive = ""
			case "unknown":
				a.ContentVersion = strings.Repeat("b", 64)
			case "traversal":
				a.ContentVersion = "../" + archivedTestVersion
			case "missing-exercise":
				a.Exercise = "unknown-exercise"
			case "wrong-version":
				data, err := os.ReadFile(archivePath)
				if err != nil {
					t.Fatal(err)
				}
				if err = os.WriteFile(archivePath, bytes.ReplaceAll(data, []byte(archivedTestVersion), []byte(strings.Repeat("b", 64))), 0644); err != nil {
					t.Fatal(err)
				}
				status = http.StatusServiceUnavailable
			case "corrupt":
				if err := os.WriteFile(archivePath, []byte(`{"version":`), 0644); err != nil {
					t.Fatal(err)
				}
				status = http.StatusServiceUnavailable
			case "not-file", "symlink":
				if err := os.Remove(archivePath); err != nil {
					t.Fatal(err)
				}
				if scenario == "not-file" {
					if err := os.Mkdir(archivePath, 0755); err != nil {
						t.Fatal(err)
					}
				} else if err := os.Symlink(filepath.Join(g.catalogArchive, "absent"), archivePath); err != nil {
					t.Fatal(err)
				}
				status = http.StatusServiceUnavailable
			}
			body, _ := json.Marshal(a)
			w := call(g.server, http.MethodPost, "/api/v1/attempts", body, true)
			if w.Code != status || !strings.Contains(w.Body.String(), "saved") {
				t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
			}
			var count int
			if err := g.server.db.QueryRow("SELECT COUNT(*) FROM attempts").Scan(&count); err != nil || count != 0 {
				t.Fatal("untrusted/unavailable catalog created an attempt", err)
			}
		})
	}
}

func TestArchiveCatalogCommandKeepsFirstValidArtifact(t *testing.T) {
	directory, original := archivedCatalogFixture(t, map[string]json.RawMessage{"logic-1": archivedOpenExercise()})
	path := filepath.Join(directory, archivedTestVersion+".json")
	changed := bytes.ReplaceAll(original, []byte("Original teaching context."), []byte("Later representation of this version."))
	source := filepath.Join(t.TempDir(), "grading-catalog.json")
	if err := os.WriteFile(source, changed, 0600); err != nil {
		t.Fatal(err)
	}
	if err := archiveCatalogCommand([]string{"archive-catalog", source, directory}); err != nil {
		t.Fatal(err)
	}
	retained, err := os.ReadFile(path)
	if err != nil || !bytes.Equal(retained, original) {
		t.Fatal("an existing version was overwritten", err)
	}
	for _, item := range []struct {
		path string
		mode os.FileMode
	}{{directory, 0755}, {path, 0644}} {
		info, err := os.Stat(item.path)
		if err != nil || info.Mode().Perm() != item.mode {
			t.Fatal("archive is not readable by the service", err)
		}
	}
	entries, err := os.ReadDir(directory)
	if err != nil || len(entries) != 1 {
		t.Fatal("archive retained incomplete staging files", err)
	}
	if err = archiveCatalogCommand([]string{"archive-catalog", source}); err == nil {
		t.Fatal("invalid command arguments were accepted")
	}
}

func TestArchiveCatalogCommandRejectsCorruptOrMismatchedArtifacts(t *testing.T) {
	for _, scenario := range []string{"corrupt-source", "invalid-choice", "invalid-assessment", "duplicate-version", "duplicate-exercise", "trailing-data", "source-name", "retained-version", "retained-corrupt"} {
		t.Run(scenario, func(t *testing.T) {
			directory, original := archivedCatalogFixture(t, map[string]json.RawMessage{"logic-1": archivedOpenExercise()})
			source := filepath.Join(t.TempDir(), "grading-catalog.json")
			raw := original
			path := filepath.Join(directory, archivedTestVersion+".json")
			retained := original
			switch scenario {
			case "corrupt-source":
				raw = []byte(`{"version":`)
			case "invalid-choice":
				raw = []byte(`{"version":"` + archivedTestVersion + `","exercises":{"logic-1":{"question":{"prompt":"Synthetic"},"choice":{"options":[],"correctOption":"absent"}}}}`)
			case "invalid-assessment":
				raw = []byte(`{"version":"` + archivedTestVersion + `","exercises":{"logic-1":{"question":{"prompt":"Synthetic"},"assessment":{"version":999}}}}`)
			case "duplicate-version":
				raw = append([]byte(`{"version":"`+archivedTestVersion+`",`), original[1:]...)
			case "duplicate-exercise":
				raw = []byte(`{"version":"` + archivedTestVersion + `","exercises":{"logic-1":` + string(archivedOpenExercise()) + `,"logic-1":` + string(archivedOpenExercise()) + `}}`)
			case "trailing-data":
				raw = append(append([]byte{}, original...), []byte(` {}`)...)
			case "source-name":
				source = filepath.Join(filepath.Dir(source), strings.Repeat("b", 64)+".json")
			case "retained-version":
				retained = bytes.ReplaceAll(original, []byte(archivedTestVersion), []byte(strings.Repeat("b", 64)))
			case "retained-corrupt":
				retained = []byte(`{"version":`)
			}
			if err := os.WriteFile(source, raw, 0600); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(path, retained, 0644); err != nil {
				t.Fatal(err)
			}
			if err := archiveCatalog(source, directory); err == nil {
				t.Fatal("invalid catalog was accepted")
			}
			after, err := os.ReadFile(path)
			if err != nil || !bytes.Equal(after, retained) {
				t.Fatal("failed archive operation replaced existing bytes", err)
			}
			entries, err := os.ReadDir(directory)
			if err != nil || len(entries) != 1 {
				t.Fatal("failed archive operation left staging files", err)
			}
		})
	}
}

func TestConfigureGradingUsesOptionalCatalogArchive(t *testing.T) {
	directory, _ := archivedCatalogFixture(t, map[string]json.RawMessage{"logic-1": archivedOpenExercise()})
	current := filepath.Join(t.TempDir(), "current.json")
	raw, err := json.Marshal(Catalog{Version: strings.Repeat("b", 64), Exercises: map[string]json.RawMessage{"current-1": archivedOpenExercise()}})
	if err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(current, raw, 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("FOUNDATIONS_CATALOG", current)
	t.Setenv("FOUNDATIONS_CATALOG_ARCHIVE", directory)
	g, err := configureGrading(fixture(t))
	if err != nil {
		t.Fatal(err)
	}
	old, ok, err := g.archivedExercise(archivedTestVersion, "logic-1")
	if err != nil || !ok || !bytes.Equal(old, archivedOpenExercise()) {
		t.Fatal("configured service could not resolve a retained catalog", err)
	}
}
