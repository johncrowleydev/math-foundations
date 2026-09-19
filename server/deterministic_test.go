package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDeterministicConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/deterministic-fixtures.json")
}
func TestExponentialConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/exponential-fixtures.json")
}
func TestAsymptoticConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/asymptotic-fixtures.json")
}
func TestRecurrenceConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/recurrence-fixtures.json")
}
func TestDiscreteConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/discrete-fixtures.json")
}
func TestPolynomialFormConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/polynomial-form-fixtures.json")
}
func TestFiniteMapConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/finite-map-fixtures.json")
}
func TestQuantifiedExtraConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/quantified-extra-fixtures.json")
}
func TestMathInputConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/math-input-fixtures.json")
}
func testDeterministicCorpus(t *testing.T, path string) {
	b, e := os.ReadFile(path)
	if e != nil {
		t.Fatal(e)
	}
	var cases []struct {
		Name       string             `json:"name"`
		Assessment Assessment         `json:"assessment"`
		Response   StructuredResponse `json:"response"`
		Verdict    string             `json:"verdict"`
		Error      bool               `json:"error"`
	}
	if e = json.Unmarshal(b, &cases); e != nil {
		t.Fatal(e)
	}
	for _, c := range cases {
		t.Run(c.Name, func(t *testing.T) {
			g, e := gradeAssessment(&c.Assessment, c.Response)
			if c.Error {
				if e == nil {
					t.Fatalf("expected input error, got %+v", g)
				}
				return
			}
			if e != nil || g.Verdict != c.Verdict {
				t.Fatalf("grade %q error %v; want %s", g.Verdict, e, c.Verdict)
			}
		})
	}
}
func deterministicFixture(t *testing.T) *Assessment {
	t.Helper()
	var a Assessment
	b := []byte(`{"version":1,"inputs":[{"id":"answer","kind":"math","label":"Answer"}],"requirements":[{"id":"value","description":"Give the exact result","validator":"exact","fields":["answer"],"params":{"expected":["1/2"]}}],"feedback":{"correct":"Correct.","incorrect":"Check the calculation."},"evidence":{"level":"production","interactionCost":"low","inputCapabilities":["short-text"]}}`)
	if e := json.Unmarshal(b, &a); e != nil {
		t.Fatal(e)
	}
	return &a
}
func structuredCatalog(t *testing.T, a *Assessment) json.RawMessage {
	t.Helper()
	b, e := json.Marshal(map[string]any{"question": map[string]any{"instructions": "Compute", "prompt": "Find half of one.", "officialAnswer": "1/2"}, "assessment": a, "analytics": map[string]any{"concepts": []map[string]string{{"concept": "logic", "role": "primary"}}, "skills": []map[string]string{{"skill": "calculate", "role": "primary"}}}})
	if e != nil {
		t.Fatal(e)
	}
	return b
}
func structuredSubmission() Submission {
	a := submission()
	a.Mode = "structured"
	a.Text = ""
	a.Images = []string{}
	a.Response = StructuredResponse{"answer": "0.5"}
	return a
}
func TestStructuredSubmissionNoProviderJobsAndImmutableContext(t *testing.T) {
	reply := "unused"
	g := graderFixture(t, &reply)
	calls := 0
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		t.Error("deterministic answer reached provider")
	}))
	defer provider.Close()
	g.endpoint = provider.URL
	g.key = ""
	assessment := deterministicFixture(t)
	g.catalog.Exercises["logic-1"] = structuredCatalog(t, assessment)
	for _, bad := range []StructuredResponse{nil, {}, {"answer": ""}, {"answer": "1/0"}, {"answer": "0.5", "extra": "x"}} {
		a := structuredSubmission()
		a.Response = bad
		if _, code, e := g.submit(a); e == nil || code != 400 {
			t.Fatalf("accepted invalid answer %v: %d %v", bad, code, e)
		}
	}
	for _, mode := range []string{"type", "write", "photo", "choice"} {
		a := structuredSubmission()
		a.Mode = mode
		if _, code, e := g.submit(a); e == nil || code != 400 {
			t.Fatalf("accepted wrong mode %s: %d %v", mode, code, e)
		}
	}
	a := structuredSubmission()
	a.Response["answer"] = "1/3"
	wrong, code, e := g.submit(a)
	if e != nil || code != 201 || wrong.Verdict != "incorrect" || len(wrong.Grades[0].Requirements) != 1 {
		t.Fatal(wrong, code, e)
	}
	duplicate, code, e := g.submit(a)
	if e != nil || code != 200 || duplicate.ID != a.ID {
		t.Fatal(code, e)
	}
	if e = g.recheck(a.ID, newID(), "Please reconsider"); e == nil {
		t.Fatal("deterministic recheck accepted")
	}
	a.ID = newID()
	a.Submitted++
	a.Response["answer"] = "1/2"
	right, _, e := g.submit(a)
	if e != nil || right.Verdict != "correct" || right.Presentation == nil || right.Presentation.Assessment == nil {
		t.Fatal(right, e)
	}
	var count int
	g.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&count)
	if count != 0 || g.step(context.Background()) || calls != 0 {
		t.Fatal("deterministic response created provider work", count, calls)
	}
	assessment.Requirements[0].Params = json.RawMessage(`{"expected":["9"]}`)
	g.catalog.Exercises["logic-1"] = structuredCatalog(t, assessment)
	saved, e := loadAttempt(g.server.db, right.ID)
	if e != nil {
		t.Fatal(e)
	}
	grade, e := gradeAssessment(saved.Presentation.Assessment, saved.Response)
	if e != nil || grade.Verdict != "correct" {
		t.Fatal("saved definition changed", e)
	}
	if _, e = g.evaluate(context.Background(), saved, string(g.catalog.Exercises["logic-1"]), ""); e == nil || calls != 0 {
		t.Fatal("worker bypass accepted structured response")
	}
	a.ID = newID()
	if _, code, e := g.submit(a); e == nil || code != 409 {
		t.Fatal("correct lock lost", code, e)
	}
}
func TestCatalogReadyWithoutProvider(t *testing.T) {
	s := fixture(t)
	a := deterministicFixture(t)
	raw, _ := json.Marshal(Catalog{Version: "version", Exercises: map[string]json.RawMessage{"logic-1": structuredCatalog(t, a)}})
	p := filepath.Join(t.TempDir(), "catalog.json")
	if e := os.WriteFile(p, raw, 0600); e != nil {
		t.Fatal(e)
	}
	t.Setenv("FOUNDATIONS_CATALOG", p)
	t.Setenv("OPENROUTER_API_KEY", "")
	g, e := configureGrading(s)
	if e != nil || g == nil {
		t.Fatal(g, e)
	}
	aSub := structuredSubmission()
	aSub.ContentVersion = "version"
	if _, _, e := g.submit(aSub); e != nil {
		t.Fatal(e)
	}
	g.catalog.Exercises["open-1"] = json.RawMessage(`{"question":{"prompt":"Prove it"}}`)
	aSub = structuredSubmission()
	aSub.Exercise = "open-1"
	aSub.ContentVersion = "version"
	aSub.Mode = "type"
	aSub.Response = nil
	aSub.Text = "proof"
	if _, code, e := g.submit(aSub); e == nil || code != 503 || !strings.Contains(e.Error(), "AI grading") {
		t.Fatal("missing provider did not retain open response", code, e)
	}
}

