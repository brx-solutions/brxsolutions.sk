#!/usr/bin/env bash
# Renders the compose files with the example env and checks the production shape.
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

local_cfg=$(docker compose --env-file .env.example -f docker-compose.yml -f compose.local.yml config 2>/dev/null)
prod_cfg=$(docker compose --env-file .env.example -f docker-compose.yml -f compose.prod.yml config 2>/dev/null)

check "local config renders" "[ -n \"\$local_cfg\" ]"
check "prod config renders" "[ -n \"\$prod_cfg\" ]"
check "local publishes 8080" "grep -qE 'published: \"?8080\"?' <<<\"\$local_cfg\""
check "prod publishes no ports" "! grep -q 'published:' <<<\"\$prod_cfg\""
for svc in web contact-api cloudflared umami umami-db; do
  check "prod has service $svc" "grep -qE '^  $svc:' <<<\"\$prod_cfg\""
done
check "cloudflared pinned" "grep -q 'cloudflare/cloudflared:2026.10.7' <<<\"\$prod_cfg\""
check "umami pinned" "grep -q 'ghcr.io/umami-software/umami:3.4.1' <<<\"\$prod_cfg\""
check "postgres pinned" "grep -q 'postgres:18-alpine' <<<\"\$prod_cfg\""
check "images use brx-solutions org" "grep -q 'ghcr.io/brx-solutions/web:' <<<\"\$prod_cfg\""
check "umami telemetry off" "grep -q 'DISABLE_TELEMETRY: \"1\"' <<<\"\$prod_cfg\""
check "umami reads CF-Connecting-IP" "grep -q 'CLIENT_IP_HEADER: CF-Connecting-IP' <<<\"\$prod_cfg\""
check "every prod service has a memory limit" "docker compose --env-file .env.example -f docker-compose.yml -f compose.prod.yml config --format json 2>/dev/null | python3 -c 'import json,sys;s=json.load(sys.stdin)[\"services\"];missing=[k for k,v in s.items() if not v.get(\"mem_limit\")];print(\"missing:\",missing) if missing else None;sys.exit(1 if missing else 0)'"
check "db volume is named" "grep -qE '^  umami-db-data:' <<<\"\$prod_cfg\""
exit $fail
