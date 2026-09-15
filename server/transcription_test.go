package main

import (
	"bytes"
	"context"
	"encoding/json"
	"image"
	"image/png"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func photoSubmission(t *testing.T, g *Grading) Submission {
	t.Helper()
	var b bytes.Buffer
	png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 2, 2)))
	h := contentHash(b.Bytes())
	if err := g.server.media.Put(h, bytes.NewReader(b.Bytes())); err != nil {
		t.Fatal(err)
	}
	a := submission()
	a.Mode = "photo"
	a.Text = ""
	a.Images = []string{h}
	a.Photos = []SubmittedPhoto{{Hash: h}}
	return a
}
func TestTranscriptionRetiresMediaPreservesSourceAndRecheck(t *testing.T) {
	reply := `{"verdict":"correct","feedback":"Accepted","issue":"","improvement":"","transcription":"p implies q"}`
	g := graderFixture(t, &reply)
	a := photoSubmission(t, g)
	if _, _, err := g.submit(a); err != nil {
		t.Fatal(err)
	}
	g.step(context.Background())
	saved, err := loadAttempt(g.server.db, a.ID)
	if err != nil {
		t.Fatal(err)
	}
	if saved.Transcription != "p implies q" || saved.Mode != "photo" || len(saved.Images) != 0 || len(saved.Photos) != 0 {
		t.Fatalf("Bad retained response: %+v", saved)
	}
	g.removeRetiredMedia()
	if f, e := g.server.media.Open(a.Images[0]); !os.IsNotExist(e) {
		if f != nil {
			f.Close()
		}
		t.Fatal("Source image remains")
	}
	if _, _, err = g.submit(a); err != nil {
		t.Fatal("Original retry lost idempotency", err)
	}
	if err = g.retainExistingTranscriptions(); err != nil {
		t.Fatal("Migration not repeatable", err)
	}
	provider := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		json.NewDecoder(r.Body).Decode(&body)
		raw, _ := json.Marshal(body)
		if bytes.Contains(raw, []byte("image_url")) || !bytes.Contains(raw, []byte("SAVED TRANSCRIPTION")) || !bytes.Contains(raw, []byte("photo")) || !bytes.Contains(raw, []byte("clarification-test")) {
			t.Error("Recheck lost transcription provenance or clarification")
		}
		writeJSON(w, 200, map[string]any{"choices": []any{map[string]any{"message": map[string]any{"content": v5FixtureReply(reply)}}}})
	}))
	defer provider.Close()
	g.endpoint = provider.URL
	if _, err = g.evaluate(context.Background(), saved, `{}`, "clarification-test"); err != nil {
		t.Fatal(err)
	}
}
func TestUnreadableImageRemainsUntilTranscribed(t *testing.T) {
	reply := `{"verdict":"not_graded","feedback":"Unreadable","issue":"","improvement":"","transcription":"[unclear]"}`
	g := graderFixture(t, &reply)
	a := photoSubmission(t, g)
	if _, _, err := g.submit(a); err != nil {
		t.Fatal(err)
	}
	g.step(context.Background())
	g.removeRetiredMedia()
	saved, _ := loadAttempt(g.server.db, a.ID)
	if saved.Transcription != "" || len(saved.Images) != 1 {
		t.Fatal("Unreadable work discarded")
	}
	f, err := g.server.media.Open(a.Images[0])
	if err != nil {
		t.Fatal(err)
	}
	f.Close()
}
func TestExistingTranscriptMigrationKeepsSharedMedia(t *testing.T) {
	reply := `{"verdict":"correct","feedback":"Accepted","issue":"","improvement":"","transcription":"p"}`
	g := graderFixture(t, &reply)
	a := photoSubmission(t, g)
	if _, _, err := g.submit(a); err != nil {
		t.Fatal(err)
	}
	// Simulate an existing assessment saved by the previous server version.
	grades, _ := json.Marshal([]Grade{{Verdict: "correct", Transcription: "p", Model: gradingModel}})
	g.server.db.Exec("UPDATE attempts SET grades=?,status='graded',verdict='correct' WHERE id=?", string(grades), a.ID)
	payload, _ := json.Marshal(map[string]any{"photos": []SubmittedPhoto{{Hash: a.Images[0]}}})
	if _, err := g.server.mutate(Mutation{ID: strings.Repeat("m", 20), Key: "photos/other-draft", Payload: payload, Device: "test"}); err != nil {
		t.Fatal(err)
	}
	if err := g.retainExistingTranscriptions(); err != nil {
		t.Fatal(err)
	}
	g.removeRetiredMedia()
	saved, _ := loadAttempt(g.server.db, a.ID)
	if saved.Transcription != "p" || saved.Mode != "photo" {
		t.Fatal("Migration lost response")
	}
	f, err := g.server.media.Open(a.Images[0])
	if err != nil {
		t.Fatal("Deleted another draft's shared photo", err)
	}
	f.Close()
}
