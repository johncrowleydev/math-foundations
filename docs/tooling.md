# Tooling and tests

Run commands from the repository root with Node 22.12+, Go (version in
`server/go.mod`), and Python 3. Install JavaScript dependencies with `npm ci` and
`npm ci --prefix web --no-install-links`.

## Directory ownership

| Location                         | Purpose                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `web/src/`, `server/`, `shared/` | React/PWA client, Go API, and shared grading/input contracts.                                                          |
| `content/`                       | Canonical curriculum: lesson MDX and structured YAML/JSON.                                                             |
| `tools/content/`                 | Parsing, validation, runtime compilation; `compatibility/` holds the deployed grading-version mapping.                 |
| `tools/audit/`                   | Architecture, curriculum, deterministic coverage and TeX audits; `deterministic/` holds required conversion baselines. |
| `tools/verification/`            | Independent Python mathematical verifiers and their dependencies.                                                      |
| `tests/`, `web/tests/`           | Root and client tests; fixtures stay beside their consuming tests.                                                     |
| `e2e/`                           | Browser checks, runner, and shared browser/server setup.                                                               |
| `scripts/`                       | Intentionally user-invoked standalone utilities, currently the learning-data exporter.                                 |
| `docs/`                          | Current project documentation.                                                                                         |
| `output/`                        | Ignored build, audit and browser artifacts.                                                                            |

Builds compile curriculum; they never author it. Do not put general tooling, test
fixtures or browser checks in `scripts/`.

## Commands

| Command                                       | Purpose and prerequisites                                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm run content:validate`                    | Architecture and complete content validation without writing artifacts.                                                            |
| `npm run content:build`                       | Validate, then compile runtime JSON to `output/content/`, grading catalog and formula inventory to `output/`.                      |
| `npm run content:inventory`                   | Write formula occurrence inventory to `output/`; does not certify source inspection.                                               |
| `npm run audit:architecture`                  | Enforce declarative curriculum and build/browser boundaries.                                                                       |
| `npm run audit:curriculum`                    | After a content build, check introduction evidence and deterministic coverage; write reports to `output/`.                         |
| `npm run audit:deterministic`                 | After a content build, verify conversion contracts against committed inputs and digest; write coverage JSON/Markdown to `output/`. |
| `npm run audit:tex`                           | Strict check of manual TeX inspection status and hashes.                                                                           |
| `npm test`                                    | Build content, run curriculum audits, root TypeScript tests and Python exporter tests.                                             |
| `npm run test:unit`                           | Root TypeScript tests using existing build/audit outputs.                                                                          |
| `npm run test:utilities`                      | Exporter regression test against synthetic SQLite data.                                                                            |
| `npm run typecheck`                           | Typecheck tooling, root tests and TypeScript browser checks.                                                                       |
| `npm run format:check`                        | Check repository formatting.                                                                                                       |
| `npm run web:build`                           | Build content and the production PWA, including client typechecking.                                                               |
| `npm run web:test`                            | Client tests; build content/web first on a fresh checkout.                                                                         |
| `npm run test:e2e`                            | Browser checks against isolated local services; requires a production build and Chromium.                                          |
| `(cd server && go test -race -count=1 ./...)` | Go tests against shared grading fixtures and the built grading catalog.                                                            |

## Browser checks

```sh
npm run web:build
npx playwright install chromium
npm run test:e2e
npm run test:e2e -- mdx sources offline
```

The runner discovers `e2e/*.spec.ts` and `*.spec.mjs` and runs two specs concurrently.
Pass spec names without extensions to select checks. `E2E_WORKERS` accepts integers
from 1 to 4; use 1 for serial troubleshooting. `E2E_SHARD=1/2` or `2/2` selects a
disjoint half of the same ordered discovery list. Specs are ordered using measured
CI durations so each shard starts its longest checks first. Every selected spec
runs even if another fails.

The runner uses the production React runtime while retaining Vite source modules
for fixture setup. Direct spec invocations use the default development runtime
unless `NODE_ENV=production` is set.

Checks use separate loopback ports, browser contexts, temporary Go databases,
screenshot directories and Vite caches, then clean up their processes. They use
synthetic data or mocked responses. Screenshots and `timings.json` go under
`output/e2e/`. `CHROME_BIN` selects an existing Chromium executable;
`PLAYWRIGHT_MODULE` selects another Playwright installation. Defaults use
Playwright's headless Chromium.

## Verification and compatibility data

`npm run verify:adversarial` independently computes Python oracle values and
compares them with `tests/grading/fixtures/deterministic-adversarial-corpus.json`.
TypeScript and Go grade that same corpus. An intentional fixture update uses
`python3 tools/verification/deterministic-adversarial.py`; inspect its diff.

The linear algebra verifier checks authored numerical exercises using SymPy:

```sh
python3 -m venv output/verification-venv
. output/verification-venv/bin/activate
python -m pip install -r tools/verification/requirements.txt
npm run verify:linear-algebra
```

`tools/audit/deterministic/` retains only the original questions and disposition
fields used to validate the initial deterministic conversion's 2,064 lesson
identities and 173 dedicated Review definitions. Later subjects are validated by
the content pipeline. The coverage check enforces original hashes, stable
identities, source pins, published assessment equality, grading methods, and
individual reasons for retained open responses. `coverage-baseline.json` pins
the complete generated ledger with a SHA-256 digest independent of formatting
and JSON object key order. Reports are generated under `output/`. After an
intentional contract change, inspect the differences before running
`npm run audit:deterministic -- --write` to update the digest.

`tests/content/fixtures/published-compatibility.json` contains independently
captured deployed hashes. Never regenerate these or inspection digests simply to
pass validation. An intentional artifact change needs its exact new hash, repair
commit and inspection provenance recorded separately, preserving the original
capture. Historical inspection references use `commit:path`; read them with
`git show <commit>:<path>`. Pacing fixtures preserve published exercise ownership
and namespaces. The build's grading-version mapping stays with its build
consumer because queued offline submissions depend on it.

## Learning-data export

Run the standalone exporter where the database, release, and media paths are
readable. Choose a new ZIP filename in an existing private directory:

```sh
python3 scripts/export-learning-data.py \
  --database /var/lib/math-foundations/notebook.db \
  --release /opt/math-foundations/current \
  --media /var/lib/math-foundations/media \
  --output /path/to/private/export.zip
```

It opens SQLite read-only and refuses to overwrite an existing archive. The ZIP
contains private learner work for analysis, not a browser-import file or a
complete server backup. See [learning evidence](learning-evidence.md#export-and-validation)
for its contents and [backup recovery](backup-media-integrity.md) for server snapshots.

## Continuous integration

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs all checks on every
pull request and main push:

- **quality** runs formatting, root typechecking and content validation without
  writes.
- **content** builds the shared curriculum once and uploads its runtime content,
  grading catalog and formula inventory.
- **unit**, **web**, **verification**, and **go** consume that build concurrently:
  root tests/curriculum/TeX audits, production PWA/client tests, independent Python
  verification, and Go race tests. A shared published-catalog fixture decodes the
  large artifact once and makes isolated copies for Go race tests.
- **e2e** consumes both curriculum and production web artifacts across two shards,
  with two isolated workers each. Both shards finish even if one fails.

Artifacts are scoped to the current run and retained for seven days. Jobs install
their own dependencies using lockfile-based caches. Every job checks that canonical
`content/` remains unchanged, including after failures. Superseded runs for the
same pull request are cancelled.
