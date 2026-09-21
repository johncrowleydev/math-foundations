package main

import "testing"

func TestCalculusConformance(t *testing.T) {
	testDeterministicCorpus(t, "../tests/grading/fixtures/calculus-fixtures.json")
}
