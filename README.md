# Foundations

Foundations is a responsive, installable React/TypeScript mathematics notebook at https://foundations.johncrowley.dev. The Go/SQLite backend provides private email/password sessions, synchronization, and AI grading. Android is retired; its source remains in Git history and historical APK releases are unchanged.

## Development

Requires Node 22.12+ and Go 1.23+; no Android tooling is required.

```sh
npm ci
npm ci --prefix web
npm run content
npm run web
```

`npm run web:build` creates the offline production bundle. `npm run web:preview` serves it locally. Both proxy `/api` to the configured backend; set `FOUNDATIONS_API_TARGET` for an isolated local server. For local cookie-auth testing use localhost and configure the backend's `FOUNDATIONS_ORIGIN` to that exact frontend origin. Production only accepts its HTTPS origin.

## Content and checks

The [full curriculum study plan](docs/study-plan.md), preserved from the original math repository, covers discrete mathematics and proofs, linear algebra, calculus, probability and statistics, and final review. The authored curriculum now includes 15 discrete-mathematics lessons and 10 linear-algebra lessons, plus a reading-only 00 Introduction for each subject. Linear algebra adds 80 exercises, 20 quick checks, 50 reference entries, and five coordinate figures. The plan retains its original timeline and references to the earlier worksheet/PDF workflow; the current PWA uses inline and focused practice.

Follow [subject authoring guidance](docs/content-authoring.md), including the required reading-only introduction for every future subject. Author lessons and references under `content/`. `scripts/build-content.ts` generates shared assets under `output/content` and the server catalog at `output/grading-catalog.json`. Exercise identities and catalog hashes remain compatible with existing notebook data. Formula inventory: `npx tsx scripts/build-content.ts --inventory-only`.

```sh
npm test
npm run typecheck
npm run web:build
npm run web:test
cd server
go test ./...
```

See [deployment and authentication](docs/pwa-deployment.md) and [web-client behavior](docs/web-client.md).
