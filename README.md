# Foundations

Foundations is a responsive, installable mathematics notebook at https://foundations.johncrowley.dev. The React/TypeScript PWA supports offline reading, practice, handwriting, review, and learning progress. The Go/SQLite backend provides private email/password sessions, synchronization, deterministic and AI grading, and review scheduling.

The curriculum covers discrete mathematics and proofs, linear algebra, calculus,
and probability and statistics. Each subject starts with a reading-only
**00 Introduction**, followed by lessons with inline exercises and optional
additional practice. The subject introductions describe prerequisites and how to
study; `content/curriculum.yaml` defines the current sequence. Android is retired.

## Development

Requires Node 22.12+ and Go 1.23+; no Android tooling is required.

```sh
npm ci
npm ci --prefix web --no-install-links
npm run content:build
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

Author lesson documents directly in `content/lessons/*.mdx` and structured
curriculum in YAML/JSON under `content/`. The normal build validates and compiles
these sources into ignored runtime assets under `output/`; MDX lessons compile
directly to React. Follow [content authoring](docs/content-authoring.md) and
[source requirements](docs/content-sources.md), preserving lesson slugs, exercise
IDs, grading history, and saved work.

```sh
npm test
npm run typecheck
npm run web:build
npm run web:test
cd server
go test ./...
```

Build before running web tests on a fresh checkout: the build copies generated curriculum assets into `web/public`, which the tests read. Go provider tests are opt-in through `FOUNDATIONS_LIVE_TEST_KEY`; leave it unset for ordinary local checks.

See [tooling and tests](docs/tooling.md) for targeted checks, browser testing, and
independent mathematical verification. The [documentation index](docs/README.md)
links to architecture, client behavior, grading, review, deployment, and recovery.
