package main

import (
	"errors"
	"regexp"
)

// These control characters are valid JSON escapes but never valid prose/TeX.
// Reject rather than guess at the model's intended mathematics. The existing
// grading worker retries invalid provider output without recording a verdict.
var brokenMathEscape = regexp.MustCompile("[\\n\\r\\t](?:eg|eq|eqslant|otin|abla|ight|ext|extbf|extit|imes|heta|au)(?:[^A-Za-z]|$)")

func validateGradeText(text string) error {
	for _, r := range text {
		if (r < 32 && r != '\n' && r != '\r' && r != '\t') || r == 127 {
			return errors.New("Grader returned corrupted text or TeX escaping")
		}
	}
	// Preserve normal paragraph/derivation line breaks. Only check escaped-command
	// fragments within dollar-delimited math, never ordinary prose or student input.
	inMath := false
	start := 0
	for i := 0; i < len(text); i++ {
		if text[i] != '$' {
			continue
		}
		slashes := 0
		for j := i - 1; j >= 0 && text[j] == '\\'; j-- {
			slashes++
		}
		if slashes%2 != 0 {
			continue
		}
		if inMath && brokenMathEscape.MatchString(text[start:i]) {
			return errors.New("Grader returned corrupted TeX escaping")
		}
		inMath = !inMath
		if i+1 < len(text) && text[i+1] == '$' {
			i++
		}
		start = i + 1
	}
	return nil
}
