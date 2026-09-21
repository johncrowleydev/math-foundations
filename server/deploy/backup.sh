#!/bin/sh
set -eu
umask 077
root=${FOUNDATIONS_DATA:-/var/lib/math-foundations}
binary=${FOUNDATIONS_SERVER:-"$(dirname "$0")/foundations-server"}
export FOUNDATIONS_DATA="$root"
mkdir -p "$root/backups"
"$binary" backup "$root/backups/notebook-$(date -u +%Y%m%d-%H%M%S)"
# Only prune after a complete, hash-verified DB + media recovery point exists.
# The 36-day cutoff preserves the previous find -mtime +35 retention policy.
"$binary" prune-backups "$root/backups"
find "$root/media" -maxdepth 1 -type f -name '.upload-*' -mtime +7 -delete
