# Relations rewrite compatibility inspection — 2026-09-29

PR #42 rewrites the Relations chapter around relations as sets of ordered pairs,
with worked examples for relation properties, equivalence classes, orders,
composition, and closures. Its initial CI failures included compatibility pins
for the intentionally changed teaching content, plus stale teaching inspection
metadata. This record covers the semantic comparison required before updating
those compatibility pins.

## Baseline and comparison

The pre-rewrite compiled artifacts in the clean `7efd9d6` worktree pass all ten
published compatibility checks and the deterministic coverage digest check.
The curriculum and content-build sources at that commit are identical to the
PR's base, `35b4cf8`. This establishes that the comparison starts from the
existing inspected published state rather than another candidate build.

Compared that baseline with the final compiled PR artifacts at `6b1fdd1`. The differences
are confined to the Relations lesson and the metadata that describes its
teaching:

- The notebook changes the Relations introduction and the prose/blocks of its
  eleven existing sections. Section identities, exercise placements, and the
  two quick-check questions and answers remain unchanged. The quick checks'
  teaching fingerprints follow the revised supporting explanations.
- All 82 Relations entries in the grading catalog change only their
  introduction, teaching context, and extracted definitions. The catalog's
  content version changes accordingly.
- The teaching bundle changes Relations formula contexts to match the revised
  prose: 152 new occurrences, 58 removed occurrences, and 116 changed records
  (primarily occurrence order and location). Shared reference definitions and
  figures remain unchanged.
- The published source bundle updates the six Relations citation descriptions
  or inspection dates, adds the MIT §7.1 citation for strings and binary
  strings, and updates 41 supporting assignments for Relations sections,
  figures, and references introduced there. The bibliography remains unchanged.
  Pinpoint references and convention differences are documented in
  `content/sources.json`; the finite examples are original applications of the
  cited definitions.
- The TeX teaching bundle changes six placement fingerprints and two quick-check
  inspection fingerprints. The compatibility comparison excludes placement hashes,
  so its new pin records only the two quick-check fingerprints. Their questions,
  answers, feedback, and syntax requirements are unchanged; the inspection is
  documented in `docs/relations-tex-inspection.md`.

## Preserved grading and history

The complete catalog still contains the same 4,426 exercise identities. Every
question, assessment, accepted response, and authored review question is
unchanged. The notebook's accepted-answer lookup index is identical, as are
all dedicated review templates and generated review variants. All other
lessons are identical. Reading order, learning-evidence identities, TeX syntax,
shared figures, and historical grading-version aliases are preserved.

The deterministic coverage ledger differs only in `publishedCatalogVersion`.
All recorded identities, prompt-change flags, source pins, grading methods,
evidence levels, and counts match the previously inspected ledger. Its digest
is updated only after establishing that equality.

Original captured artifact hashes and all previous inspection records remain
in `tests/content/fixtures/published-compatibility.json`. New `inspectedUpdates`
records pin the intentionally changed artifacts and link to this inspection;
no historical pin is overwritten or removed. These metadata changes do not
rewrite saved answers, grading history, or frozen review instances.
