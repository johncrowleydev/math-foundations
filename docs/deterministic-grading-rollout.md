# Deterministic grading rollout

This document describes a future coordinated release. The implementation branch does not deploy, merge, push, or request code review. The original working tree and its local stylesheet change are preserved.

## Release contents

Ship the Go server, the PWA build, and `output/grading-catalog.json` from the same commit. Build content before either application artifact. The catalog includes all deterministic definitions; the PWA includes the same definitions and validator code for offline grading. No grading service, scripting runtime, computer-algebra dependency, attempt table, or data-directory migration was added.

The source-pinned conversion catalogs are `content/deterministic-exercises.json`, `content/deterministic-linear.json`, and `content/deterministic-algorithms.json`. Dedicated Review assessments live on their actual questions/variants in `content/review-templates.json`. Generate these through their authoring scripts; never patch `output/content` or the grading catalog by hand.

Run the following in the implementation worktree before preparing a release:

```sh
npm ci --ignore-scripts
npm ci --ignore-scripts --no-install-links --prefix web
npm run content
npm run typecheck
npm test
npm run web:build
npm run web:test
node --import tsx scripts/check-tex-release.ts
node --import tsx scripts/deterministic-coverage.ts
```

Run `go test ./...` and build the server from `server/`. Build the PWA before running its unit tests: the tests inspect its bundled curriculum. Run `scripts/check-deterministic-ui.mjs`, `web/tests/structuredAnswer.browser.mjs`, and `web/tests/draftHydration.browser.mjs` with an available Playwright module as described in the [screenshot record](screenshots/deterministic/README.md). The web install flag installs the existing local root-package dependency without its package-link lifecycle issue; it changes no project dependency. Content generation validates source coverage, source pins, mutually exclusive grading methods, metadata, and every authored accepted/rejected fixture. TS and Go run the same language-neutral conformance cases.

## Coordinated activation

1. Retain a consistent pre-release backup of the SQLite database and media, plus the previous server, catalog, and web release. Keep data under `/var/lib/math-foundations`; preserve the existing weekly backup timer and retention policy.
2. Stage all release artifacts under the established release directory. Set `FOUNDATIONS_CATALOG` to this release's catalog. Preserve existing credentials, session configuration, provider settings, and origin; no secret changes are required.
3. Use a brief maintenance window when switching the active server/catalog and the web release. Restart the service only after its matching catalog is in place. Follow the existing [PWA deployment process](pwa-deployment.md).
4. Verify authenticated catalog and Review readiness, then load the new PWA and allow its service worker to activate. Existing tabs must refresh before using converted questions. The authoritative server never accepts a client-selected grading method.
5. Smoke-test a truth table, typed fraction, matrix, finite set, formula, and frozen Review question. Test one incorrect submission followed by correction, with feedback hidden until requested. Confirm there are no grading/transcription jobs for deterministic submissions.
6. Verify an existing open proof still uses its normal provider path. With the provider key absent, deterministic grading and Review remain available; open-response grading reports provider unavailability. A missing key does not make the catalog unavailable or consume retries on queued open jobs.
7. Verify weekly backups and retain the previous release for recovery. Deployment should include the screenshots and validation record from the release commit.

## Old clients, offline work, and saved history

A stale client can still hold an old question and an old queued attempt. A converted lesson cannot accept an old text/photo/ink payload as a current structured answer. Content-version/method rejection is intentional: the queued attempt remains unchanged, with its original content version and saved work. Recovery creates a new draft for the current question; it does not rewrite the rejected attempt or send its scratchwork for transcription.

Structured drafts carry an exact fingerprint of the effective question and assessment. Matching drafts restore normally. Incompatible structured values remain accessible as earlier saved work. Existing text, strokes, and photos remain local scratchwork, including after a correct answer. Do not clear browser storage, delete the outbox, or replace IDs to resolve stale-client failures.

The outbox preserves chronological upload, idempotency, and correct-answer locks. A response accepted locally offline is independently recomputed by the server from its trusted catalog or frozen Review instance. Historical attempts render the original server-owned question, labels, and assessment snapshot. Historical Review instances continue to use their issued definition, including an older wholly open definition after the current lesson converts.

## Backups and imports

The client continues to export backup version 2 and accepts existing versions 1 and 2. Structured responses, presentation snapshots, drafts, earlier work, Review records, and local scratch media are included in the existing backup/export paths. No cross-device scratchwork synchronization is introduced.

Restore a backup containing structured work with a client/server release that understands this assessment version. A pre-feature application may not understand newly added fields even though the archive envelope remains version 2. Preserve the original export; do not strip new fields or relabel the archive to force an older importer to accept it. Conflicts retain their original imported archive according to the existing import behavior.

Restore recomputes deterministic results whenever the original assessment is available: the server uses frozen Review context or the matching lesson catalog, and archived lesson snapshots retain their original definition. Client backup import performs the same consistency check on available snapshots before writing local data. An imported verdict, grade, or requirement outcome that disagrees rejects the import atomically; it does not silently rewrite history or create a model job. Valid historical feedback and timestamps remain intact, and open work without a verifiable original assessment retains its historical grades. Preserve a rejected archive unchanged for investigation. New recognition responses cannot satisfy production or proof targets.

## Rollback

Roll back the server, catalog, and web artifacts together. Never pair a new structured catalog with an old server, or serve new clients against an old grader. Retain the live data and immutable media; switching an artifact symlink is not authority to discard attempts submitted after release.

After structured attempts have been recorded, prefer a known-good release that supports structured assessments. If recovery requires a pre-feature binary, keep grading/sync in maintenance while restoring or repairing compatibility. Do not run an old model worker against new structured attempt data: it lacks the deterministic dispatch guards. A full pre-release database restore would discard newer work and requires a separately authorized recovery decision and preservation of the current database/export first.

Reopen the API only after catalog/version checks, old-history rendering, a deterministic no-provider submission, a frozen Review restore, and an outbox reconnect have passed against the restored release. Authentication and the weekly backup service must remain intact.
