# Preserving the deployed fixes during the MDX rollout

The September 21 deployment preflight found that production was running
`20260921-153009-power-set-layout`, built from `b22850c` plus local sets-lesson
and figure changes. Those changes were absent from main after the curriculum
migration. Deploying main directly would have removed working behavior.

The preservation branch merges all seven original commits:

| Commit    | Preserved change                                                    |
| --------- | ------------------------------------------------------------------- |
| `18bc032` | Accept quantified answers with the implied domain.                  |
| `e086c95` | Accept `intersect` as an intersection spelling.                     |
| `ffc40df` | Preserve the published double-negation choice contract.             |
| `cfd5b11` | Accept quantifiers restricted to named sets.                        |
| `72e4e7f` | Regressions covering duplicate review questions.                    |
| `9e8c774` | Regressions for published XOR duplicates and structured identities. |
| `b22850c` | Prevent duplicate questions within review plans.                    |

The existing live sets prose, source bindings, teaching metadata, and power-set
layout were also preserved. Lesson prose now lives in
`content/lessons/03-sets-and-set-operations.mdx`; structured metadata remains declarative. The
original stash is retained. No executable curriculum authoring was restored.
The review planner continues to consume declarative variant banks, with added
tests for duplicate questions across banks and equivalence to lesson items.

## Independent production reference

The compatibility reference was captured from the existing deployed artifacts
before changing production, rather than regenerated from the candidate branch.
`tests/content/fixtures/published-compatibility.json` records their SHA-256
digests and release provenance. The unchanged reading-order reference retains
its original migration digest.

The full notebook and all 4,426 grading identities match that deployed
reference. Comparisons normalize only native MDX figure syntax versus the old
figure markers and associated editorial digests. Every exercise question,
answer contract, analytics mapping, ordering, placement, quick check, and all
555 review templates are preserved. The additive declarative review variant
bank is covered separately by exhaustive server fixtures.

After establishing that parity, the existing exact representation-to-version
mapping in `tools/content/compatibility/grading-version.json` was aligned to the
actual deployed catalog version:
`7070c181471cc6ae5914ac2a9da00a448b776bcc85d25ce5575d76066b2ff872`.
This preserves queued submissions from production. Only this one proven
representation receives the preserved version; later content changes still
produce a new hash normally.

The native MDX React rendering path remains intact. Desktop and phone checks
are recorded in [the sets screenshots](screenshots/deployed-sets-mdx/README.md).
The separately merged retry fix in PR #16 resubmits a rejected original upload
with its existing identity instead of requesting a regrade for a server record
that does not yet exist.
