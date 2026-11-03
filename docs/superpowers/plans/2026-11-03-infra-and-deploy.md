# brxsolutions.sk — Infrastructure and Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the site, contact API and Umami on the owner's Proxmox LXC behind a Cloudflare Tunnel, with images published by CI and a pull-based deploy that pins git shas.

**Architecture:** CI publishes `ghcr.io/brx-solutions/{web,contact-api}:<sha>` after tests pass. On the LXC `brx-web` (192.168.100.34, Debian 13, Docker 29.9, Compose 5.7) a systemd timer runs `deploy.sh` every 5 minutes: it asks the GitHub API for the newest successful CI run on `main`, pulls that sha and restarts the compose stack. The stack is Caddy (static + `/api` proxy), contact-api, Umami + Postgres, and `cloudflared` with a tunnel token. No inbound ports. Nightly `pg_dump` to local disk.

**Tech Stack:** GitHub Actions + GHCR, Docker Compose (base + `compose.local.yml` + `compose.prod.yml`), Caddy 2, `cloudflare/cloudflared:2026.10.7`, `ghcr.io/umami-software/umami:3.4.1`, `postgres:18-alpine`, systemd timers, bash.

**Spec:** `docs/superpowers/specs/2026-11-03-brxsolutions-web-design.md` §10, §11, §15.

## Global Constraints

- Production images are `ghcr.io/brx-solutions/web:<git-sha>` and `ghcr.io/brx-solutions/contact-api:<git-sha>` (org is `brx-solutions`, fix the `brxsolutions` spelling left from plan 1). Never `latest`.
- Every third-party image pinned to an exact tag: `cloudflare/cloudflared:2026.10.7`, `ghcr.io/umami-software/umami:3.4.1`, `postgres:18-alpine`, `caddy:2-alpine` (web image base, unchanged).
- Secrets only in `/opt/brxsolutions/infra/.env` on the server, never in the repo or chat. The repo keeps `.env.example`.
- Separate tunnel `brx-web` from the owner's existing agents tunnel. Tunnel token is `TUNNEL_TOKEN` in `.env`.
- Public hostnames: `brxsolutions.sk` and `www.brxsolutions.sk` → `http://web:80`; `stats.brxsolutions.sk` → `http://umami:3000`. `www` redirects to the apex in Caddy.
- Umami: `DISABLE_TELEMETRY=1`, no cookies (default), dashboard behind Cloudflare Access, `/script.js` and `/api/send` bypassed.
- The LXC has 1.5 GB RAM: Postgres `shared_buffers` default is fine; set container `mem_limit`s so one runaway cannot take the box (umami 512m, umami-db 384m, web 128m, contact-api 192m, cloudflared 64m).
- Remote writes to the server are done by the owner or by the agent only after the owner allows them; every server command in this plan is written as a script in the repo so it is reproducible.

## Review Focus

1. `deploy.sh` must never downgrade silently: if the GitHub API is unreachable or returns no successful run, it exits 0 without touching the stack and logs why (Task 4).
2. A sha whose images are not yet in GHCR (CI publish still running) must not be pulled; `docker manifest inspect` gates the switch (Task 4).
3. `PIN_TAG` in `.env` wins over the API answer, so rollback is one line and survives the next timer tick (Task 4).
4. `www.brxsolutions.sk/en/?x=1` must redirect to `https://brxsolutions.sk/en/?x=1` with 308 and keep the path and query (Task 3).
5. Backups must be restorable: the backup test restores the dump into a scratch database and counts tables (Task 5).

---

### Task 1: Publish images from CI

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `infra/docker-compose.yml` (image names → `brx-solutions`), `README.md`

**Interfaces:**
- Produces: job `publish` (needs `test` and `docker`, only on `push` to `main`), `permissions: packages: write, contents: read`, logs in to GHCR with `GITHUB_TOKEN`, builds both images with `docker/build-push-action@v7`, tags `ghcr.io/brx-solutions/web:${{ github.sha }}` and `…/contact-api:${{ github.sha }}`, `push: true`, build-arg `PUBLIC_TURNSTILE_SITE_KEY=${{ vars.PUBLIC_TURNSTILE_SITE_KEY }}`, `PUBLIC_UMAMI_SRC=https://stats.brxsolutions.sk/script.js`, `PUBLIC_UMAMI_WEBSITE_ID=${{ vars.PUBLIC_UMAMI_WEBSITE_ID }}`. GHA cache `type=gha`.
- Owner one-time: repository variables `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_UMAMI_WEBSITE_ID`; after the first publish set both packages to **public** (org → Packages → package → Settings → Change visibility) so the server pulls without credentials.

