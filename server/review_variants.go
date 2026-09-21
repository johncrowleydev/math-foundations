package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
)

// Reject incomplete or malformed tables at startup, before a persisted seed can
// select a different question or panic. Curriculum is supplied by the catalog.
func validateReviewVariantBanks(c Catalog) error {
	expected := map[string]bool{}
	for _, template := range c.ReviewTemplates {
		if template.Generator == "" {
			continue
		}
		expected[template.ID] = true
		bank, ok := c.ReviewVariants[template.ID]
		if !ok {
			return fmt.Errorf("Missing review variant bank: %s", template.ID)
		}
		selection := bank.Selection
		if len(selection.HashBytes) == 0 || len(selection.HashBytes) != len(selection.Moduli) {
			return fmt.Errorf("Invalid review variant selection: %s", template.ID)
		}
		count := 1
		used := map[int]bool{}
		for i, modulus := range selection.Moduli {
			b := selection.HashBytes[i]
			if b < 0 || b >= 32 || used[b] || modulus < 1 || modulus > 256 || count > len(bank.Variants)/modulus {
				return fmt.Errorf("Invalid review variant selection: %s", template.ID)
			}
			used[b] = true
			count *= modulus
		}
		if count != len(bank.Variants) {
			return fmt.Errorf("Incomplete review variant bank: %s", template.ID)
		}
		if b := selection.ChoiceRotationByte; b != nil && (*b < 0 || *b >= 32) {
			return fmt.Errorf("Invalid review choice rotation: %s", template.ID)
		}
		for index, variant := range bank.Variants {
			digits := make([]string, len(selection.Moduli))
			remaining := index
			for i := len(digits) - 1; i >= 0; i-- {
				digits[i] = strconv.Itoa(remaining % selection.Moduli[i])
				remaining /= selection.Moduli[i]
			}
			if variant.ID != strings.Join(digits, ":") || variant.Question == nil || variant.Parameters == nil {
				return fmt.Errorf("Invalid review variant identity/data: %s", template.ID)
			}
			raw, err := json.Marshal(variant.Question)
			if err != nil {
				return err
			}
			var q struct {
				Choice     *ChoiceAssessment
				Assessment *Assessment
			}
			if err = json.Unmarshal(raw, &q); err != nil {
				return err
			}
			if q.Choice != nil && q.Assessment != nil {
				return fmt.Errorf("Conflicting review variant grading: %s", template.ID)
			}
			if q.Assessment != nil {
				if err = validateAssessment(q.Assessment); err != nil {
					return err
				}
			}
			if q.Choice != nil {
				seen := map[string]bool{}
				for _, option := range q.Choice.Options {
					if option.ID == "" || seen[option.ID] {
						return fmt.Errorf("Invalid review variant choices: %s", template.ID)
					}
					seen[option.ID] = true
				}
				if len(seen) < 2 || !seen[q.Choice.CorrectOption] {
					return fmt.Errorf("Invalid review variant answer: %s", template.ID)
				}
			} else if selection.ChoiceRotationByte != nil {
				return fmt.Errorf("Review choice rotation requires choices: %s", template.ID)
			}
		}
	}
	for id := range c.ReviewVariants {
		if !expected[id] {
			return fmt.Errorf("Unknown review variant bank: %s", id)
		}
	}
	return nil
}
