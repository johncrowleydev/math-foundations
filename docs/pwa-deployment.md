# PWA deployment and authentication

Foundations runs at https://foundations.johncrowley.dev on jc-dev. nginx serves `/opt/math-foundations/current/web` and forwards `/api/` to the loopback Go service. Releases live under `/opt/math-foundations/releases`; `current` is switched atomically. Keep previous releases and a complete pre-migration database-and-media recovery point before deploying; see [backup and media recovery integrity](backup-media-integrity.md).

The account uses `FOUNDATIONS_EMAIL`, `FOUNDATIONS_PASSWORD_HASH`, and `FOUNDATIONS_ORIGIN` in root-only `/etc/math-foundations/server.env`. Generate a password hash by passing the exact password on stdin to `foundations-server hash-password`. Preserve unrelated environment entries when changing credentials. `OPENROUTER_API_KEY` stays server-only. Legacy bearer API keys are no longer accepted. Changing a password should also revoke existing sessions (`DELETE FROM sessions`) through an administrative SQLite operation.

Sessions last 30 days and survive service restarts in SQLite, with only token hashes stored. The browser cookie is Secure, HttpOnly, SameSite=Strict, host-only. Login is throttled and state-changing endpoints require the configured Origin. There is one personal account; no public registration or email reset.

The initial visit requires online login. Remembered sessions permit offline use until expiry; reconnect validates the session before syncing. Sign-out locks all tabs and preserves work; offline sign-out is revoked at the server before future login/sync. A local application lock does not encrypt browser storage. Settings offers a separately confirmed local-data removal operation.

Moving from localhost to production changes browser storage origin. The loopback development/preview proxy translates only its own same-origin requests for production cookie authentication, so the existing local app remains usable for migration. Export local work in Settings on localhost and import it after signing in on the public site. Imports validate shape and media hashes and apply atomically. Existing conflicting entries stay active; original imports remain downloadable in Settings for recovery. Existing server records and images return through normal sync. Do not uninstall the old Android app if you still need local-only drafts from it.

Weekly backups remain scheduled by `foundations-backup.timer`. Each completed recovery point contains a consistent SQLite snapshot and its required hash-verified media copies. Live media may be retired after retained transcription without invalidating those recovery points. The [backup procedure](backup-media-integrity.md) defines retention, verification, restoration and the limitations of older database-only backups. Existing Android source and releases remain historical only; no further APK updates are published.

Deploy web and backend together, verify sign-in and authenticated status, old-key rejection, downloaded assets, service-worker update behavior, and weekly backup scheduling. A rollback must not silently re-enable the retired bearer authentication: prefer the last session-auth-compatible release, or keep the API in maintenance while repairing the first migration.

Saved offline submissions retain their original content version. The server uses
`FOUNDATIONS_CATALOG_ARCHIVE=/opt/math-foundations/catalogs` to resolve earlier
lesson versions from trusted, immutable runtime catalogs. These are deployed
artifacts, not authored curriculum or learner records. Keep this directory when
pruning application releases and copy it with the application artifacts during
host recovery; the database/media recovery point does not contain it. Accepted
attempts already retain their full grading context in the database and do not
need the catalog archive for rechecks.

Before switching releases, `server/deploy/install.sh` retains both the active
catalog and its replacement using the uploaded server binary:

```sh
foundations-server archive-catalog grading-catalog.json /opt/math-foundations/catalogs
```

The command validates the exercise definitions and retains the first catalog for
each version without overwriting it. Archive files are root-owned public
curriculum artifacts, readable by the server. The new installer also explicitly
sets public web directories/files to modes 755/644 so private upload staging
cannot make the site unreadable to nginx.

For the initial rollout, retain the distinct catalogs from existing releases
with the same command, starting with the earliest artifact for each version.
Do this before retrying historical submissions. Unknown versions remain rejected;
never change a saved submission's version or substitute the current question to
get past that rejection. Frozen Review submissions continue using their original
server-issued instances.
