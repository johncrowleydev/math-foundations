# PWA deployment and authentication

Foundations runs at https://foundations.johncrowley.dev on `jc-dev`. nginx serves
`/opt/math-foundations/current/web` and proxies `/api/` to the Go service on
`127.0.0.1:18084`. The service runs as the unprivileged `foundations` user.

| Location                           | Purpose                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| `/opt/math-foundations/releases/`  | Versioned backend, web bundle and grading catalog                     |
| `/opt/math-foundations/current`    | Active release symlink                                                |
| `/opt/math-foundations/catalogs/`  | Immutable catalogs for queued submissions from older content versions |
| `/var/lib/math-foundations/`       | Private SQLite database, response media and backups                   |
| `/etc/math-foundations/server.env` | Root-only account and provider configuration                          |

Local development is covered in [the web client guide](web-client.md). Database
and media recovery is covered in [the backup runbook](backup-media-integrity.md).

## Account and sessions

Configure `FOUNDATIONS_EMAIL`, `FOUNDATIONS_PASSWORD_HASH`, and
`FOUNDATIONS_ORIGIN=https://foundations.johncrowley.dev` in
`/etc/math-foundations/server.env` with mode `600`. Generate an Argon2id hash with
`foundations-server hash-password`, supplying the exact password on stdin;
trailing newlines become part of the password. Keep passwords out of command
arguments, logs and Git. `OPENROUTER_API_KEY` stays in server configuration and
never enters the web bundle.

When changing credentials, preserve unrelated environment entries, stop
`foundations`, update the account configuration, revoke existing sessions with
`DELETE FROM sessions` in `/var/lib/math-foundations/notebook.db`, then restart
the service. Changing the password hash alone does not revoke sessions. There
is one personal account, with no public registration or email reset.

Sessions last 30 days and survive service restarts in SQLite; only token hashes
are stored. The browser cookie is Secure, HttpOnly, SameSite=Strict and host-only.
Login is throttled. State-changing API requests must carry the configured
Origin; bearer API keys are not accepted.

The first visit requires online login. Remembered sessions allow offline use
until expiry, and reconnect validates the session before syncing. Sign-out locks
all tabs while preserving local work. Offline sign-out queues server revocation
before any later login or sync. This application lock does not encrypt browser
storage; Settings has a separately confirmed **Remove local work** operation.

## Sync and local recovery

Drafts stay in the browser. Submitted attempts, their media, and learning records
sync while the app is open, on reconnect and when returning to the app. The
visible app retries every five seconds; browsers do not guarantee background
sync after it closes. Media downloads retry independently, so an unavailable
image does not prevent later grades and records from arriving.

Use **Settings → Export local work** before changing browser origins, clearing
site data or recovering a server. After signing in at the destination, use
**Import local work**. Imports validate structure and media hashes and commit
atomically. Existing conflicting entries remain active, and the original import
is retained for download. Synced server records return through normal sync;
unsynced drafts require the local export. See the backup runbook for the limits
of restoring a server to an older database.

The API's current implementation is in [server/main.go](../server/main.go) and
[server/auth.go](../server/auth.go); the browser sync implementation is in
[web/src/sync.ts](../web/src/sync.ts). All notebook and media routes require a
session. `/api/v1/status` reports API/grading availability, the active content
version and the attempt inventory. Mutations are idempotent by operation ID;
revisioned records retain conflicting versions. Media uploads are addressed and
verified by SHA-256. Grading and Review use their dedicated server routes.

## Build and deploy

The installer in [server/deploy/install.sh](../server/deploy/install.sh) targets
the existing `jc-dev` nginx/systemd/certbot setup, including its SNI route to
`127.0.0.1:17443`. Its nginx addresses and certificate bootstrap account are
host-specific; it is not a generic new-host provisioner.

Build a matching web/backend/catalog bundle from the repository root after
running the [project checks](../README.md):

```bash
set -euo pipefail
npm run web:build
mkdir -p output
bundle=$(mktemp -d "$PWD/output/deploy.XXXXXX")
(cd server && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o "$bundle/foundations-server" .)
cp server/deploy/* "$bundle/"
cp output/grading-catalog.json "$bundle/"
cp -a web/dist "$bundle/web"
```

Upload the bundle to a private staging directory on `jc-dev`. A first
installation also needs a privately provisioned `server.env`; subsequent
installations preserve `/etc/math-foundations/server.env`. Before running the
installer, record the current release target and create a verified
[database-and-media recovery point](backup-media-integrity.md). Keep both for
rollback. Installation enables the weekly timer but does not run a backup.

From the uploaded bundle, choose a new release name containing only letters,
numbers, dots and hyphens, then install it:

```bash
set -euo pipefail
release="release-$(date -u +%Y%m%d-%H%M%S)"
test ! -e "/opt/math-foundations/releases/$release"
sudo bash install.sh "$release"
```

The installer archives the active and replacement catalogs, copies the release,
sets public web directories/files to modes `755`/`644`, atomically switches
`current`, and restarts the API. It installs the service/timer and nginx
configuration and the certificate-renewal hook. Keep earlier releases; do not
reuse a release directory.

After deployment, verify:

- `foundations` is active, `nginx -t` passes, and
  `systemctl list-timers foundations-backup.timer` shows the weekly schedule.
- Sign-in works; authenticated `/api/v1/status` reports grading and the expected
  content version; unauthenticated and bearer-only requests are rejected.
- The app loads its assets and response media, shows the service-worker update,
  and reopens offline after caching.
- Existing learner history and the Review summary remain correct. For Review
  changes, compare planned counts, reserved time and availability at the saved
  time target and a second target. Do not submit synthetic production answers.

## Catalog retention and rollback

Keep `/opt/math-foundations/catalogs` when pruning releases and include it with
application artifacts during host recovery. The database/media recovery point
does not contain it. The archive retains the first validated catalog for each
content version without overwriting it:

```sh
sudo /opt/math-foundations/current/foundations-server archive-catalog \
  /opt/math-foundations/releases/RELEASE/grading-catalog.json \
  /opt/math-foundations/catalogs
```

When recovering missing archives, process retained releases from earliest to
latest. Never rewrite a saved submission's content version or substitute the
current question to bypass an unavailable version. Accepted attempts retain
their grading context in SQLite for rechecks; frozen Review submissions retain
their server-issued instances.

To roll back application files, select the recorded previous release, stop
`foundations`, create `current.next` pointing to that release, atomically rename
it over `current` with `mv -Tf`, and start the service. Deploy web and backend
together. Only reuse the live database if the previous binary supports its
schema; otherwise restore the matching pre-deployment database and media using
the backup runbook. Keep the API stopped if that compatibility is uncertain.
Choose a session-auth-compatible release so rollback does not re-enable retired
bearer authentication, then repeat the deployment checks.
