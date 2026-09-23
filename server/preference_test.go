package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

func TestReviewBudgetSyncBetweenDevices(t *testing.T) {
	s := fixture(t)
	post := func(m Mutation) Record {
		t.Helper()
		body, err := json.Marshal(m)
		if err != nil {
			t.Fatal(err)
		}
		w := call(s, "POST", "/api/v1/mutations", body, true)
		if w.Code != http.StatusOK {
			t.Fatalf("mutation failed: %d %s", w.Code, w.Body.String())
		}
		var r Record
		if err := json.Unmarshal(w.Body.Bytes(), &r); err != nil {
			t.Fatal(err)
		}
		return r
	}
	changes := func(after int64) Record {
		t.Helper()
		w := call(s, "GET", fmt.Sprintf("/api/v1/changes?after=%d", after), nil, true)
		var result struct {
			Cursor  int64
			Records []Record
		}
		if w.Code != http.StatusOK || json.Unmarshal(w.Body.Bytes(), &result) != nil || len(result.Records) != 1 {
			t.Fatalf("change feed failed: %d %s", w.Code, w.Body.String())
		}
		if result.Cursor != result.Records[0].Revision {
			t.Fatalf("change cursor does not match preference revision: %+v", result)
		}
		return result.Records[0]
	}
	assertTarget := func(r Record, m Mutation) {
		t.Helper()
		if r.Key != m.Key || r.ID != m.ID || r.Device != m.Device || string(r.Payload) != string(m.Payload) || len(r.Conflicts) != 0 || len(r.Versions) != 1 {
			t.Fatalf("unexpected preference: %+v", r)
		}
	}
	desktop := Mutation{ID: "review-budget-desktop-1", Key: "preference/review-budget-minutes", Device: "desktop", Payload: json.RawMessage(`{"value":60}`)}
	first := post(desktop)
	assertTarget(first, desktop)
	assertTarget(changes(0), desktop)

	// An offline phone may still have base zero. Preferences accept the latest
	// change without the answer conflicts that would prevent automatic syncing.
	phone := Mutation{ID: "review-budget-phone-01", Key: desktop.Key, Device: "phone", Payload: json.RawMessage(`{"value":25}`)}
	second := post(phone)
	assertTarget(second, phone)
	if second.Revision <= first.Revision {
		t.Fatal("phone change did not advance the revision")
	}
	assertTarget(changes(first.Revision), phone)
	if retry := post(phone); retry.Revision != second.Revision {
		t.Fatal("retry applied the preference twice")
	}
}

func TestPreferencePayloadValidation(t *testing.T) {
	for _, tc := range []struct {
		name    string
		key     string
		payload string
		valid   bool
	}{
		{"minimum", "review-budget-minutes", `{"value":5}`, true},
		{"default", "review-budget-minutes", `{"value":25}`, true},
		{"maximum", "review-budget-minutes", `{"value":60}`, true},
		{"intermediate integer", "review-budget-minutes", `{"value":37}`, true},
		{"below minimum", "review-budget-minutes", `{"value":4}`, false},
		{"above maximum", "review-budget-minutes", `{"value":61}`, false},
		{"zero", "review-budget-minutes", `{"value":0}`, false},
		{"negative", "review-budget-minutes", `{"value":-5}`, false},
		{"fractional", "review-budget-minutes", `{"value":25.5}`, false},
		{"string", "review-budget-minutes", `{"value":"60"}`, false},
		{"boolean", "review-budget-minutes", `{"value":true}`, false},
		{"missing", "review-budget-minutes", `{}`, false},
		{"null value", "review-budget-minutes", `{"value":null}`, false},
		{"null payload", "review-budget-minutes", `null`, false},
		{"array payload", "review-budget-minutes", `[]`, false},
		{"unknown preference", "unknown", `{"value":60}`, false},
		{"key suffix", "review-budget-minutes:other", `{"value":60}`, false},
		{"tex visible", "tex:visible:v2:logic-1", `{"value":true}`, true},
		{"tex hidden", "tex:visible:v2:logic-1", `{"value":false}`, true},
		{"tex numeric", "tex:visible:v2:logic-1", `{"value":60}`, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := fixture(t)
			m := Mutation{ID: "preference-validation-1", Key: "preference/" + tc.key, Device: "phone", Payload: json.RawMessage(tc.payload)}
			body, err := json.Marshal(m)
			if err != nil {
				t.Fatal(err)
			}
			want := http.StatusBadRequest
			if tc.valid {
				want = http.StatusOK
			}
			if w := call(s, "POST", "/api/v1/mutations", body, true); w.Code != want {
				t.Fatalf("got status %d, want %d: %s", w.Code, want, w.Body.String())
			}
		})
	}
}