func structuredTemplate(t *testing.T, g *Grading, level string) ReviewTemplate {
	x := g.catalog.ReviewTemplates[0]
	x.ID = "structured"
	x.Skill = "construct"
	x.EvidenceLevel = level
	x.Family = "fixed"
	x.Question = map[string]any{"id": 1, "section": "Review", "instructions": "Compute", "prompt": "One half", "answer": "1/2", "assessment": deterministicFixture(t)}
	x.Analytics = json.RawMessage(`{"concepts":[{"concept":"logic","role":"primary"}],"skills":[{"skill":"construct","role":"primary"}]}`)
	return x
}
func TestStructuredReviewSnapshotsRestoreAndEvidence(t *testing.T) {
	g := reviewFixture(t)
	template := structuredTemplate(t, g, "production")
	g.catalog.ReviewTemplates = []ReviewTemplate{template}
	if !g.reviewTemplates()[0].quick() {
		t.Fatal("short production answer not Quick compatible")
	}
	session, e := g.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "quick"}, reviewDay)
	if e != nil || len(session.Instances) != 1 {
		t.Fatal(session, e)
	}
	instance := session.Instances[0]
	a := structuredSubmission()
	a.Exercise = instance.Exercise
	a.Review = &instance.Context
	a.ContentVersion = instance.ContentVersion
	a.Submitted = reviewDay + 1
	saved, _, e := g.submit(a)
	if e != nil || saved.Verdict != "correct" {
		t.Fatal(saved, e)
	}
	restored := reviewFixture(t)
	restored.catalog.ReviewTemplates = []ReviewTemplate{template}
	raw, _ := json.Marshal(instance)
	records := []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}
	if e = restored.importReview(ReviewImport{Records: records, Attempts: []Attempt{saved}}); e != nil {
		t.Fatal("current restore", e)
	}
	archived := reviewFixture(t)
	archived.catalog.Version = "new-catalog"
	if e = archived.importReview(ReviewImport{Records: records, Attempts: []Attempt{saved}}); e != nil {
		t.Fatal("archived restore", e)
	}
	again, e := loadAttempt(archived.server.db, a.ID)
	if e != nil || again.Presentation == nil || again.Presentation.Assessment == nil {
		t.Fatal("lost archived checker", again, e)
	}
	if e = archived.recheck(a.ID, newID(), "recheck"); e == nil {
		t.Fatal("restore enabled AI recheck")
	}
	var jobs int
	archived.server.db.QueryRow("SELECT COUNT(*) FROM grading_jobs").Scan(&jobs)
	if jobs != 0 {
		t.Fatal("restore created model job")
	}
	// A shallow answer never advances a deeper family target, including after an update.
	deep := reviewFixture(t)
	deepTemplate := structuredTemplate(t, deep, "reasoning")
	deep.catalog.ReviewTemplates = []ReviewTemplate{deepTemplate}
	practice, e := deep.planReview(ReviewSessionRequest{Kind: "focused-practice", Mode: "regular"}, reviewDay)
	if e != nil || len(practice.Instances) != 1 {
		t.Fatal(practice, e)
	}
	issued := practice.Instances[0]
	if issued.EvidenceLevel != "production" {
		t.Fatal("instance overstated evidence", issued.EvidenceLevel)
	}
	a = structuredSubmission()
	a.Exercise = issued.Exercise
	a.Review = &issued.Context
	a.ContentVersion = issued.ContentVersion
	a.Submitted = reviewDay + 1
	if _, _, e = deep.submit(a); e != nil {
		t.Fatal(e)
	}
	_, states := summaryStates(t, deep, 2*reviewDay)
	state := states[deepTemplate.key()]
	if state.EvidenceLevel != "reasoning" || state.LastEvidenceAt != nil || state.DueAt != reviewDay || state.Quick {
		t.Fatal("production satisfied deeper target", state)
	}
	due, e := deep.planReview(ReviewSessionRequest{Kind: "scheduled-review", Mode: "regular"}, 2*reviewDay)
	if e != nil || len(due.Instances) != 0 {
		t.Fatal("scheduled an insufficient answer", due, e)
	}
	deep.catalog.ReviewTemplates = nil
	_, states = summaryStates(t, deep, 3*reviewDay)
	if s := states[deepTemplate.key()]; s.EvidenceLevel != "reasoning" || s.DueAt != reviewDay {
		t.Fatal("removed template lost deep due state", s)
	}
}
func TestStructuredReviewArchivedTamperRejected(t *testing.T) {
	g := reviewFixture(t)
	t1 := structuredTemplate(t, g, "production")
	instance := instantiateReview(t1, ReviewState{ReviewTarget: t1.ReviewTarget}, "focused-practice", newID(), "seed", "old", reviewDay)
	q := instance.Question["assessment"].(map[string]any)
	q["version"] = float64(2)
	raw, _ := json.Marshal(instance)
	if e := g.importReview(ReviewImport{Records: []Record{{Key: "review-instance/" + instance.ID, Version: Version{Payload: raw}}}}); e == nil {
		t.Fatal("accepted altered archived definition")
	}
}

