# Foundations

Foundations is a responsive, installable React/TypeScript mathematics notebook at https://foundations.johncrowley.dev. The Go/SQLite backend provides private email/password sessions, synchronization, and AI grading. Android is retired; its source remains in Git history and historical APK releases are unchanged.

## Development

Requires Node 22.12+ and Go 1.23+; no Android tooling is required.

```sh
npm ci
npm ci --prefix web --no-install-links
npm run content
FOUNDATIONS_API_TARGET=http://127.0.0.1:18084 npm run web
```

Run these commands from the repository root. `--no-install-links` preserves the parent-package symlink recorded in the web lockfile and avoids npm 9's default of installing it as a packed dependency.

Open http://localhost:5173. Authenticated use requires a running backend; see [local API setup](docs/web-client.md#local-api). `npm run web:build` creates the offline production bundle. `FOUNDATIONS_API_TARGET=http://127.0.0.1:18084 npm run web:preview` serves it at http://localhost:4173. The development and preview servers proxy `/api` to `FOUNDATIONS_API_TARGET`, defaulting to production when it is unset. For local cookie-auth testing use localhost and configure the backend's `FOUNDATIONS_ORIGIN` to that exact frontend origin.

### Paseo worktrees

[`paseo.json`](paseo.json) installs root and web dependencies, generates content, and
downloads Go modules when Paseo creates a worktree. Node and Go must already be
available. Paseo reads this configuration from the committed base branch used to
create the worktree; uncommitted configuration does not apply to new worktrees.

Run `web`, `preview`, `content`, or `check` from Paseo's workspace scripts. `web`
starts hot-reload development; `preview` builds and serves the offline PWA; both
use Paseo-assigned ports so multiple worktrees can run concurrently. `check` runs
TypeScript checking, curriculum and web tests, the web build, and Go tests.

The web services use the existing `FOUNDATIONS_API_TARGET` setting, defaulting to
the production API when unset. For a local backend, follow the
[local API setup](docs/web-client.md#local-api) and set `FOUNDATIONS_ORIGIN` to the
exact frontend URL you open, including its assigned port. These scripts do not
create accounts or start an API server. See [Paseo's worktree documentation](https://paseo.sh/docs/worktrees.md)
for service URLs and lifecycle details.

## Content and checks

The [full curriculum study plan](docs/study-plan.md), preserved from the original math repository, covers discrete mathematics and proofs, linear algebra, calculus, probability and statistics, and final review. The authored curriculum now includes 15 discrete-mathematics lessons and 12 instructional linear-algebra lessons, plus a reading-only 00 Introduction for each subject. The linear-algebra pacing revision preserves 697 worksheet questions and expands 20 existing quick checks to 24 with four new checks. The bases lesson precedes rank and inverses; orthogonality and projections precedes least squares and model fitting. The [pacing audit](docs/linear-algebra-pacing.md) records the sequence, identity contract, verified authoring checks, and pending integration validation.

Linear algebra retains 92 reference entries and seven coordinate figures. The historical [correction and inspection record](docs/linear-algebra-audit.md) describes the earlier coverage and fixes. The study plan retains its original timeline and references to the earlier worksheet/PDF workflow; the current PWA uses inline and focused practice.

Follow [subject authoring guidance](docs/content-authoring.md), including the required reading-only introduction for every future subject. Author lesson documents directly in `content/lessons/*.mdx`, and exercises, reviews, sources, figures, and grading metadata in YAML/JSON under `content/`. Explicit MDX component tags connect lessons to the React controls; imports and JavaScript expressions are rejected. There is no curriculum-generation step. `scripts/build-content.ts` validates and compiles these canonical sources into runtime assets under `output/content` and the server catalog at `output/grading-catalog.json`. Exercise identities and catalog hashes remain compatible with existing notebook data. Formula inventory: `npx tsx scripts/build-content.ts --inventory-only`.

```sh
npm test
npm run typecheck
npm run web:build
npm run web:test
cd server
go test ./...
```

Build before running web tests on a fresh checkout: the build copies generated curriculum assets into `web/public`, which the tests read. Go provider tests are opt-in through `FOUNDATIONS_LIVE_TEST_KEY`; leave it unset for ordinary local checks.

See [deployment and authentication](docs/pwa-deployment.md) and [web-client behavior](docs/web-client.md).
Learning analytics and grading v5 are documented in [Learning evidence](docs/learning-evidence.md).
