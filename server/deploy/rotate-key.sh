#!/bin/sh
# Run as root. The new key is delivered in a root-only file, never a log.
set -eu
umask 077
test "$(id -u)" = 0
temporary=$(mktemp /etc/math-foundations/key.XXXXXX)
trap 'rm -f "$temporary"' EXIT
/opt/math-foundations/current/foundations-server keygen > "$temporary"
head -n 1 "$temporary" > /etc/math-foundations/new-api-key.txt
printf 'FOUNDATIONS_KEY_HASH=%s\n' "$(tail -n 1 "$temporary")" > /etc/math-foundations/server.env
chmod 600 /etc/math-foundations/server.env /etc/math-foundations/new-api-key.txt
systemctl restart foundations
printf 'New key saved to /etc/math-foundations/new-api-key.txt. Transfer privately, enter on each device, then remove that file.\n'
