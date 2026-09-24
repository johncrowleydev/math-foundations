# Historical interpretation coverage repair

Inspected 2026-09-24 against parent `66d3541` and the existing published
compatibility records from `f53e7b4`.

Commit `fd7216d` changed exercise 117's interpretation skill to supporting.
Before that change, its combined structured assessment activated
`quantified-specification:interpret:` and `quantifier-negation:interpret:` at
production depth. The former lost its only question; the latter retained only
recognition questions. Saved production requirements correctly remained due.

The repair appends two written interpretation templates at production depth.
The existing `nested-quantifier-negation-recognition` template receives the
separate `nested-negation-recognition` objective so its choice questions remain
available without being credited as written production. Its ID, questions,
answers, variants, and source assignments are unchanged. Frozen issued questions
and attempts remain untouched. There is no server scheduling change.

Source inspection used Hammack, _Book of Proof_, §2.10, printed pp. 60–61,
equations (2.8)–(2.9) and Example 2.13. The new citation records the original
examples and inspection date. Existing recognition variants were rechecked
against the same quantifier-negation rules; only their objective metadata and
corresponding inspected digest changed.

Before updating compatibility expectations, all four previous artifact hashes
were reconstructed exactly in memory:

- Remove the two appended templates and the new objective field to recover the
  prior review-template artifact, with all earlier definitions and ordering intact.
- Remove the new citation and its two target assignments to recover the prior
  published sources artifact.
- Replace only the catalog's review templates with the preceding definitions,
  then apply the unchanged `comparableCatalog` helper to recover the prior catalog
  hash. All lesson questions, assessments, analytics, and teaching are unchanged.
- Hash the current published lessons and evidence with the preceding review
  templates, then use the existing `gradingVersionFor` function to recover the
  prior grading-version artifact. The historical version alias is unchanged.

The deterministic audit ledger also reproduces its previous digest when only
its catalog version is restored. Original deployment captures and comparator
exclusions are unchanged.

The Go regression reproduces both failures with the preceding content and
checks that the repair preserves due dates, issues compatible questions, and
advances scheduling only after graded answers. The Review Library browser check
captures `output/e2e/review-library/specification-interpretation.png`.