- [ ] **Step 1: Write the failing check** — `infra/tests/workflow.test.sh`: asserts with `grep` that `ci.yml` has a `publish:` job, `packages: write`, both image names with `brx-solutions`, and that no file under `infra/` or `.github/` mentions `ghcr.io/brxsolutions/`.
- [ ] **Step 2: Run it** — `bash infra/tests/workflow.test.sh` → FAIL on `publish:`.
- [ ] **Step 3: Implement** the job and rename the images.
- [ ] **Step 4: Run** the check and `npx @action-validator/cli .github/workflows/ci.yml` → PASS.
- [ ] **Step 5: Commit** `ci: publish web and contact-api images to GHCR on main`.

---

### Task 2: Production compose split

**Files:**
- Modify: `infra/docker-compose.yml` (base: `web`, `contact-api`; no published ports)
- Create: `infra/compose.local.yml` (`web` ports `8080:80`), `infra/compose.prod.yml` (`cloudflared`, `umami`, `umami-db`, mem limits, `restart: unless-stopped`, named volume `umami-db-data`, healthchecks)
- Modify: `infra/smoke.sh` (`-f docker-compose.yml -f compose.local.yml`), `infra/.env.example` (add `TUNNEL_TOKEN=`, `UMAMI_APP_SECRET=`, `UMAMI_DB_PASSWORD=`, `PIN_TAG=`, `GITHUB_REPO=brx-solutions/brxsolutions.sk`)

**Interfaces:**
- `umami` env: `DATABASE_URL=postgresql://umami:${UMAMI_DB_PASSWORD}@umami-db:5432/umami`, `APP_SECRET=${UMAMI_APP_SECRET}`, `DISABLE_TELEMETRY=1`, `CLIENT_IP_HEADER=CF-Connecting-IP`; `depends_on: umami-db: condition: service_healthy`.
- `umami-db`: `POSTGRES_USER=umami`, `POSTGRES_PASSWORD`, `POSTGRES_DB=umami`, `TZ=UTC`, healthcheck `pg_isready -U umami`.
- `cloudflared`: `command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}`, `depends_on: web`.
- Validation: `docker compose -f docker-compose.yml -f compose.prod.yml config` renders without error with the example env.

- [ ] **Step 1: Failing check** — extend `infra/tests/compose.test.sh`: `config` of base+local exposes `8080:80`; `config` of base+prod has services `cloudflared`, `umami`, `umami-db`, no `ports:` on `web`, pinned tags above, and every service has `mem_limit`.
- [ ] **Step 2: Run** → FAIL (files missing).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the check and `infra/smoke.sh` → `smoke: OK`.
- [ ] **Step 5: Commit** `build: split compose into base, local and prod; add cloudflared, umami, postgres`.

---

### Task 3: `www` redirect and stats-origin CSP in Caddy

**Files:** Modify `infra/Caddyfile`, `infra/smoke.sh`

- [ ] **Step 1: Failing check** — smoke adds: `curl -sI -H 'Host: www.brxsolutions.sk' localhost:8080/en/?x=1` → status `308`, `Location: https://brxsolutions.sk/en/?x=1`.
- [ ] **Step 2: Run** smoke → FAIL.
- [ ] **Step 3: Implement** a `http://www.brxsolutions.sk` site block with `redir https://brxsolutions.sk{uri} permanent` above the `:80` block.
- [ ] **Step 4: Run** smoke → `smoke: OK`.
- [ ] **Step 5: Commit** `build(caddy): redirect www to apex`.

---

### Task 4: Pull-based deploy script and timer

**Files:**
- Create: `infra/server/deploy.sh`, `infra/server/brx-deploy.service`, `infra/server/brx-deploy.timer`, `infra/tests/deploy.test.sh`

**Interfaces:**
```
deploy.sh [--dry-run]
  env (from infra/.env): GITHUB_REPO, PIN_TAG (optional), IMAGE_TAG (current)
  1. target = PIN_TAG if set, else head_sha of newest run of ci.yml on main with conclusion=success
     (GET https://api.github.com/repos/$GITHUB_REPO/actions/workflows/ci.yml/runs?branch=main&status=success&per_page=1)
  2. exit 0 "no target" if the API fails or returns nothing
  3. exit 0 "up to date" if target == IMAGE_TAG and all containers are running
  4. exit 0 "images not published yet" unless `docker manifest inspect` succeeds for both images
  5. write IMAGE_TAG=target into .env (sed, keep other lines), `docker compose -f docker-compose.yml -f compose.prod.yml pull` and `up -d --remove-orphans`
  6. `docker image prune -f --filter until=168h`; log one JSON line to stdout (journald)
```
- Timer: every 5 minutes, `RandomizedDelaySec=30`, service `Type=oneshot`, `WorkingDirectory=/opt/brxsolutions/infra`.

