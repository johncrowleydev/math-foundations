# Final curriculum verification and hardening

Audit baseline: `3719ac2`, latest `main` after merged PRs #6–#9, September 20, 2026. The work covers all **71 instructional lessons**, their four reading-only introductions, and **4,426 published exercise/check identities**. This is a verification pass, with no new subject, Review-card expansion, scheduler redesign, deployment, or merge.

## Results

| Question                                                       | Result                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Are authored mathematical answers wrong?                       | No numerical miscalculation was found under the intended assumptions. Six Discrete official explanations did not match their finite-domain prompts. Several Calculus conclusions required hypotheses absent from the prompt. These are substantive defects, and both groups were corrected.                                                    |
| Are prompts materially ambiguous?                              | Yes. Calculus needed missing differentiability assumptions and standalone setup in several exercises. Statistics included requests for any sufficient bound while the grader accepted only one extremal bound. The scoped report records the exact IDs and repairs.                                                                            |
| Can deterministic graders accept invalid input or mathematics? | Yes. The adversarial audit found malformed delimiter and response-validation cases; it also investigated literal zero-to-zero powers where current prompts explicitly prohibit them. See the grader report for exact cases and fixes.                                                                                                          |
| Can they reject valid equivalent mathematics?                  | Yes. Examples include a rational expression with an everywhere-positive denominator and supported Boolean notation rejected offline. Sampling-design names also needed ordinary full-name aliases.                                                                                                                                             |
| Are TypeScript and Go semantics identical?                     | The audit found discrepancies and added a shared independently expected corpus across every validator family. Passing that finite corpus establishes parity for those cases, not a proof for every possible string.                                                                                                                            |
| Does a lesson assume untaught material?                        | No missing prerequisite unit was found along the declared complete curriculum path with its stated precalculus entry preparation. The per-lesson inventories distinguish those prerequisites from local refreshers and ordinary algebra.                                                                                                       |
| Are there clear exercise difficulty cliffs?                    | None found. Two LOW repetition concerns in Calculus 16 and 19 remain documented without changing the practice banks. Several independently selectable exercises omitted setup inherited from a preceding question; those prompts are now self-contained.                                                                                       |
| Can offline/sync flows lose or duplicate history?              | Yes. Malformed upload acknowledgements and truncated downloaded attempts could erase a durable local answer; rapid reentrant submission could create duplicates. Focused fixes and regressions address those reproduced failures.                                                                                                              |
| Are stale tests hiding regressions?                            | The known Review submission test selected mixed-response targets while requiring an open editor; it now explicitly selects open families. A second Review test assumed a local Correct verdict would upload within 300 ms; it now waits for acknowledgement and durable queue removal. The original correctness/restoration assertions remain. |

## Mathematical and prerequisite evidence

The two independent subject reports contain a row for every instructional lesson, including compact **NO ISSUE** dispositions, and exact exercise IDs, derivations, proposed/applied fixes and grader involvement for real findings:

- [Discrete Mathematics and Linear Algebra: mathematical verification](audits/final-discrete-linear-mathematics.md): 27 lessons, 2,064 published identities, with 648 independently computed finite-model/function/set cases supporting the six repaired examples.
- [Calculus and Probability & Statistics: mathematical verification](audits/final-calculus-probability-mathematics.md): 44 lessons, 2,362 published identities, with the scoped inspection and executable cross-check limits stated explicitly.
- [Prerequisite and progression summary](final-curriculum-prerequisites.md), linking both complete per-lesson dependency inventories.

The audits read published questions rather than trusting original worksheets or previously passing fixtures. Existing source inspections and merged PR descriptions were context, not mathematical proof. Repeated numerical families were considered through their governing derivations and concrete values. Manual reasoning, independent executable checks and existing conformance fixtures are distinguished in the reports; none is represented as a formal proof of the entire curriculum.

The classifications **BLOCKING**, **HIGH**, **MEDIUM**, **LOW** and **NO ISSUE** refer to actual findings. An empty severity category is not filled with invented issues. A NO ISSUE disposition records the result of this pass, not permanent correctness or measured learner mastery.

## Grader and browser evidence

These concerns are delivered separately:

