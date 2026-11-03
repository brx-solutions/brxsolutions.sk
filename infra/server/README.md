# brx-web server runbook

Host: Proxmox LXC 102 `brx-web` (Debian 13, Docker), LAN 192.168.100.34, no inbound ports.
Everything public goes through the Cloudflare Tunnel `brx-web`.

## Layout

```
/opt/brxsolutions/            git checkout of this repo (main)
/opt/brxsolutions/infra/.env  secrets and the current IMAGE_TAG (mode 600, never in git)
/var/backups/umami/           nightly pg_dump, 14 days
```

Stack: `docker compose -f docker-compose.yml -f compose.prod.yml` in `/opt/brxsolutions/infra`.
Services: `web` (Caddy + static site), `contact-api`, `umami`, `umami-db`, `cloudflared`.

## First deploy

1. Create the LXC with `infra/proxmox/create-lxc.sh` on the Proxmox host, install Docker
   (`curl -fsSL https://get.docker.com | sh`).
2. On the LXC as root: run `infra/server/install.sh` (see its header). It clones the repo,
   creates `.env`, installs and starts the two timers.
3. Fill `/opt/brxsolutions/infra/.env`: `TUNNEL_TOKEN`, `TURNSTILE_SECRET_KEY`,
   `RESEND_API_KEY`, `MAIL_TRANSPORT=resend`, `UMAMI_APP_SECRET` (`openssl rand -hex 32`),
   `UMAMI_DB_PASSWORD` (`openssl rand -hex 16`).
4. In GitHub: make the two packages public (org → Packages → … → Change visibility) and set
   repository variables `PUBLIC_TURNSTILE_SITE_KEY`, later `PUBLIC_UMAMI_WEBSITE_ID`.
5. In Cloudflare: tunnel public hostnames `brxsolutions.sk` and `www.brxsolutions.sk` →
   `http://web:80`, `stats.brxsolutions.sk` → `http://umami:3000`; Access application for
   `stats.brxsolutions.sk` (allow your e-mail) and a Bypass application for
   `stats.brxsolutions.sk/script.js` and `stats.brxsolutions.sk/api/send`.
6. `systemctl start brx-deploy && journalctl -u brx-deploy -n 20 --no-pager`.

## Day to day

| Need | Command |
| --- | --- |
| What is running | `cd /opt/brxsolutions/infra && docker compose -f docker-compose.yml -f compose.prod.yml ps` |
| Deploy log | `journalctl -u brx-deploy -n 50 --no-pager` |
| Force a deploy check now | `systemctl start brx-deploy` |
| Service logs | `docker compose -f docker-compose.yml -f compose.prod.yml logs -f contact-api` |
| Update infra files (compose, scripts) | `git -C /opt/brxsolutions pull --ff-only` (deploy.sh does not pull the repo) |

## Rollback

Pin a known-good sha in `.env` and run the deploy once:

```bash
sed -i 's/^PIN_TAG=.*/PIN_TAG=<sha>/' /opt/brxsolutions/infra/.env
systemctl start brx-deploy
```

The timer keeps the pin until you clear it (`PIN_TAG=`). Shas are the commits on `main`
with a green CI run.

## Backups

Nightly at 03:15 UTC by `brx-backup.timer` into `/var/backups/umami/umami-YYYY-MM-DD.sql.gz`.
Run by hand: `systemctl start brx-backup`. Restore:

```bash
cd /opt/brxsolutions/infra
C="docker compose -f docker-compose.yml -f compose.prod.yml"
$C stop umami
$C exec -T umami-db psql -U umami -d postgres -c 'DROP DATABASE umami' -c 'CREATE DATABASE umami'
gunzip -c /var/backups/umami/umami-YYYY-MM-DD.sql.gz | $C exec -T umami-db psql -U umami -d umami -q
$C start umami
```

Copy the backup directory off the box now and then; the LXC disk is the only copy.

## Rotating secrets

Edit `.env`, then `docker compose -f docker-compose.yml -f compose.prod.yml up -d` picks up
the new values. A new tunnel token: create the tunnel in Zero Trust, update `TUNNEL_TOKEN`,
`up -d cloudflared`, then delete the old tunnel.
