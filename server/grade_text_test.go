package main

import (
	"encoding/json"
	"testing"
)

func TestGradeTextEscaping(t *testing.T) {
	for _, text := range []string{"$\forall x$", "$\bigl(x)$", "$\neg P$", "$x\neq y$", "$\text{value}$", "$\right)$"} {
		for _, field := range []string{"feedback", "issue", "improvement", "transcription"} {
			v := map[string]string{"verdict": "correct", "feedback": "Accepted", field: text}
			b, _ := json.Marshal(v)
			if _, err := parseV5Grade(v5FixtureReply(string(b))); err == nil {
				t.Errorf("accepted corrupt %s: %q", field, text)
			}
		}
	}
	for _, text := range []string{`$\forall x\, (x\neq 0)$`, "Paragraph one.\n\nParagraph two.", "$$\n\\begin{aligned}\na&=b\\\\\nc&=d\n\\end{aligned}\n$$", "Line one\n$\\neg P$\n$\\forall x$", "Price: \\$5", "$$\nnext\n$$"} {
		if err := validateGradeText(text); err != nil {
			t.Errorf("rejected valid %q: %v", text, err)
		}
	}
}
