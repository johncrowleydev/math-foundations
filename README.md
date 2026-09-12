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

Author lessons and references under `content/`. `scripts/build-content.ts` generates shared assets under `output/content` and the server catalog at `output/grading-catalog.json`. Exercise identities and catalog hashes remain compatible with existing notebook data. Formula inventory: `npx tsx scripts/build-content.ts --inventory-only`.

```sh
npm test
npm run typecheck
npm run web:build
npm run web:test
cd server
go test ./...
```

See [deployment and authentication](docs/pwa-deployment.md) and [web-client behavior](docs/web-client.md).
