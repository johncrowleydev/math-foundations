# Sustainable early learning

Baseline: 1826183 on main. Scope: propositional logic, predicates and
quantifiers, sets, direct proof, contraposition, and contradiction. This pass does
not rewrite later subjects or change the curriculum architecture.

## Diagnosis and changes

The current main branch already contains useful examples and intuitive paragraphs;
replacing all of them would add churn. The remaining teaching gap is the bridge
from a definition to a proof plan, especially when a member of a power set is
itself a set. The practice screen also makes the whole worksheet bank look like
the next sequence to finish. Review distinguishes evidence depth and input effort,
but a count-based plan does not distinguish a typed term from a ten-minute proof.

The six lessons now explain proof starting assumptions, goals and reusable
skeletons. Quantifiers introduces a worked uniqueness argument alongside witnesses
and arbitrary objects. Sets expands proper inclusion, element arguments and double
inclusion, then works both power-set monotonicity and the intersection identity
completely, distinguishing an arbitrary set X from an arbitrary member x. A union
counterexample shows why changing symbols mechanically fails. Later proof lessons
explain how to choose direct, contrapositive or contradiction reasoning and when
the argument has actually finished.

MDX placements define the recommended practice route. The full bank is explicitly
optional extra practice; historical URLs and saved answers still open their
original exercise. Two independent, first-attempt, correct, fast, unassisted
responses on an identical primary concept/skill combination offer a reversible
skip for another routine question. Proofs and deep work never qualify as redundant
routine work, including when their observed response time is short. Incorrect,
unsure or assisted work offers the existing explanation and nearby practice.

## Workload estimates

The numbers below use the same seven-category cost model before and after:
20 seconds definition/T/F, 30 seconds multiple choice, 1 minute short answer,
2 minutes short application, 5 minutes deep reasoning, 10 minutes proof.
Counts include the two existing quick checks in each lesson. “Short” means any
of the first five categories, not only typed short answers.

These are planning heuristics, not measured completion times. They exclude
reading, feedback, revisions and individual differences. The new worked examples
take reading time; the smaller exercise path is not a claim that total study time
falls by exactly the same percentage.

| Lesson                     | Full bank, unchanged | Bank proof/deep | Bank minutes | Previous inline items / minutes | New recommended items | New proof / deep / short | New minutes |
| -------------------------- | -------------------: | --------------: | -----------: | ------------------------------: | --------------------: | -----------------------: | ----------: |
| Propositional logic        |                  155 |          4 / 12 |          234 |                         18 / 30 |                    12 |               0 / 1 / 11 |          13 |
| Predicates and quantifiers |                  122 |           5 / 1 |          136 |                         12 / 16 |                     9 |                1 / 0 / 8 |          15 |
| Sets and set operations    |                   82 |          17 / 2 |          256 |                          9 / 17 |                     9 |                1 / 0 / 8 |          17 |
| Direct proof               |                   82 |          53 / 0 |          564 |                          9 / 54 |                     6 |                3 / 0 / 3 |          32 |
| Proof by contrapositive    |                   82 |          42 / 1 |          466 |                          9 / 45 |                     6 |                1 / 0 / 5 |          15 |
| Proof by contradiction     |                   82 |          46 / 2 |          496 |                          9 / 34 |                     6 |                2 / 0 / 4 |          23 |

The full banks retain 605 items. The inline/recommended route changes from
66 to 48 items, 17 to 9 proof/deep items, and approximately 196 to 115 exercise
minutes (about 41% less). Sets already had seven worksheet placements plus two
checks; its main workload improvement is making that nine-item path the Practice
default instead of a route through all 82. Its worked proof preparation improves
without pretending the inline count fell. A learner can split the 32-minute direct
proof path across sessions.

Machine-readable before/after results are in
[learning-workload.json](learning-workload.json). Recalculate current values with:

```sh
npx tsx tools/audit/learning-workload.ts current \
  propositional-logic predicates-and-quantifiers sets-and-set-operations \
  direct-proof proof-by-contrapositive proof-by-contradiction
```

