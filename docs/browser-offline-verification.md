# Final browser and offline verification

Baseline: `3719ac2` (main after PR #9), inspected September 20, 2026. All browser work used temporary synthetic accounts/databases and loopback services. No production learner data, external grading provider, deployment, or merge was involved.

## Findings and fixes

| Severity | Finding                                                              | Reproduction and consequence                                                                                                                                                                                               | Fix and regression                                                                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH     | Malformed successful upload acknowledgement loses the durable answer | Intercept `POST /api/v1/attempts` with HTTP 201 and body `{}`, without forwarding it. Previously `sync()` replaced the locally graded attempt with `{}` and deleted its outbox operation. The server held no copy.         | Validate the acknowledgement's identity, submission metadata, response, status, and grade envelope before replacing local data. Malformed replies retain the answer and queue. `syncAcknowledgement.test.ts` and the production-PWA failure injection reproduce this. |
| HIGH     | Malformed downloaded attempt loses the durable answer                | Integrate a change-feed record with the queued attempt ID but a truncated payload. Previously the payload replaced the complete local answer and removed its outbox operation.                                             | Validate all incoming attempt envelopes and key/revision consistency before opening the write transaction. A regression supplies a mixed valid/malformed batch and verifies unchanged attempts, records, outbox and cursor.                                           |
| MEDIUM   | Reentrant submission creates duplicate observations                  | Invoke the visible Submit button eight times in one browser turn. React's `saving` state has not yet committed, so all eight handlers previously saved distinct attempt IDs. The real server persisted eight observations. | Acquire a synchronous ref lock before awaiting draft writes. The same regression now observes one local/server attempt, including an interrupted HTTP acknowledgement and replay.                                                                                     |
| LOW      | Existing Review submission test assumes the wrong response family    | `quantifier-order × construct` and `quantifier-negation × transform` legitimately contain structured exercises. The script's editor lookup timed out after its choice/retry/recovery checks passed.                        | Select exclusively open `quantifier-order × counterexample` and `uniqueness × prove` families and assert that every issued item is free response. The original typed-submission and blur/reload assertions remain.                                                    |

The rapid-activation test is deliberately adversarial, using synchronous DOM activation. It does not claim eight ordinary physical clicks occurred within one rendering frame. The correctness fixes preserve exercise IDs, attempt IDs, original responses, and the existing server-owned scheduler.

A second LOW test defect reproduced during combined browser execution: `check-review-ui.mjs` asserted a server upload 300 milliseconds after the local Correct verdict. The local grade legitimately appears before background synchronization, so the assertion intermittently observed zero uploads. The check now waits for the successful POST response and durable outbox removal before asserting the exact submission count and Review context. Its reconnect check also waits for queue removal. No product behavior or correctness assertion was weakened.

### PR #10 preservation follow-up

The blocking comment identified a HIGH gap in the first fix: a well-shaped response could preserve the answer fields while removing or changing its immutable Review, effort, assistance, uncertainty, presentation, or analytics context. New regressions reproduced this for upload acknowledgements and downloaded records. The comparison now covers every immutable submission field, including nested Review parameters and explicit false/zero values. Existing frozen questions and analytical snapshots must survive unchanged. Review attempts require a valid context, matching instance/exercise identity, and a frozen presentation.

Download validation compares against the attempt cache, original queued submission, and any confirmed record inside the same transaction, before any writes. A malformed batch leaves attempts, records, queue, cursor, drafts, and media unchanged. Duplicate attempt keys and a server reply claiming local-only `queued` status are rejected. Confirmed grade history remains append-only, including cancellation replies and the interval between an upload acknowledgement and its first change-feed record.

Compatibility exceptions follow the actual API: ordinary lesson presentations omit display/placement fields; assessment objects may appear at both presentation levels; JSON object ordering is irrelevant; structured submissions omit scratchwork; Go omits empty photo arrays and serializes some legacy missing answers as null. Missing historical snapshots may be backfilled. Dedicated Review templates currently lack analytics and can return null, so absence is accepted only when no existing snapshot would be lost. The check does not manufacture analytical evidence. Imported revision-zero records can receive server grade defaults, while confirmed records retain their original grades.

Photo/handwriting media can retire only with a retained, nonblank transcription supported by a non-`not_graded` grade, and with images, photo references, and ink retired together. Existing transcriptions cannot change. Already-retired legacy history with incomplete grades remains readable but cannot authorize deleting local draft scratchwork or media. Regression fixtures for legitimate retirement now include the transcription grade actually produced by the server.

The production-PWA test intercepts a Review POST without forwarding it, returning the same answer and grade envelope but removing Review/context fields. It verifies that the complete local attempt and one queued submission survive reload, that the server has no copy, and that a later genuine acknowledgement synchronizes once against the frozen definition after a catalog upgrade. Synthetic Review fixtures now return realistic frozen presentations and, where present, analytical snapshots rather than echoing only the stripped submission payload.

## Scenarios and evidence

`scripts/check-offline-hardening.mjs` runs the production build with an active service worker and the real Go API. It checks:

- Malformed acknowledgement, reload before synchronization, retained outbox ID, and eventual single server acceptance.
- Well-shaped but truncated Review acknowledgement; preserved immutable context and queue across reload before the server receives the answer.
- Offline incorrect answer followed by a correct retry; both upload in order and remain separate observations.
- Multiple offline exercises, a durable draft, close/new-tab reopen in the same browser context, and restored scratchwork.
- Back/forward navigation and a 390 × 844 viewport without horizontal overflow.
- Server commit followed by a dropped HTTP response; replay is idempotent.
- Eight immediate Submit activations yield one persisted attempt after the lock fix.
- UI export/import preserves confirmed history byte-for-byte and creates no duplicate attempt.
- A cached Quick focused session survives replacing the server catalog with a different version and removing all dedicated Review templates. Its answer is graded against the original frozen question.
- A delayed acknowledgement keeps the attempt queued until the response arrives. The frozen content version and presentation remain intact.
- Reload resumes at the next unanswered Review item; navigating back reveals the completed frozen answer. Re-fetching the server schedule returns identical target states.

Additional existing browser checks passed:

| Check                                    | Coverage                                                                                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-review-submission-ui.mjs`         | Real API choice grading, retry, effort timing, rejected-effort recovery, typed Regular response, blur/reload draft restoration; open grading is cancelled locally.                           |
| `check-review-ui.mjs`                    | Regular/Quick switching, deferred deep evidence, focused filters, API outage, cached Review session and queued sync. This script blocks service workers and uses synthetic API responses.    |
| `check-deterministic-ui.mjs`             | 25 real server-verified attempts, calculus/statistics forms, offline retry and sync, frozen presentations, scratchwork text/pen/photo, and export/import to a new browser context.           |
| `web/tests/draftHydration.browser.mjs`   | Delayed local draft hydration, rapid field edits, reload and keyboard input.                                                                                                                 |
| `web/tests/structuredAnswer.browser.mjs` | Structured controls and browser persistence under unavailable upload service.                                                                                                                |
| `check-review-library-ui.mjs`            | Published catalog/filter/target grouping, authored and generated previews, historical exercise namespaces, lesson navigation and mobile layout; previews do not create learner observations. |

Go provider-trap and frozen-definition/restore tests run in the full server suite. The sync-envelope regressions explicitly retain `not_graded` responses and historical open attempts with empty grade histories. Existing unit tests additionally cover historical exercise-key mappings, changed assessment fingerprints, earlier draft preservation, immutable imported grades, and restore ordering. No new browser test was added solely for a passing scenario; the new torture test centers on the reproduced persistence failures.

## Validation

On the offline-hardening branch: `npm test` (835 passing), `npm run typecheck`, `npm run web:build`, `npm run web:test` (94 passing after the preservation follow-up), `npm run format:check`, `go test -count=1 ./...`, and `go test -race -count=1 ./...` passed. The server suite includes deterministic shared fixtures, provider traps and frozen Review restore. Browser commands above use the existing installed Playwright/Chrome runtime, selected through `PLAYWRIGHT_MODULE`/`CHROME_BIN`. The follow-up additionally reran the production offline hardening, real-API deterministic, and synthetic Review browser suites.

The production build retains the pre-existing large-chunk advisory. No scheduler interval, evidence-depth rule, or curriculum coverage target changed in this branch.

## Screenshots and limits

Visually inspected captures: [single accepted submission, desktop](screenshots/final-verification/single-submission-desktop.png), [phone](screenshots/final-verification/single-submission-phone.png), and [restored offline scratchwork](screenshots/final-verification/offline-phone.png). The first two show one persisted submission with its incorrect verdict, rather than duplicate observations.

Browser coverage uses desktop Chromium with phone viewport dimensions. It does not emulate a physical mobile keyboard, mobile OS process eviction, storage quota exhaustion, or concurrent edits on separate physical devices. Close/reopen uses a new tab within the same browser context, not an OS crash. The catalog-upgrade test changes the real API catalog while retaining the cached production client; it is not a test of downloading a newly deployed service-worker bundle. Server history remains authoritative. New Review planning still requires connectivity, and unsupported symbolic input still receives the bounded checker's input guidance.