- [ ] **Step 1: Failing test** — `deploy.test.sh` runs `deploy.sh --dry-run` with a fake `curl` and fake `docker` on `PATH` (shell functions in a temp bin dir) covering: API down → "no target"; same sha → "up to date"; manifest missing → "images not published yet"; new sha → prints the compose commands it would run and the new `IMAGE_TAG`; `PIN_TAG=abc` → target `abc` regardless of API.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `deploy.sh` (bash, `set -euo pipefail`, no `jq` dependency: parse with `python3 -c` which Debian 13 has).
- [ ] **Step 4: Run** the test → PASS.
- [ ] **Step 5: Commit** `ops: pull-based deploy script with systemd timer`.

---

### Task 5: Umami backup script and timer

**Files:** Create `infra/server/backup-umami.sh`, `infra/server/brx-backup.service`, `infra/server/brx-backup.timer`, `infra/tests/backup.test.sh`

- Script: `docker compose … exec -T umami-db pg_dump -U umami umami | gzip > /var/backups/umami/umami-$(date -u +%F).sql.gz`, delete files older than 14 days, print size. Timer daily 03:15 UTC.
- [ ] **Step 1: Failing test** — `backup.test.sh` (needs Docker, runs locally): starts base+prod with the example env but without cloudflared (`--scale cloudflared=0`), runs the backup script with `BACKUP_DIR` pointed at a temp dir, then restores the dump into a scratch database `umami_restore` and asserts `\dt` lists ≥ 10 tables.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; tear the stack down.
- [ ] **Step 5: Commit** `ops: nightly umami backup with restore test`.

---

### Task 6: Server bootstrap script and runbook

**Files:** Create `infra/server/install.sh`, `infra/server/README.md`; modify root `README.md`.

- `install.sh` (run as root on `brx-web`): `git clone https://github.com/brx-solutions/brxsolutions.sk /opt/brxsolutions` (or `git pull`), `cp -n infra/.env.example infra/.env`, `mkdir -p /var/backups/umami`, install the two services and timers into `/etc/systemd/system`, `systemctl enable --now brx-deploy.timer brx-backup.timer`, print the `.env` keys still empty.
- Runbook: first deploy, rollback (`PIN_TAG=<sha>` then `systemctl start brx-deploy`), logs (`journalctl -u brx-deploy`), restore from backup, rotating the tunnel token.
- [ ] **Step 1:** `shellcheck`-style check is not available; test is `bash -n` on every script plus `infra/tests/*.sh` green.
- [ ] **Step 2–4:** write, run `bash -n infra/server/*.sh && bash infra/tests/deploy.test.sh`, commit `ops: server bootstrap and runbook`.

---

### Task 7: First production deploy (owner + agent)

Owner, once: fill `/opt/brxsolutions/infra/.env` on the server (`TUNNEL_TOKEN`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `MAIL_TRANSPORT=resend`, `UMAMI_APP_SECRET` via `openssl rand -hex 32`, `UMAMI_DB_PASSWORD`), set repo variables (Task 1), make packages public, add the three public hostnames in the tunnel, Access application for `stats.brxsolutions.sk` (allow owner email) and a bypass application for `stats.brxsolutions.sk/script.js` and `/api/send`.

- [ ] **Step 1:** `install.sh` on the server, `systemctl start brx-deploy`, `journalctl -u brx-deploy -n 20`.
- [ ] **Step 2: Verify** from the Mac: `curl -sI https://brxsolutions.sk/` → 200 with CSP; `https://www.brxsolutions.sk/en/` → 308 → apex; `https://stats.brxsolutions.sk/script.js` → 200 without login; `https://stats.brxsolutions.sk/` → Cloudflare Access login; tunnel status Healthy in the dashboard.
- [ ] **Step 3:** Umami: log in (admin/umami), change the password, add website `brxsolutions.sk`, put its id into the repo variable `PUBLIC_UMAMI_WEBSITE_ID`, push an empty commit, watch the timer roll the new image.
- [ ] **Step 4:** Send one real message through the form; owner confirms the e-mail arrived with `Reply-To` set.
- [ ] **Step 5:** Lighthouse against `https://brxsolutions.sk/` ≥ 95 in all four; record in the ledger. Commit any fixes.