The tool also accepts a JSON snapshot containing lessons, evidence and
reviewTemplates in place of current. The baseline was assembled through
prepareNotebook, promoteChoices, promoteDeterministic and loadEvidence
before edits; it uses the same cost classifier as the after snapshot.

## Terminology and notation coverage

Existing logic/quantifier cards already cover implication, converse, inverse,
contrapositive, predicates, quantifiers, witnesses and counterexamples. Preserve
them, including deeper production targets, rather than issuing duplicate
definitions. The audit added 40 independently identified fast objectives.

| Lesson                     | Dedicated recall templates before → after | Coverage added                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propositional logic        |                                   24 → 24 | Existing coverage retained: connectives, conditional forms, truth classification, validity, satisfiability/model vocabulary                                                                                                                                     |
| Predicates and quantifiers |                                   18 → 21 | Arbitrary object, variable capture, uniqueness proof obligation                                                                                                                                                                                                 |
| Sets                       |                                   14 → 35 | Singleton, set builder, symmetric difference, proper/subset contrast, power membership translation, bit mask, ordered pair, indexed family/operations, overlap and inclusion-exclusion, Venn meaning, element/double-inclusion strategies, seven named set laws |
| Direct proof               |                                    1 → 12 | Parity, divisibility, rationality, closure, cases, biconditional and constructive proof obligations, circular reasoning, hypotheses/conclusion, integer linear combination, theorem                                                                             |
| Contrapositive             |                                     1 → 1 | Existing proof-method card plus earlier conditional-form cards retained                                                                                                                                                                                         |
| Contradiction              |                                     1 → 6 | Lowest terms/coprimality, gcd, prime/composite, lemma, well-ordering                                                                                                                                                                                            |

These are template counts, not claims that each card covers exactly one word.
The original two witness-production templates share one objective: total recall
templates rise from 59 to 99, distinct recall objectives from 58 to 98. Sets now
has recall coverage in all ten authored concept groups, including set proofs,
indexed families, inclusion-exclusion and set identities. Partition recall already
covers its nonempty, pairwise-disjoint blocks and coverage requirements. Functions
already has ten terminology cards covering function, domain, codomain, range,
injection, surjection, bijection, inverse, composition and preimage; those remain.

Forms include meaning-to-term, term-to-meaning, notation translation, completion,
example recognition and nearby distinctions. The new cards are deterministic
choices with misconception feedback, classified as 20-second definitions. They
offer recognition evidence on separate objectives; they never count as having
constructed the proof they describe. The original typed production definitions,
constructive questions and proof targets are retained.

This is near-complete coverage of the important working vocabulary in the three
opening lessons, supplemented with early proof vocabulary. Incidental reference
extensions in later proof chapters (for example, left/right inverse functions)
remain in existing function exercises and reference material; this pass does not
claim a whole-curriculum terminology census.

Source inspection supports original wording, not copied textbook provenance.
The new probes cite inspected passages of Hammack's _Book of Proof_ (sets,
proof methods and number definitions), Lerma §2.1.5 (named set laws), MIT
§4.5.1 (subset bit representations), and _Logic and Proof_ §7.2 (safe variable
renaming). Exact locators and checked digests are in content/sources.json.

## Daily review

Previously, 30 questions bounded one session but no daily time allowance existed.
A 30-proof session could represent roughly 300 estimated minutes; another session
could add more. That is a worst-case illustration, not observed learner behavior.

The new daily target is 25 minutes by default (configurable 5–60), with issued
scheduled work reserved for 24 elapsed hours. The planner favors cheap due
retrieval, then applications, then a deep item. At most one deep item is issued
in seven elapsed days and it must occupy no more than 40% of the actual new plan.
For example, 30 definition checks, five short applications and one five-minute
reasoning item total approximately 25 minutes. That mix is illustrative, not a
fixed quota. A session can be shorter and usually contains no deep question.

