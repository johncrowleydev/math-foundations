#!/bin/bash
# Uploaded deployment bundle: binary + deploy files. Run sudo bash install.sh <release>.
set -euo pipefail
release=${1:?Release name required}
[[ "$release" =~ ^[a-zA-Z0-9.-]+$ ]]
cd "$(dirname "$0")"
id foundations >/dev/null 2>&1 || useradd --system --home /var/lib/math-foundations --shell /usr/sbin/nologin foundations
install -d -o foundations -g foundations -m 700 /var/lib/math-foundations
install -d -m 700 /etc/math-foundations
install -d -m 755 "/opt/math-foundations/releases/$release" /var/www/foundations
install -m 755 foundations-server backup.sh "/opt/math-foundations/releases/$release/"
install -m 644 grading-catalog.json "/opt/math-foundations/releases/$release/"
cp -a web "/opt/math-foundations/releases/$release/"
ln -sfn "/opt/math-foundations/releases/$release" /opt/math-foundations/current.next
mv -Tf /opt/math-foundations/current.next /opt/math-foundations/current
if [[ ! -f /etc/math-foundations/server.env ]]; then install -m 600 server.env /etc/math-foundations/server.env; fi
install -m 644 foundations.service foundations-backup.service foundations-backup.timer /etc/systemd/system/
install -m 755 renew-certificate.sh /etc/letsencrypt/renewal-hooks/deploy/foundations
if [[ ! -f /etc/letsencrypt/live/foundations.johncrowley.dev/fullchain.pem ]]; then
    # Bootstrap only this hostname for the ACME challenge, leaving existing routes intact.
    sed '/^server {$/,$!d' nginx.conf | sed '/^}$/q' > /etc/nginx/sites-available/foundations
    ln -sfn /etc/nginx/sites-available/foundations /etc/nginx/sites-enabled/foundations
    nginx -t
    systemctl reload nginx
    account=$(sed -n 's/^account = //p' /etc/letsencrypt/renewal/johncrowley.dev.conf)
    certbot certonly --account "$account" --webroot -w /var/www/foundations -d foundations.johncrowley.dev --non-interactive --agree-tos
fi
install -m 644 nginx.conf /etc/nginx/sites-available/foundations
ln -sfn /etc/nginx/sites-available/foundations /etc/nginx/sites-enabled/foundations
nginx -t
systemctl daemon-reload
systemctl enable --now foundations foundations-backup.timer
systemctl restart foundations
systemctl reload nginx