// Exercise published, frozen definitions against every authored example, rather
// than testing a parallel hand-maintained list of catalog keys.
func TestPublishedDeterministicFixtures(t *testing.T) {
	root := os.Getenv("FOUNDATIONS_TEST_CONTENT_ROOT")
	if root == "" {
		root = ".."
	}
	raw, e := os.ReadFile(filepath.Join(root, "output/grading-catalog.json"))
	if os.IsNotExist(e) {
		t.Skip("run npm run content first")
	}
	if e != nil {
		t.Fatal(e)
	}
	var catalog Catalog
	if e = json.Unmarshal(raw, &catalog); e != nil {
		t.Fatal(e)
	}
	if e = validateCatalogAssessments(catalog); e != nil {
		t.Fatal(e)
	}
	type answerFixture struct {
		Response StructuredResponse `json:"response"`
		Verdict  string             `json:"verdict"`
		Error    bool               `json:"error"`
	}
	check := func(name string, a *Assessment, fixtures []answerFixture) {
		t.Helper()
		if a == nil {
			t.Fatalf("missing published assessment for %s", name)
		}
		if len(fixtures) == 0 {
			t.Fatalf("missing fixtures for %s", name)
		}
		for i, f := range fixtures {
			t.Run(fmt.Sprintf("%s/%d", name, i), func(t *testing.T) {
				grade, e := gradeAssessment(a, f.Response)
				if f.Error {
					if e == nil {
						t.Fatal("expected input error", grade)
					}
					return
				}
				if e != nil || grade.Verdict != f.Verdict {
					t.Fatalf("got %s / %v; want %s", grade.Verdict, e, f.Verdict)
				}
			})
		}
	}
	for _, name := range []string{"deterministic-exercises.json", "deterministic-linear.json"} {
		b, e := os.ReadFile(filepath.Join(root, "content", name))
		if os.IsNotExist(e) {
			continue
		}
		if e != nil {
			t.Fatal(e)
		}
		var entries []struct {
			Lesson     string          `json:"lesson"`
			ID         int             `json:"id"`
			Assessment *Assessment     `json:"assessment"`
			Fixtures   []answerFixture `json:"fixtures"`
		}
		if e = json.Unmarshal(b, &entries); e != nil {
			t.Fatal(e)
		}
		for _, entry := range entries {
			key := fmt.Sprintf("%s-%d", entry.Lesson, entry.ID)
			var item struct {
				Assessment *Assessment `json:"assessment"`
			}
			if e = json.Unmarshal(catalog.Exercises[key], &item); e != nil {
				t.Fatal(key, e)
			}
			a, _ := json.Marshal(item.Assessment)
			b, _ := json.Marshal(entry.Assessment)
			if !jsonEquivalent(a, b) {
				t.Fatal("published assessment differs from authoring", key)
			}
			check(key, item.Assessment, entry.Fixtures)
		}
	}
	b, e := os.ReadFile(filepath.Join(root, "content/deterministic-review-fixtures.json"))
	if os.IsNotExist(e) {
		return
	}
	if e != nil {
		t.Fatal(e)
	}
	var reviews []struct {
		Template string          `json:"template"`
		Variant  *int            `json:"variant"`
		Fixtures []answerFixture `json:"fixtures"`
	}
	if e = json.Unmarshal(b, &reviews); e != nil {
		t.Fatal(e)
	}
	for _, entry := range reviews {
		var question map[string]any
		for _, template := range catalog.ReviewTemplates {
			if template.ID != entry.Template {
				continue
			}
			question = template.Question
			if entry.Variant != nil {
				if *entry.Variant < 1 || *entry.Variant > len(template.Variants) {
					t.Fatal("unknown review variant", entry.Template)
				}
				question = template.Variants[*entry.Variant-1]
			}
		}
		check(fmt.Sprintf("%s/%v", entry.Template, entry.Variant), assessmentFromQuestion(question), entry.Fixtures)
	}
}

