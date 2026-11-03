#!/usr/bin/env bash
# One-time bootstrap of the brx-web server. Run as root on the LXC:
#   curl -fsSL https://raw.githubusercontent.com/brx-solutions/brxsolutions.sk/main/infra/server/install.sh | bash
# Safe to re-run: pulls the repo, re-installs the units, never overwrites an existing .env.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/brx-solutions/brxsolutions.sk.git}"
DEST="${DEST:-/opt/brxsolutions}"

command -v docker >/dev/null || { echo "docker is not installed; run: curl -fsSL https://get.docker.com | sh" >&2; exit 1; }
command -v git >/dev/null || apt-get install -y -qq git

if [ -d "$DEST/.git" ]; then
  git -C "$DEST" pull --ff-only
else
  git clone "$REPO_URL" "$DEST"
fi

cd "$DEST/infra"
if [ ! -f .env ]; then
  cp .env.example .env
  chmod 600 .env
  echo "created $DEST/infra/.env from the example; fill the empty keys below"
fi
mkdir -p /var/backups/umami

for unit in brx-deploy.service brx-deploy.timer brx-backup.service brx-backup.timer; do
  install -m 644 "server/$unit" "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl enable --now brx-deploy.timer brx-backup.timer

echo
echo "Timers:"
systemctl list-timers brx-deploy.timer brx-backup.timer --no-pager | sed -n '1,3p'
echo
empty=$(grep -E '^[A-Z_]+=$' .env | cut -d= -f1 | tr '\n' ' ')
if [ -n "$empty" ]; then
  echo "Still empty in $DEST/infra/.env: $empty"
  echo "Production also needs MAIL_TRANSPORT=resend and a real TURNSTILE_SECRET_KEY."
fi
echo "Then: systemctl start brx-deploy && journalctl -u brx-deploy -n 20 --no-pager"
