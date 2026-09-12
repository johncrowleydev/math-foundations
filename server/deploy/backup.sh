#!/bin/sh
set -eu
umask 077
root=/var/lib/math-foundations
mkdir -p "$root/backups"
/opt/math-foundations/current/foundations-server backup "$root/backups/notebook-$(date -u +%Y%m%d-%H%M%S).db"
# Keep at least four weekly recovery points. Media is immutable and is never
# garbage-collected while a live version or retained backup may reference it.
find "$root/backups" -maxdepth 1 -type f -name 'notebook-*.db' -mtime +35 -delete
find "$root/media" -maxdepth 1 -type f -name '.upload-*' -mtime +7 -delete