Deferred work stays due without becoming a failure or a primary backlog counter.
The visible summary emphasizes planned minutes and the three-part mix. Existing
issued sessions can be resumed offline. Focused practice deliberately permits
extra work. Returning to the overview pauses the current plan; Resume restores
the question and draft, including after an offline reload. End session closes the
active plan without deleting work or releasing the time already reserved.
A lone due proof will wait for a balanced routine session or can be
selected through focused practice. Seven-day deep spacing and 24-hour allowance
use issue time, including abandoned sessions, not measured attention or midnight.

## Compatibility and verification

All 4,426 published exercise IDs and grading payloads (instructions, prompts,
math, answers, choices, assessments and tables) compare unchanged with baseline.
Lesson slugs, historical namespaces, review IDs, finite variant ordering, saved
sessions and immutable attempts remain intact. Removed inline questions retain
their original catalog records and URLs. Some display section labels return to
their worksheet section. The historical deterministic coverage report is regenerated
through its normal audit tool for the new published version; its original conversion
scope and grading dispositions are unchanged. New cards are covered by current
review-template validation and explicit source inspection.

Changed teaching and newly authored cards produce the normal new content version.
No compatibility alias or digest bypass is added. Existing stale-version and frozen
review-instance behavior continues to handle historical work. Category/seconds
metadata for lesson-backed reviews is outside frozen question payloads. Budget
selection does not rewrite historical intervals or weaken evidence-depth matching.

Validation and visual results are recorded in the PR and in
[the screenshot record](../screenshots/learning-efficiency/README.md).

Local validation passed: npm test (2,109 tests plus exporter), typecheck,
content:validate, web:build, web:test (190 tests), Go tests, strict audit:tex, and
format:check. Publication, TeX/source and curriculum inspection tests were rerun
after the final audit-metadata repair. Eight affected browser specs passed across
targeted runs: learning-efficiency, review-pause, review, review-submission,
review-session-progress, review-library, mdx and sources. The real-server
submission check covers choice and typed responses, retries, rejected-attempt
recovery and restored drafts; its helper explicitly waits for pause persistence
before closing and replacing a plan.

### Publication snapshot inspection

The baseline artifacts were rebuilt in a separate detached worktree at 1826183,
then compared semantically with the integrated teaching and practice changes. The
original deployment hashes in the publication fixture remain intact. Its existing
inspectedUpdates mechanism records this intentional curriculum change without
changing comparison exclusions or the historical grading-version alias.

| Artifact         | Inspected difference                                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Notebook         | Exactly the six named lessons: teaching, placements and optional-practice lists; 17 question display section labels. No exercise ID or response/grading payload changes.                                                                               |
| Review templates | 555 → 595 templates, with exactly 40 additions; all 555 original records remain identical and in their original order.                                                                                                                                 |
| Teaching         | Formula explanation/context records for the changed prose, including 126 additional formula occurrences; existing reference definitions and figures retained.                                                                                          |
| Sources          | Pinpoint citations and inspected hashes for changed lessons and new review objectives, plus the TeX placement metadata inspection.                                                                                                                     |
| TeX teaching     | Eighteen exercise placement kinds change from inline to practice. Twenty-six affected inspection records are rechecked for changed labels or teaching context. Typing instructions, syntax definitions, placement IDs and prerequisites are unchanged. |
| Grading catalog  | New review records, changed teaching context for the six lessons, and additive category/seconds metadata outside question payloads. Every original assessment and all finite review banks are unchanged.                                               |
| Grading version  | The ordinary new curriculum hash; no alias forces new teaching to use an old version.                                                                                                                                                                  |

Learning evidence, reading-order metadata and TeX syntax are byte-identical to
baseline and keep their existing pins. The original source-inspection and stable
ID checks remain active in addition to the publication fixture.

The strict TeX release check separately required inspection of 17 changed question
section labels, five quick-check teaching fingerprints, and four typing blocks
whose surrounding prose changed. The prior fingerprints were reproduced by
substituting only the old label, teaching fingerprint, or section prose. The
[TeX inspection record](sustainable-practice-tex-inspection.md) documents this
comparison and the syntax inspection; hashes were refreshed only for these
inspected records.
