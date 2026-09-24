#!/usr/bin/env bash
# Runs as root inside the uploaded bundle on the existing production host.
set -euo pipefail
release=${1:?Release name required}
[[ "$release" =~ ^release-[a-f0-9]{40}-[0-9]+-[0-9]+$ ]]
cd "$(dirname "$0")"
exec 9>/opt/math-foundations/.deploy.lock
flock -n 9
previous=$(readlink -f /opt/math-foundations/current)
test -x "$previous/foundations-server"
test -f /etc/math-foundations/server.env
test ! -e "/opt/math-foundations/releases/$release"
recovery_point="/var/lib/math-foundations/backups/predeploy-$release"
# Keep a durable rollback record even if installation fails midway.
install -d -m 700 /var/lib/math-foundations/deployments
record="/var/lib/math-foundations/deployments/$release"
(umask 077; printf 'previous=%s\nbackup=%s\n' "$previous" "$recovery_point" > "$record")
sudo -u foundations env FOUNDATIONS_DATA=/var/lib/math-foundations \
  "$previous/foundations-server" backup "$recovery_point"
sudo -u foundations "$previous/foundations-server" verify-backup "$recovery_point"
bash install.sh "$release"
test "$(readlink -f /opt/math-foundations/current)" = "/opt/math-foundations/releases/$release"
nginx -t
systemctl is-active --quiet foundations
systemctl is-active --quiet foundations-backup.timer
systemctl is-enabled --quiet foundations-backup.timer
for attempt in {1..15}; do
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:18084/api/v1/status) || status=000
  if [[ "$status" == 401 ]]; then
    printf 'Activated %s; rollback record: %s\n' "$release" "$record"
    exit 0
  fi
  sleep 2
done
echo 'API did not become ready; inspect the rollback record before recovery.' >&2
exit 1
