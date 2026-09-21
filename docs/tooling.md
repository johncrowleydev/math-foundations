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

Tests and builds never mutate canonical `content/`. CI checks this after the
complete workflow. There are no hidden root `pretest`/`precontent` hooks.

## Browser checks

```sh
npm run web:build
npx playwright install chromium
npm run test:e2e
npm run test:e2e -- mdx sources offline
```

The runner discovers `e2e/*.spec.ts` and `*.spec.mjs`, runs them serially, and
reports failures. Checks launch loopback Vite/Go services, use synthetic data or
mocked API responses, and clean up their processes. Screenshots and captured
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
equivalent when the system Python lacks `venv` support. This supplemental verifier
currently stops at the pre-existing `linear-algebra-vectors/23` prompt/fixture
divergence. The strict TeX release gate also reports 24 pre-existing stale audit
records. Neither is repaired by refreshing source data during structural cleanup.

The published compatibility fixture contains independently captured deployed
hashes; never regenerate it simply to pass a test. Pacing fixtures preserve
historical exercise owners/namespaces. The live grading-version mapping belongs
with its build consumer and has exact-match and changed-content tests.
See the [complete cleanup inventory](tooling-inventory.md) for deletion evidence
and the original-to-current file map.
