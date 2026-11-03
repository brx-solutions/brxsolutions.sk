#!/usr/bin/env bash
# Builds the local stack and checks the served site and API through Caddy.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${SMOKE_PORT:-8080}"
docker compose -f docker-compose.yml -f compose.local.yml up -d --build --wait
fail() { echo "smoke: $1" >&2; docker compose -f docker-compose.yml -f compose.local.yml logs --tail=40; exit 1; }
# Bodies go through variables: `curl | grep -q` trips pipefail when grep exits early.
grep -q 'lang="sk"' <<<"$(curl -fsS "localhost:$PORT/")" || fail "sk home not served"
grep -q 'lang="en"' <<<"$(curl -fsS "localhost:$PORT/en/")" || fail "en home not served"
grep -qi 'content-security-policy' <<<"$(curl -fsSI "localhost:$PORT/")" || fail "CSP header missing"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "localhost:$PORT/api/contact" -H 'Content-Type: text/plain' -d x)
[ "$code" = "415" ] || fail "expected 415 from API via proxy, got $code"
curl -fsS "localhost:$PORT/sitemap-index.xml" >/dev/null || fail "sitemap missing"
# The CSP has no 'unsafe-inline' for styles, so inline style attributes would be silently dropped.
grep -q 'style="' <<<"$(curl -fsS "localhost:$PORT/")$(curl -fsS "localhost:$PORT/en/")" && fail "inline style attribute found in HTML"
echo "smoke: OK"