- [Deterministic adversarial audit](https://github.com/johncrowleydev/math-foundations/blob/test/deterministic-adversarial/docs/deterministic-adversarial-audit.md), with each validator family, shared TypeScript/Go cases, minimal regressions and remaining bounded-language limitations.
- [Browser/offline verification](https://github.com/johncrowleydev/math-foundations/blob/test/offline-hardening/docs/browser-offline-verification.md), including reproduced data-loss/duplication failures, real production-PWA tests, malformed/delayed/interrupted replies, backup restore, frozen Review after catalog replacement, screenshots and exact platform limits.

The Library check covers all 4,827 effective templates. It remains distinct from a mathematical proof of each generated or authored Review variant. Review coverage is still judged by concept × skill × optional objective and evidence depth, without equalizing template counts. Quick evidence does not replace proof or production targets.

## Preservation and source policy

All lesson slugs, exercise namespaces/IDs, Review template/variant identities and the number of published exercises remain stable. Corrections change source-of-truth authoring and regenerate through the established tools. The Discrete explanation repairs use an explicit answer override beside existing prompt/instruction overrides so historical worksheet source pins and the original conversion audit remain intact.

Pinpoint passages were reinspected for substantive content changes. Only affected inspection metadata/digests were refreshed. The reports identify those passages and distinguish support for original explanations/calculations from copied textbook provenance. Generated catalog versions change normally when current definitions change; historical Review instances retain their stored question, teaching snapshot and assessment.

No learner records, personal answers, production configuration, credentials or deployment state were modified. The original checkout remains untouched; work occurs on semantic branches in isolated worktrees.

An independent preservation comparison confirmed all 75 ordered lesson slugs, 4,426 ordered published question identities, 555 ordered authored Review templates and every variant identity/order. Exactly 84 published questions and 21 authored Review templates changed, alongside the documented glossary repairs. Evidence assignments, concept/skill/objective metadata, section order, practice order and figures are unchanged. The affected source digests cover 26 lessons and those 21 Review templates; three existing Discrete citation inspection dates advance, with their passage assignments unchanged.

## Visual verification

The changed exercises were inspected in the compiled PWA, including 390-pixel phone layouts, with no page overflow or JavaScript errors. Captures include the repaired finite-domain explanation ([desktop](screenshots/final-curriculum/finite-image-counterexample-desktop.png), [phone](screenshots/final-curriculum/finite-image-counterexample-phone.png)), [differentiability assumption](screenshots/final-curriculum/differentiability-assumption-phone.png), standalone loss setup ([desktop](screenshots/final-curriculum/standalone-loss-setup-desktop.png), [phone](screenshots/final-curriculum/standalone-loss-setup-phone.png)), [smallest certified sample size](screenshots/final-curriculum/smallest-certified-sample-phone.png), [accepted full sampling-design name](screenshots/final-curriculum/sampling-name-alias-phone.png), and [corrected probability notation](screenshots/final-curriculum/corrected-probability-notation-phone.png).

These content screenshots use a synthetic local notebook with uploads deferred; their visible grades are local deterministic grades. The real-server browser checks and Go corpus validate server behavior separately. Sources remain collapsed, and neither screenshots nor tests contain personal learner data.

## Validation and delivery

The separate concerns are delivered as draft PRs targeting `main`:

| Branch                           | Pull request                                                      | Scope                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `test/offline-hardening`         | [#10](https://github.com/johncrowleydev/math-foundations/pull/10) | Retain durable attempts on malformed sync, prevent reentrant duplicates, and correct the response-family and upload-timing browser checks. |
| `test/deterministic-adversarial` | [#11](https://github.com/johncrowleydev/math-foundations/pull/11) | Nine grader/parser defects and 1,166 shared adversarial cases across all 36 validator families.                                            |
| `audit/curriculum-verification`  | [#12](https://github.com/johncrowleydev/math-foundations/pull/12) | Mathematical/prerequisite reports, targeted content repairs, independent regressions and content screenshots.                              |

The local subject work branches are `audit/math-correctness` and `audit/calculus-probability`. `audit/final-validation` combines all three concerns solely for verification; it is not a PR or a merge into `main`.

Full combined local checks passed: `npm test` (**2,014 tests**), `npm run typecheck`, `npm run web:build`, `npm run web:test` (**82 tests**), `npm run format:check`, `go test -count=1 ./...`, and `go test -race -count=1 ./...`. These include the shared deterministic corpus, published authored fixtures, provider traps, frozen Review restore, content/source checks and the new independent mathematical cases. The build retains its pre-existing large-chunk advisory.

The final combined browser sweep passed:

- `check-offline-hardening.mjs`: malformed/interrupted/delayed replies, offline retries and reopen, rapid submission, immutable backup restore, removed Review definitions, content-version change and deterministic scheduling.
- `check-review-submission-ui.mjs`: actual API grading, retry, timing, rejected-attempt recovery, explicitly open Regular responses and reloaded drafts.
- `check-review-ui.mjs`: Regular/Quick switching, deferred deep work, focused filters, cached API-offline session, acknowledged queued upload and phone layout.
- `check-deterministic-ui.mjs`: 25 real server-verified attempts, supported structured families, scratchwork and frozen presentations.
- `e2e/draft-hydration.spec.mjs` and `e2e/structured-answer.spec.mjs`: delayed restoration, rapid edits, keyboard input, structured controls, persistence and narrow viewports.
- `check-review-library-ui.mjs`: the 4,827-template effective catalog, all 555 dedicated template families and their inspectable authored variants, source placement, generated previews, target grouping, historical namespace links and phone layout. Browsing and previews create no attempts or scheduling observations.

The initial integration failures were the six omitted Discrete inspection records/two TeX requirements and the fixed 300-ms browser assertion; the final runs pass with these repaired. CI status is available on each linked PR. No PR was merged, no code review was triggered, and nothing was deployed.

## Intentional limits

The mathematical review is independent agent reasoning plus bounded computational checks, not a formal proof of every exercise. Open-ended AI grading was not evaluated with live provider calls. The deterministic checker supports a bounded symbolic language. Unsupported calculus identities and unproved domain facts receive input guidance; the ordinary rational-expression checker can still reject a valid presentation when it cannot prove domain equivalence, as documented in the grader report. Browser testing uses Chromium and phone-sized viewports, not a physical mobile operating system or storage-exhaustion campaign. The tests establish the documented scenarios and invariants; they cannot guarantee every future network failure or multi-device interleaving.

No attempt-history product, evidence dashboard, new subject or bulk Review generation was added. The audit found concrete correctness and persistence defects worth fixing first.
