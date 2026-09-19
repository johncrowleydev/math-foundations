package main

import (
	"encoding/json"
	"os"
	"testing"
)

func TestFiniteRelationConformance(t *testing.T) {
	data, e := os.ReadFile("../shared/finite-relation-fixtures.json")
	if e != nil {
		t.Fatal(e)
	}
	var cases []struct {
		Name       string
		Assessment Assessment
		Response   StructuredResponse
		Verdict    string
		Error      bool
	}
	if e = json.Unmarshal(data, &cases); e != nil {
		t.Fatal(e)
	}
	for _, c := range cases {
		t.Run(c.Name, func(t *testing.T) {
			r := c.Assessment.Requirements[0]
			if e := validateFiniteRelation(r); e != nil {
				t.Fatal(e)
			}
			got, e := checkFiniteRelation(r, c.Response)
			if c.Error {
				if e == nil {
					t.Fatal("expected input error")
				}
				return
			}
			if e != nil || got != (c.Verdict == "correct") {
				t.Fatalf("got %v error %v; want %s", got, e, c.Verdict)
			}
		})
	}
}