func TestReviewBudgetMigrationOnlyInitializesAbsentPreference(t *testing.T) {
	s := fixture(t)
	desktop := Mutation{ID: "review-budget-migrate-desktop", Key: "preference/review-budget-minutes", Device: "desktop", IfAbsent: true, Payload: json.RawMessage(`{"value":60}`)}
	phone := Mutation{ID: "review-budget-migrate-phone", Key: desktop.Key, Device: "phone", IfAbsent: true, Payload: json.RawMessage(`{"value":45}`)}
	post := func(m Mutation) Record {
		t.Helper()
		body, err := json.Marshal(m)
		if err != nil {
			t.Fatal(err)
		}
		w := call(s, "POST", "/api/v1/mutations", body, true)
		var result Record
		if w.Code != http.StatusOK || json.Unmarshal(w.Body.Bytes(), &result) != nil {
			t.Fatalf("migration failed: %d %s", w.Code, w.Body.String())
		}
		return result
	}
	first := post(desktop)
	if first.ID != desktop.ID || string(first.Payload) != string(desktop.Payload) {
		t.Fatalf("initial migration did not create the preference: %+v", first)
	}
	for _, m := range []Mutation{phone, phone, desktop} {
		r := post(m)
		if r.Revision != first.Revision || r.ID != first.ID || string(r.Payload) != string(first.Payload) {
			t.Fatalf("migration overwrote existing preference: %+v", r)
		}
	}
	var changes, operations int
	if err := s.db.QueryRow("SELECT COUNT(*) FROM changes").Scan(&changes); err != nil {
		t.Fatal(err)
	}
	if err := s.db.QueryRow("SELECT COUNT(*) FROM operations").Scan(&operations); err != nil {
		t.Fatal(err)
	}
	if changes != 1 || operations != 2 {
		t.Fatalf("no-op migration should save only an operation receipt: changes=%d operations=%d", changes, operations)
	}

	update := Mutation{ID: "review-budget-explicit-phone", Key: desktop.Key, Device: "phone", Payload: json.RawMessage(`{"value":30}`)}
	second := post(update)
	if second.ID != update.ID || string(second.Payload) != string(update.Payload) || second.Revision <= first.Revision {
		t.Fatalf("explicit change did not replace migrated preference: %+v", second)
	}
	for _, m := range []Mutation{desktop, phone} {
		r := post(m)
		if r.Revision != second.Revision || r.ID != second.ID || string(r.Payload) != string(second.Payload) {
			t.Fatalf("migration retry overwrote explicit change: %+v", r)
		}
	}
	if err := s.db.QueryRow("SELECT COUNT(*) FROM changes").Scan(&changes); err != nil {
		t.Fatal(err)
	}
	if changes != 2 {
		t.Fatalf("migration retries emitted extra changes: %d", changes)
	}
	phone.IfAbsent = false
	body, err := json.Marshal(phone)
	if err != nil {
		t.Fatal(err)
	}
	if w := call(s, "POST", "/api/v1/mutations", body, true); w.Code != http.StatusConflict {
		t.Fatalf("migration operation ID reused as explicit edit: %d %s", w.Code, w.Body.String())
	}
}

func TestCreateOnlyMigrationIsLimitedToReviewBudget(t *testing.T) {
	for _, tc := range []struct {
		key     string
		payload string
	}{
		{"text/logic-1", `{"text":"answer"}`},
		{"preference/tex:visible:v2:logic-1", `{"value":true}`},
		{"preference/other", `{"value":60}`},
	} {
		t.Run(tc.key, func(t *testing.T) {
			s := fixture(t)
			m := Mutation{ID: "invalid-create-only-1", Key: tc.key, Device: "phone", IfAbsent: true, Payload: json.RawMessage(tc.payload)}
			body, err := json.Marshal(m)
			if err != nil {
				t.Fatal(err)
			}
			if w := call(s, "POST", "/api/v1/mutations", body, true); w.Code != http.StatusBadRequest {
				t.Fatalf("create-only migration accepted for %s: %d %s", tc.key, w.Code, w.Body.String())
			}
		})
	}
}
