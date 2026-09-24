package main

import "testing"

func TestMatrixTeXSpacingConformance(t *testing.T) {
	testDeterministicCorpus(t, "../tests/grading/fixtures/matrix-tex-spacing.json")
}