func TestLinearAcceptsAlternativeAnswers(t *testing.T) {
	cases := []struct {
		name, params string
		response     []string
		correct      bool
	}{
		{"dependent deletion essential", `{"kind":"dependent-list-deletion"}`, []string{"1,0;1,0;0,1", "3"}, true},
		{"dependent deletion redundant", `{"kind":"dependent-list-deletion"}`, []string{"1,0;1,0;0,1", "1"}, false},
		{"independent deletion not eligible", `{"kind":"dependent-list-deletion"}`, []string{"1,0;0,1", "1"}, false},
		{"proper independent", `{"kind":"proper-independent"}`, []string{"1,0,0;0,1,0", "3"}, true},
		{"full independent not proper", `{"kind":"proper-independent"}`, []string{"1,0;0,1", "2"}, false},
		{"wrong ambient dimension", `{"kind":"proper-independent"}`, []string{"1,0,0", "2"}, false},
		{"information loss kernel basis", `{"kind":"information-loss"}`, []string{"1,1,1", "1,-1,0;0,1,-1"}, true},
		{"information loss missing direction", `{"kind":"information-loss"}`, []string{"1,1,1", "1,-1,0"}, false},
		{"injective no information loss", `{"kind":"information-loss"}`, []string{"1,0;0,1", "{}"}, false},
		{"repeated diagonalizable scalar", `{"kind":"spectral-example","property":"repeated-diagonalizable"}`, []string{"3,0;0,3"}, true},
		{"repeated nondiagonalizable", `{"kind":"spectral-example","property":"repeated-diagonalizable"}`, []string{"3,1;0,3"}, false},
		{"no real eigenvalue rotation", `{"kind":"spectral-example","property":"no-real-eigenvalue"}`, []string{"0,-2;2,0"}, true},
		{"nonorthogonal eigenbasis scalar", `{"kind":"spectral-example","property":"nonorthogonal-eigenbasis"}`, []string{"2,0;0,2"}, true},
		{"nonorthogonal eigenbasis shear", `{"kind":"spectral-example","property":"nonorthogonal-eigenbasis"}`, []string{"2,1;0,3"}, true},
		{"orthogonal forced", `{"kind":"spectral-example","property":"nonorthogonal-eigenbasis"}`, []string{"2,0;0,3"}, false},
		{"unit spectrum nonidentity", `{"kind":"spectral-example","property":"unit-spectrum-not-identity"}`, []string{"1,3;0,1"}, true},
		{"unit spectrum identity rejected", `{"kind":"spectral-example","property":"unit-spectrum-not-identity"}`, []string{"1,0;0,1"}, false},
		{"positive nonacute parallel", `{"kind":"vector-pair","property":"positive-nonacute"}`, []string{"1,2", "2,4"}, true},
		{"positive acute rejected", `{"kind":"vector-pair","property":"positive-nonacute"}`, []string{"1,0", "1,1"}, false},
		{"unequal cosine one", `{"kind":"vector-pair","property":"unequal-cosine-one"}`, []string{"1,2", "2,4"}, true},
		{"equal cosine one rejected", `{"kind":"vector-pair","property":"unequal-cosine-one"}`, []string{"1,2", "1,2"}, false},
		{"unequal equal norm", `{"kind":"vector-pair","property":"unequal-equal-norm"}`, []string{"1,2", "2,1"}, true},
		{"nonnegative closure counterexample", `{"kind":"nonnegative-closure"}`, []string{"0,3", "-2"}, true},
		{"zero closure insufficient", `{"kind":"nonnegative-closure"}`, []string{"0,0", "-2"}, false},
		{"zero row unique", `{"kind":"zero-row-not-infinite"}`, []string{"1,0,2;0,1,3;0,0,0"}, true},
		{"zero row inconsistent", `{"kind":"zero-row-not-infinite"}`, []string{"0,0,1;0,0,0"}, true},
		{"zero row infinite rejected", `{"kind":"zero-row-not-infinite"}`, []string{"1,0,2;0,0,0"}, false},
		{"eigenpairs alternate scales order", `{"kind":"eigenpairs","a":[["2","1"],["0","3"]],"eigenvalues":["2","3"],"checks":true}`, []string{"3,7,7;2,-4,0", "0,0;0,0"}, true},
		{"eigenpairs zero vector rejected", `{"kind":"eigenpairs","a":[["2","1"],["0","3"]],"eigenvalues":["2","3"]}`, []string{"2,0,0;3,1,1"}, false},
		{"eigenpairs duplicate rejected", `{"kind":"eigenpairs","a":[["2","1"],["0","3"]],"eigenvalues":["2","3"]}`, []string{"2,1,0;2,4,0"}, false},
		{"affine inconsistent", `{"kind":"affine-family","a":[["1","1"],["1","1"]],"b":["1","2"],"freeVariables":true}`, []string{"none", "{}", "{}"}, true},
		{"affine consistent none rejected", `{"kind":"affine-family","a":[["1","1"]],"b":["1"]}`, []string{"none", "{}"}, false},
		{"affine valid alternate free coordinate", `{"kind":"affine-family","a":[["1","1","1"]],"b":["4"],"freeVariables":true}`, []string{"1,1,2", "2,-2,0;0,3,-3", "1,3"}, true},
		{"affine duplicate free coordinate", `{"kind":"affine-family","a":[["1","1","1"]],"b":["4"],"freeVariables":true}`, []string{"1,1,2", "2,-2,0;0,3,-3", "1,1"}, false},
		{"nonzero zero product", `{"kind":"zero-product"}`, []string{"1,0;0,0", "0,0;0,2", "0,0;0,0"}, true},
		{"zero product rejects zero input", `{"kind":"zero-product"}`, []string{"0,0;0,0", "0,0;0,2", "0,0;0,0"}, false},
		{"zero cancellation factor", `{"kind":"cancellation"}`, []string{"0,0;0,0", "1,0;0,1", "2,0;0,2"}, true},
		{"cancellation needs distinct factors", `{"kind":"cancellation"}`, []string{"0,0;0,0", "1,0;0,1", "1,0;0,1"}, false},
		{"nonsymmetric", `{"kind":"nonsymmetric"}`, []string{"1,2;3,4"}, true},
		{"symmetric rejected", `{"kind":"nonsymmetric"}`, []string{"1,2;2,4"}, false},
		{"pairwise nonparallel triple", `{"kind":"nonparallel-dependent"}`, []string{"1,0;0,1;1,1"}, true},
		{"parallel pair rejected", `{"kind":"nonparallel-dependent"}`, []string{"1,0;2,0;1,1"}, false},
		{"rectangular angle changing map", `{"kind":"changes-angles"}`, []string{"1,2"}, true},
		{"angle changing scaling", `{"kind":"changes-angles"}`, []string{"2,0;0,1"}, true},
		{"scaled rotation preserves angles", `{"kind":"changes-angles"}`, []string{"0,-3;3,0"}, false},
		{"determinant does not imply uniform scale", `{"kind":"determinant-scale","determinantAbs":"2","scaleSquared":"4"}`, []string{"2,0;0,1"}, true},
		{"wrong determinant", `{"kind":"determinant-scale","determinantAbs":"2","scaleSquared":"4"}`, []string{"1,0;0,1"}, false},
		{"zero compact SVD", `{"kind":"svd","a":[["0","0"],["0","0"]],"form":"compact"}`, []string{"{}", "{}", "{}"}, true},
		{"scaled column basis", `{"kind":"basis","a":[["1","0"],["0","0"]],"space":"column"}`, []string{"2,0"}, true},
		{"original columns required", `{"kind":"basis","a":[["1","0"],["0","0"]],"space":"column","originalColumns":true}`, []string{"2,0"}, false},
		{"null basis rotated", `{"kind":"basis","a":[["1","1","1"]],"space":"null"}`, []string{"1,-1,0;0,2,-2"}, true},
		{"incomplete null directions", `{"kind":"basis","a":[["1","1","1"]],"space":"null"}`, []string{"1,-1,0"}, false},
		{"zero space", `{"kind":"basis","a":[["1","0"],["0","1"]],"space":"null"}`, []string{"{}"}, true},
		{"affine alternate offset", `{"kind":"affine-family","a":[["1","1","1"]],"b":["4"]}`, []string{"1,1,2", "2,-2,0;0,3,-3"}, true},
		{"affine missing direction", `{"kind":"affine-family","a":[["1","1","1"]],"b":["4"]}`, []string{"1,1,2", "1,-1,0"}, false},
		{"scaled eigenvector", `{"kind":"eigenvector","a":[["2","1"],["0","3"]],"lambda":"3"}`, []string{"7,7"}, true},
		{"zero eigenvector", `{"kind":"eigenvector","a":[["2","1"],["0","3"]],"lambda":"3"}`, []string{"0,0"}, false},
		{"rotated repeated SVD", `{"kind":"svd","a":[["2","0"],["0","2"]]}`, []string{"sqrt(2)/2,-sqrt(2)/2;sqrt(2)/2,sqrt(2)/2", "2,0;0,2", "sqrt(2)/2,-sqrt(2)/2;sqrt(2)/2,sqrt(2)/2"}, true},
		{"negative Sigma", `{"kind":"svd","a":[["2","0"],["0","2"]]}`, []string{"-1,0;0,1", "-2,0;0,2", "1,0;0,1"}, false},
		{"unordered SVD accepted", `{"kind":"svd","a":[["2","0"],["0","1"]]}`, []string{"0,1;1,0", "1,0;0,2", "0,1;1,0"}, true},
		{"descending SVD enforced", `{"kind":"svd","a":[["2","0"],["0","1"]],"order":"descending"}`, []string{"0,1;1,0", "1,0;0,2", "0,1;1,0"}, false},
		{"tied best rank rotated", `{"kind":"best-rank","a":[["2","0"],["0","2"]],"rank":1,"errorSquared":"4"}`, []string{"1,1;1,1"}, true},
		{"insufficient rank constraint", `{"kind":"best-rank","a":[["2","0"],["0","2"]],"rank":1,"errorSquared":"2"}`, []string{"1,0;0,1"}, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			a := deterministicFixture(t)
			a.Inputs = nil
			r := AssessmentRequirement{ID: "linear", Description: "Construct the requested object", Validator: "linear", Params: json.RawMessage(c.params)}
			response := StructuredResponse{}
			for i, s := range c.response {
				key := fmt.Sprint("field", i)
				a.Inputs = append(a.Inputs, AssessmentInput{ID: key, Kind: "math", Label: key})
				r.Fields = append(r.Fields, key)
				response[key] = s
			}
			a.Requirements = []AssessmentRequirement{r}
			grade, e := gradeAssessment(a, response)
			if e != nil || (grade.Verdict == "correct") != c.correct {
				t.Fatal(grade.Verdict, e)
			}
		})
	}
}
func TestWitnessIntegralityAndDivisibility(t *testing.T) {
	a := deterministicFixture(t)
	a.Requirements[0].Validator = "witness"
	a.Requirements[0].Params = json.RawMessage(`{"variables":[{"name":"n","field":"answer","nonInteger":true}],"conditions":[{"left":"n","op":">","right":"0"}]}`)
	for _, c := range []struct {
		s       string
		correct bool
	}{{"sqrt(2)", true}, {"3/2", true}, {"1", false}, {"(1+sqrt(2))/(1+sqrt(2))", false}} {
		g, e := gradeAssessment(a, StructuredResponse{"answer": c.s})
		if e != nil || (g.Verdict == "correct") != c.correct {
			t.Fatal(c, g, e)
		}
	}
	for _, c := range []struct {
		left, right, op string
		correct         bool
	}{{"0", "0", "divides", true}, {"0", "1", "not-divides", true}, {"3", "-6", "divides", true}, {"3", "7", "divides", false}, {"3/2", "3", "divides", false}} {
		a.Requirements[0].Params = json.RawMessage(fmt.Sprintf(`{"variables":[{"name":"n","field":"answer"}],"conditions":[{"left":%q,"op":%q,"right":%q}]}`, c.left, c.op, c.right))
		g, e := gradeAssessment(a, StructuredResponse{"answer": "1"})
		if e != nil || (g.Verdict == "correct") != c.correct {
			t.Fatal(c, g, e)
		}
	}
}

