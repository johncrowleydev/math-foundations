# Backups and recovery

Each recovery point contains a consistent SQLite snapshot and independent copies
of every media object referenced by its attempts and retained record versions.
A later live-media retirement cannot invalidate it. The implementation lives in
[server/backup.go](../server/backup.go) and
[server/backup_media.go](../server/backup_media.go).

## Schedule and retention

`foundations-backup.timer` runs each Sunday at 04:00 UTC with up to 15 minutes of
random delay and catches up after downtime. The service runs as `foundations`
with `UMask=0077`. [backup.sh](../server/deploy/backup.sh) uses
`FOUNDATIONS_DATA`, defaulting to `/var/lib/math-foundations`, and creates:

```text
/var/lib/math-foundations/backups/notebook-YYYYMMDD-HHMMSS/
  notebook.db
  media/
    <sha256>
  manifest.json
```

The manifest records the database hash, creation time and sorted media inventory.
Verification checks SQLite integrity, the database hash, agreement between its
media references and the inventory, and every media object's hash. Missing or
corrupt media, malformed references and unsupported database shapes fail
creation. A completed directory is published only after verification.

The weekly script prunes only after a successful backup. Standard
`notebook-YYYYMMDD-HHMMSS` directories expire 36 days after manifest creation;
legacy `notebook-*.db` files expire 36 days after modification. Actual removal
waits for the next pruning run. Manually named recovery points, restore
directories and rollback directories remain operator-managed. Monitor capacity:
each recovery point owns separate media copies.

Creation and pruning share `backups/.backup.lock`; creation also holds
`media/.retirement.lock` to prevent live media from disappearing during the
snapshot. Keep those lock files in place. Hidden `.backup-*` or `.pruning-*`
directories are incomplete stages, cleaned by pruning under the lock; never
rename them into completed recovery points. An abandoned `.restore-*` directory
must be removed manually only after confirming no restore is active.

Same-volume backups do not survive loss of that volume. Copy whole completed
recovery directories to separate storage and verify the copies. Back up account
configuration and application artifacts separately, including the catalog
archive described in [PWA deployment](pwa-deployment.md). Server snapshots do not
contain browser-only drafts or queued submissions; preserve those with
**Settings → Export local work** on each device.

## Create and verify

Administrative backup commands do not require API credentials or a model
provider. Use absolute paths and run as `foundations`, which owns the private
data root. A manual backup can run while the API serves requests:

```bash
set -euo pipefail
recovery_point="/var/lib/math-foundations/backups/notebook-$(date -u +%Y%m%d-%H%M%S)"
sudo -u foundations env FOUNDATIONS_DATA=/var/lib/math-foundations \
  /opt/math-foundations/current/foundations-server backup "$recovery_point"
sudo -u foundations /opt/math-foundations/current/foundations-server \
  verify-backup "$recovery_point"
```

The destination must not exist. A failed backup does not replace earlier points
or trigger weekly pruning. Investigate its reported error and repeat with a
new destination. To run creation and retention through the scheduled service,
use `sudo systemctl start foundations-backup.service`; inspect its result with
`systemctl status foundations-backup.service`. Manual pruning is available as
`foundations-server prune-backups /var/lib/math-foundations/backups`.

## Restore

Preserve local-work exports and close connected clients before recovery. Select
a completed point and stop scheduled backups so pruning cannot race the copy.
Substitute its timestamp below; use the same Bash shell for both sequences.

```bash
set -euo pipefail
recovery_point=/var/lib/math-foundations/backups/notebook-YYYYMMDD-HHMMSS
restored_dir=/var/lib/math-foundations/restored-YYYYMMDD-HHMMSS
sudo systemctl stop foundations-backup.timer foundations-backup.service
sudo -u foundations /opt/math-foundations/current/foundations-server \
  verify-backup "$recovery_point"
sudo -u foundations /opt/math-foundations/current/foundations-server \
  restore-backup "$recovery_point" "$restored_dir"
```

The destination must not exist. Restore verifies the source and copied files
before publishing a new directory containing only `notebook.db` and `media/`.
It does not consult live media. If verification fails, keep the recovery point
intact and investigate; do not substitute an empty media directory. Restart
`foundations-backup.timer` if abandoning the restore.

Stop the API for the final switch. Preserve the current database, WAL/SHM and
media together, then install the staged database and media. Retained `backups/`
remain in place:

```bash
set -euo pipefail
data_root=/var/lib/math-foundations
rollback_dir="$data_root/before-restore-$(date -u +%Y%m%d-%H%M%S)"
sudo systemctl stop foundations
sudo -u foundations mkdir -m 700 -- "$rollback_dir"
for name in notebook.db notebook.db-wal notebook.db-shm media; do
  if sudo -u foundations test -e "$data_root/$name"; then
    sudo -u foundations mv -- "$data_root/$name" "$rollback_dir/"
  fi
done
sudo -u foundations mv -- "$restored_dir/notebook.db" "$data_root/notebook.db"
sudo -u foundations mv -- "$restored_dir/media" "$data_root/media"
sudo -u foundations rmdir -- "$restored_dir"
sudo systemctl start foundations
sudo systemctl start foundations-backup.timer
```

The service stays stopped if the switch fails. Preserve the rollback directory
and matching application release until authenticated status, learner history,
response media and Review have been verified. The restore also brings back the
snapshot's session table; revoke sessions if they should no longer be accepted.
Use the [deployment procedure](pwa-deployment.md#catalog-retention-and-rollback)
when changing the application release as part of recovery.

An older database has older sync revisions. Existing clients do not
automatically reset their cursors after a server restore. Verify the restored
server from a fresh browser profile first and retain each device's export before
resetting local work. Import preserves drafts and pending operations but does
not guarantee replay of all previously acknowledged server data. Reconcile
newer client work before discarding the original browser state or exports.

## Legacy database-only files

A retained `notebook-*.db` file has no independent media snapshot. Its references
may point to images already retired from the live server; today's transcription
cannot reconstruct those original bytes. Audit it against the media actually
available:

```sh
sudo -u foundations /opt/math-foundations/current/foundations-server \
  audit-backup /var/lib/math-foundations/backups/notebook-YYYYMMDD-HHMMSS.db \
  /var/lib/math-foundations/media
```

The audit is read-only and reports unavailable hashes; it does not repair the
file. Do not treat a database-only file as a verified complete recovery point or
pass it to `restore-backup`, which requires a directory with a manifest.
