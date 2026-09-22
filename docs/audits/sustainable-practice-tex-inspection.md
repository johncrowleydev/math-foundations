# TeX inspection after the sustainable-practice edit

Inspected on 21 September 2026. The strict `npm run audit:tex` check identified
26 stale fingerprints after the six-lesson teaching and practice changes. The
underlying TeX instructions, required syntax, questions, answers, and grading
schemas did not change.

For every record, substituting its previous field or section from `1826183`
reproduces the old fingerprint exactly. The inspection retains the existing
fingerprint definitions and updates only the following records.

The field comparison followed the release validator exactly. For each question,
remove only the publication fields `choice` and `exerciseId`, as that validator
already does. Replacing only `section` with the corresponding `after` value from
`1826183:content/inline-prerequisites.yaml` reproduces its stored old hash. For
each quick check, replacing only `teachingHash` with the value from
`1826183:content/quick-checks.yaml` reproduces its stored old hash. For each
typing placement, replace only the contextual `markdown` with the same section
extracted from the old MDX; keep the current placement record and syntax-entry
objects. `inspectionFingerprint` then reproduces the stored old hash. All 26
comparisons matched, so the current fingerprints below acknowledge precisely
those placement or teaching-context changes; no other differing field is hidden
or removed from the comparison.

## Questions moved to additional practice

These 17 fingerprints changed only because their `section` now names the
worksheet group rather than the former inline teaching anchor. Read each full
prompt, instruction, answer, and any answer alternatives. All required syntax is
available by the end of the lesson, where additional practice belongs.

| Lesson                     | Exercise IDs           | Inspection                                                                                                                                                                                                |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propositional logic        | 1, 10, 11, 35, 47, 152 | Checked proposition classification, AND/OR translation, the converse counterexample, De Morgan's law, and the odd-square contrapositive. No notation or mathematical response changed.                    |
| Predicates and quantifiers | 11, 81, 101            | Checked nonnegative squares on the stated domain, universal distribution over AND, and the specifically listed relationship pair. Existing quantifier, domain, and grouping syntax is sufficient.         |
| Direct proof               | 21, 31, 51             | Checked the divisibility witness, arbitrary-element inclusion, and an odd integer as a counterexample to a sum of two evens. Existing divisibility, set, and integer syntax remains sufficient.           |
| Proof by contrapositive    | 31, 41, 51             | Checked both nonzero remainder cases modulo three, complements in one universe, and the nonzero rational denominator. The required negation, complement, fraction, and exponent syntax is already taught. |
| Proof by contradiction     | 21, 41                 | Checked lowest terms with positive denominator and the finite nonempty collection of eligible divisors. Answer choices and their explanations remain unchanged.                                           |

Contradiction exercise 31 also moved to additional practice, but its worksheet
group and previous teaching section have the same name. Its question fingerprint
was already current and is retained.

## Quick checks with changed teaching context

For each of these five checks, only `teachingHash` changed. Read every option
and explanation again; the choices and correct answer remain unchanged.

| Check                                | Inspection                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Predicates and quantifiers / quick-1 | A single verified integer witness suffices. The added constructive example explicitly checks both the domain and the required inequality.                                            |
| Sets / quick-1                       | The singleton is a subset, while its sole number and the singleton itself remain different membership candidates. The expanded proper-subset explanation preserves this distinction. |
| Sets / quick-2                       | Two distinct elements still have exactly four subsets. The new power-set proofs preserve the meaning of a set-valued member and the include/exclude counting example.                |
| Contrapositive / quick-1             | Begin with the negated conclusion and derive the negated hypothesis. The added strategy paragraph explains why that starting representation can help.                                |
| Contradiction / quick-1              | Surprise is insufficient: the final facts must conflict. The added planning paragraph uses explicit constraints rather than assuming the desired conclusion.                         |

## Typing placements with changed section prose

Read the complete revised sections and their associated syntax explanations.
The four unchanged syntax blocks still fit their teaching positions:

- `typing-predicates-and-quantifiers-existential-quantification-there-exists`:
  `exists` and thin-space examples still precede the witness check; the new
  numeric construction requires no additional command.
- `typing-predicates-and-quantifiers-existence-uniqueness-and-exactly-one`:
  `exists!` remains the existence command followed by an ordinary exclamation
  mark. The new equation example separates existence from uniqueness without
  changing that syntax.
- `typing-sets-and-set-operations-membership-and-subsets-are-different`:
  `subseteq`, `subsetneq`, and `nsubseteq` retain their stated meanings. The
  warning about the ambiguous `subset` convention remains explicit.
- `typing-sets-and-set-operations-power-sets`: `mathcal`, `cdot`, and `cdots`
  remain valid for the power-set notation and counting argument. The new
  arbitrary-set proofs reuse membership, intersection, and subset notation
  already introduced in this lesson.

Rechecked the relevant entries in the official
[KaTeX supported-functions reference](https://katex.org/docs/supported.html):
Logic and Set Theory, Relations, Spacing, and Font Families. The mathematical
definitions and proof methods were inspected against Hammack's
[Book of Proof](https://richardhammack.github.io/BookOfProof/Main.pdf), §§1.3–1.4,
4.3, 5.1, 6.1–6.2, 7.3, 8.2–8.3, and 9.1 during the teaching edit; the relevant
pinpoint assignments remain in `content/sources.json`.

The changed placement fingerprints affect the source-review digests for
predicates/quantifiers and sets. The complete typing record affects the syntax
digest. No other lesson digest, formula record, curriculum-unit audit, source
assignment, or historical exercise identity changes in this repair.

Validation: strict TeX release audit, content build and validation, and targeted
TeX/source/curriculum inspection tests pass. The generated notebook and grading
catalog are unchanged by this inspection-only repair. The published compatibility
pin for the TeX artifact must record this inspected metadata update.
