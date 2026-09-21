# Recovering saved answers across catalog updates

PR #16 fixed a rejected upload being sent to the recheck endpoint even though no
server attempt existed. A subsequent retry exposed a second failure: regular
submissions were accepted only when their original catalog version equaled the
currently deployed version. Refreshing the app cannot change an already saved
submission, and changing its version would lose the original grading context.

The server now resolves an older regular submission from a trusted archived
catalog using its original content version and exercise identity. It passes that
exact exercise definition through the existing validation, deterministic or model
grading, and persistence path. The submission's answer, timestamp, effort,
assistance, version, and ID remain unchanged. Once accepted, its full context is
frozen in the database for future rechecks. An exercise changed or removed from
today's curriculum can still be graded against its actual original definition.

Unknown versions or absent original exercises are still rejected. A corrupt or
unreadable archive produces a retryable server failure. The server does not trust
client-provided grading definitions or silently use today's context. Existing
frozen Review instances and current-version submissions retain their existing
paths.

The archive contains immutable JSON deployment artifacts, copied from retained
releases and future matched deployment bundles. It is separate from canonical
MDX/YAML/JSON authoring; no executable curriculum or source-generation workflow
is introduced. See [deployment and retention](pwa-deployment.md).

## Regression coverage

Go tests exercise the real submission handler, historical deterministic
contracts, exact frozen context, idempotent retries, restart behavior, archive
validation and retention, and continued rejection of unknown versions. These run
in the ordinary Go CI suite.

The earlier browser test used the current catalog and mocked a successful upload.
`scripts/check-stale-submission-ui.mjs` closes that gap with the real Go server,
real authentication, real submission and grading-job routes, an isolated temporary
database, and a loopback-only synthetic provider. It first reproduces a rejected
older version, then retains the original catalog and clicks **Retry grading**.
Today's question and answer are deliberately different in the temporary server
fixture. The test asserts the provider receives the complete original context,
the browser sends the original submission unchanged, and duplicate retries do not
add a second grade. No production account, learner response, or external grading
provider is used.

After building the web client, run:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/check-stale-submission-ui.mjs
```

Desktop and phone captures are saved under
`docs/screenshots/stale-catalog-retry/`.
