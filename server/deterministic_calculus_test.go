package main

import "testing"

func TestCalculusConformance(t *testing.T) {
	testDeterministicCorpus(t, "../shared/calculus-fixtures.json")
}