func TestParenthesizedVectorEntries(t *testing.T) {
	xs, e := splitMathList("(0)/sqrt(2), (1)/sqrt(2), (1)/sqrt(2)")
	if e != nil || len(xs) != 3 {
		t.Fatalf("entries %v error %v", xs, e)
	}
	for _, s := range xs {
		if _, e := parseExact(s); e != nil {
			t.Fatal(e)
		}
	}
}

func TestQuantifiedTotalFunctions(t *testing.T) {
	cases := []struct {
		name, actual, expected string
		correct                bool
	}{
		{"alpha renamed function argument", "forall t in R (1+f(t)=0)", "forall x in R (f(x)+1=0)", true},
		{"different function argument", "forall t in R (f(2*t)=0)", "forall x in R (f(x)=0)", false},
		{"nested equivalent argument", "forall t in R (f(g(t+0))=g(t))", "forall x in R (f(g(x))=g(x))", true},
		{"different function names", "forall t in R (f(t)=0)", "forall x in R (g(x)=0)", false},
		{"function argument pole retained", "forall t in R (f(t/t)-f(t/t)=0)", "forall x in R (0=0)", false},
		{"function codomain not necessarily integer", "forall t in Z (f(t)<2)", "forall x in Z (f(x)<=1)", false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			a := deterministicFixture(t)
			a.Requirements[0].Validator = "quantified-formula"
			params := map[string]any{"expected": c.expected, "domains": []string{"R", "Z"}, "predicates": map[string]int{}, "functions": map[string]int{"f": 1, "g": 1}}
			a.Requirements[0].Params, _ = json.Marshal(params)
			g, e := gradeAssessment(a, StructuredResponse{"answer": c.actual})
			if e != nil || (g.Verdict == "correct") != c.correct {
				t.Fatalf("grade %s error %v", g.Verdict, e)
			}
		})
	}
}

func TestSetConformance(t *testing.T) { testDeterministicCorpus(t, "../shared/set-fixtures.json") }

func TestQuantifiedMembershipNotation(t *testing.T) {
	a := deterministicFixture(t)
	a.Requirements[0].Validator = "quantified-formula"
	a.Requirements[0].Params = json.RawMessage(`{"expected":"forall x in D (A(x) and not B(x))","domains":["D"],"predicates":{"A":1,"B":1},"sets":["A","B"]}`)
	for _, answer := range []string{"forall y in D (y in A and y notin B)", "forall y in D (y ∈ A and y ∉ B)", `\forall y \in D (y \in A \land y \notin B)`} {
		g, e := gradeAssessment(a, StructuredResponse{"answer": answer})
		if e != nil || g.Verdict != "correct" {
			t.Fatalf("%s: %s %v", answer, g.Verdict, e)
		}
	}
}

func TestElementaryRejectsInternalRootSymbol(t *testing.T) {
	if _, e := elementaryEquivalent("radicalRoot", "sqrt(y)", "y", "nonnegative"); e == nil {
		t.Fatal("an internal symbol was accepted as a learner answer")
	}
}
