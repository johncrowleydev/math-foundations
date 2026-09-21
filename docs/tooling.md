# Tooling and tests

Run commands from the repository root with Node 22.12+, Go, and Python 3.
Install JavaScript dependencies with `npm ci` and `npm ci --prefix web --no-install-links`.

```text
web/src/                  React/PWA application
server/                   Go API, Go tests, deployment utilities
shared/                   runtime grading and input contracts
content/                  canonical MDX, YAML and JSON curriculum
tools/
  content/                parsing, validation and runtime asset compilation
    compatibility/        deployed grading-version mapping used by the build
  audit/                  architecture, curriculum inventory, coverage, TeX audits
  verification/           independent Python mathematical verification
tests/
  content/                build, metadata, citations and published compatibility
    fixtures/             captured published contracts
  curriculum/             teaching order and mathematical regressions
    fixtures/             historical split ownership and pacing
  grading/                TypeScript grading and input conformance
    fixtures/             common TS/Go cases and independent adversarial corpus
  review/                 declarative review definitions and variants
  utilities/              standalone exporter tests
web/tests/                client unit and integration tests
e2e/                      browser checks and their local runner/support
scripts/                  standalone user utilities: export-learning-data.py
docs/                     developer documentation and retained audit reports
output/                   ignored build, audit and browser artifacts
```

Do not add general tooling or tests to `scripts/`. Keep reusable processors under
`tools/`, fixtures with their tests, and browser checks under `e2e/`. Canonical
learning material stays declarative under `content/`; builds never author it.

| Command                                       | Purpose and outputs                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run content:validate`                    | Architecture and full content validation; writes no artifacts.                                                             |
| `npm run content:build`                       | Same validation, then runtime JSON in `output/content/`, grading catalog and formula inventory in `output/`.               |
| `npm run content:inventory`                   | Formula occurrence inventory in `output/`; does not certify source review.                                                 |
| `npm run audit:curriculum`                    | After a content build, checks introduction evidence and deterministic coverage; writes `output/curriculum-inventory.json`. |
| `npm run audit:architecture`                  | Enforces declarative curriculum and build/browser boundaries.                                                              |
| `npm run audit:deterministic`                 | Checks the committed coverage ledger/report; explicit `-- --write` refreshes reports after inspection.                     |
| `npm run audit:tex`                           | Strict release gate for manual TeX inspection status and hashes.                                                           |
| `npm test`                                    | Explicit content build, curriculum audits, root TS tests and Python exporter test.                                         |
| `npm run test:unit`                           | Root TS tests using existing build/audit outputs.                                                                          |
| `npm run test:utilities`                      | Python exporter test against synthetic SQLite data.                                                                        |
| `npm run typecheck`                           | Strict TS checking of tooling, root tests and TS browser checks.                                                           |
| `npm run web:build`                           | Content build and production PWA build, including web typechecking.                                                        |
| `npm run web:test`                            | Client tests; run the content/web build first on a fresh checkout.                                                         |
| `npm run test:e2e`                            | All browser checks against isolated local services; requires the production build.                                         |
| `(cd server && go test -race -count=1 ./...)` | Go tests, including the shared grading fixtures and published catalog.                                                     |

Tests and builds never mutate canonical `content/`. Each CI job checks tracked
changes and untracked files under `content/`, including after a failed command.
There are no hidden root `pretest`/`precontent` hooks.

## CI layout

The workflow has seven plainly named jobs:

- **quality** starts immediately: formatting, root typecheck, architecture/content
  validation without writes.
- **content** starts immediately and compiles the curriculum once. Its immutable
  `curriculum` artifact contains runtime content, grading catalog and formula
  inventory from this exact workflow run.
- **unit**, **web**, **verification**, and **go** run concurrently after content.
  They respectively run curriculum/TeX audits and root tests, the production PWA build
  and web tests, both independent Python oracles, and `go test -race ./...`.
- **e2e** downloads the same curriculum and the web job's production assets. It
  runs all browser specs with two isolated workers; it never rebuilds content or
  the production PWA. Go race tests do not wait for browser tests.

CI calls the existing build/test primitives explicitly: `content:build` once,
`audit:curriculum`, `test:unit`, `test:utilities`, and `npm run build --prefix web`.
The convenient local `npm test` and `npm run web:build` commands still prepare
all their prerequisites. Read-only `content:validate` remains a separate check;
it validates source data again but does not compile a second set of artifacts.
Artifacts are mandatory, scoped to the current run, and retained for seven days.

Standard `setup-node` npm download caches use the root lockfile, or both lockfiles
for web/E2E jobs. `setup-go` retains module/build caching keyed by Go version and
`server/go.sum`. Python's pip cache uses the pinned verification requirements.
Each job installs only the dependencies it needs; no `node_modules` is transferred.
Playwright's browser and system-dependency installation took only 22 seconds in
the measured baseline. Keep the lockfile-compatible Chromium installation rather
than caching large browser archives, following
[Playwright's CI guidance](https://playwright.dev/docs/ci#caching-browsers).

All checks run on every PR and main push. No path gating is introduced: curriculum,
grading and browser contracts cross directory boundaries, so conservative full
coverage remains easy to understand. Superseded runs of the same PR are cancelled.
Each major check has its own timed Actions step; E2E writes per-spec timings and
Go's JSON test events are retained as artifacts for future investigations.

## Browser checks

```sh
npm run web:build
npx playwright install chromium
npm run test:e2e
npm run test:e2e -- mdx sources offline
```

The runner discovers `e2e/*.spec.ts` and `*.spec.mjs` and runs two specs at a
time, starting the longest measured suites first. Set `E2E_WORKERS=1` for serial
troubleshooting; only integer limits from 1 to 4 are accepted. Every selected spec
runs even if another fails. `output/e2e/timings.json` records per-spec outcomes and
elapsed times as well as overall wall time.

Checks use separate ephemeral loopback ports, browser contexts, temporary Go
databases, screenshot directories and Vite dependency caches. They clean up their
processes and use synthetic data or mocked API responses. Screenshots and captured
reports go under ignored `output/e2e/`. `CHROME_BIN` optionally selects an existing
browser; `PLAYWRIGHT_MODULE` optionally selects another Playwright installation.
The default is Playwright's full Chromium executable running headless, preserving
the browser mode used by the original Chrome checks.
Larger existing MJS checks remain JavaScript; the small checks and runner use TS.

## Independent verification and fixtures

`npm run verify:adversarial` regenerates independent Python oracle values in memory
and compares them to `tests/grading/fixtures/deterministic-adversarial-corpus.json`
without writing it. TypeScript and Go execute that same corpus against their own
graders. To intentionally regenerate the synthetic fixture, run
`python3 tools/verification/deterministic-adversarial.py` and inspect the diff.

The linear algebra verifier uses SymPy to check authored numerical exercises:

```sh
python3 -m venv output/verification-venv
. output/verification-venv/bin/activate
python -m pip install -r tools/verification/requirements.txt
npm run verify:linear-algebra
```

`uv venv output/verification-venv` and `uv pip install --python
output/verification-venv/bin/python -r tools/verification/requirements.txt` are
equivalent when the system Python lacks `venv` support. Both this exact SymPy
verifier and the strict TeX inspection audit run in CI; neither regenerates
expected data or inspection records.

The published compatibility fixture contains independently captured deployed
hashes; never regenerate it simply to pass a test. Pacing fixtures preserve
historical exercise owners/namespaces. The live grading-version mapping belongs
with its build consumer and has exact-match and changed-content tests.
See the [complete cleanup inventory](tooling-inventory.md) for deletion evidence
and the original-to-current file map.
