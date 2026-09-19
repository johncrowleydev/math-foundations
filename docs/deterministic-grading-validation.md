# Deterministic grading validation

The implementation is on `feat/deterministic-grading` in the isolated `foundations-deterministic` worktree. Its integration baseline combines the pacing/toast branch with the Review integration branch. The original working tree, its uncommitted stylesheet change, and its original audit files remain intact.

## Recorded result

Final checks passed on September 19, 2026:

- 688 curriculum, authoring, coverage, and validator tests.
- 69 web unit tests and the complete Go suite.
- TypeScript checks, source/TeX release validation, exact coverage regeneration check, and production/PWA build.
- All three browser scripts. The integrated script records 16 server-verified attempts with the expected offline verdicts, no model or media uploads, and intact local scratchwork/history.
- Formatting for all 107 changed supported files, `gofmt` for changed Go files, and syntax checks for seven Python authoring scripts.
- 21 captured screenshots, with phone/desktop controls and the final member-selection and matrix layouts visually inspected.

## Coverage and mathematical checks

The [generated coverage report](deterministic-coverage.md) and [complete ledger](deterministic-coverage.json) account for all 2,064 lesson items and 173 dedicated Review definitions. There are 1,389 newly structured lesson assessments and 22 newly structured Review definitions. With existing choices, deterministic totals are 1,572 lesson items and 169 dedicated Review definitions. Every remaining open item has its own retention reason; no item requires both a deterministic submission and a model-graded explanation.

Content validation exercises 6,264 authored accepted, rejected, and invalid-input fixtures: 2,728 in the main conversion catalog, 2,652 in linear algebra, 743 in algorithms/combinatorics, and 141 in dedicated Review. TypeScript and Go also run the shared language-neutral conformance corpus. Nonunique constructions are checked by properties, including alternative bases, solution spaces, eigenvectors, matrix decompositions, witnesses, and graph routes. Finite relation and predicate constructions use ordinary member selection, including an explicit empty interpretation, without requiring every absent member to be marked false.

The server tests cover all 33 validator families through the actual attempt endpoint. Provider traps and job-count assertions cover correct, incorrect, malformed, duplicate, recheck, forged-mode, frozen Review, and archive-restoration paths. Separate tests verify catalog/Review readiness without a provider key and preserve the open-response provider path.

Source coverage, original question pins, mutually exclusive assessment methods, requirement definitions, authored fixtures, complete TeX inspection records, and exact disposition/catalog agreement are release checks. The [source inspection logs](deterministic-source-inspection.md), [linear algebra log](deterministic-linear-source-inspection.md), [algorithms log](deterministic-algorithms-source-inspection.md), and [grid inspection](deterministic-grid-inspection.md) record the supporting passages and example checks.

## Reproducible commands

From the implementation worktree:

```sh
npm run typecheck
npm test
npm run web:build
npm run web:test
node --import tsx scripts/check-tex-release.ts
node --import tsx scripts/deterministic-coverage.ts
```

From `server/`, run `go test ./... -count=1`. Run the three browser scripts using `PLAYWRIGHT_MODULE` as documented in the [screenshot record](screenshots/deterministic/README.md). Formatting checks cover changed files; all changed Go files pass `gofmt`, and all seven changed Python authoring scripts parse successfully.

## Browser scope and release limits

The production PWA browser check uses an isolated temporary Go database and synthetic answers. It exercises truth-table controls, typed exact expressions, matrices, intervals, finite sets, graph selections/routes, alternative linear-algebra constructions, validation errors, hidden feedback, offline submission/reload, scratchwork preservation, export/import, attempt history, and Review Library previews. The separate component fixture checks atomic grid paste and wide-table scrolling. A delayed-storage browser regression verifies that draft loading cannot expose empty editors and subsequently overwrite newly entered values; it also checks rapid edits, reload, and native keyboard input. An external-restoration assertion verifies that the hidden lesson editor and visible practice editor cannot echo restored values as new edits or overwrite one another's latest draft.

Phone checks use Chromium at 320px and 390px widths; desktop checks use 1440px. A reduced 320 × 420 viewport checks focused-cell visibility with less space available above a phone keyboard. These checks do not emulate a native iOS or Android keyboard. Screenshots contain only synthetic work.

The production build reports a chunk-size advisory: the main bundle is approximately 1.24 MB minified / 382 KB gzip, and the complete offline precache is approximately 13.1 MiB. The build succeeds and the offline browser checks exercise the generated service worker. No external computer-algebra runtime or grading service was added.

Use the [rollout instructions](deterministic-grading-rollout.md) for coordinated server/catalog/PWA compatibility, stale clients, existing versioned backups, and rollback. Deployment, pushing, merging, and a separate code-review request are outside this implementation.
