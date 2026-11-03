#!/usr/bin/env bash
# Pull-based deploy for the brx-web stack. Run from /opt/brxsolutions/infra (systemd timer).
#
#   deploy.sh [--dry-run]
#
# Target image tag = PIN_TAG from .env if set, else the head sha of the newest successful
# CI run on main. The stack is only touched when the target differs from IMAGE_TAG (or a
# container is down) and both images exist in GHCR. Every exit is 0 except real failures of
# docker itself; "nothing to do" is logged, not an error, so the timer stays quiet.
set -euo pipefail

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE=(docker compose -f docker-compose.yml -f compose.prod.yml)

log() { # log <event> [key=value ...]
  local ev=$1; shift
  local json="{\"ts\": \"$(date -u +%FT%TZ)\", \"event\": \"$ev\""
  for kv in "$@"; do json+=", \"${kv%%=*}\": \"${kv#*=}\""; done
  echo "$json}"
}

[ -f "$ENV_FILE" ] || { log error reason="missing $ENV_FILE"; exit 1; }
# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a
: "${GITHUB_REPO:?GITHUB_REPO must be set in $ENV_FILE}"
IMAGE_TAG="${IMAGE_TAG:-}"
PIN_TAG="${PIN_TAG:-}"

if [ -n "$PIN_TAG" ]; then
  target="$PIN_TAG"; source="pin"
else
  api="https://api.github.com/repos/$GITHUB_REPO/actions/workflows/ci.yml/runs?branch=main&status=success&per_page=1"
  body=$(curl -fsS --max-time 20 -H 'Accept: application/vnd.github+json' "$api" 2>/dev/null) || body=""
  target=$(printf '%s' "$body" | python3 -c '
import json, sys
try:
    runs = json.load(sys.stdin).get("workflow_runs", [])
except Exception:
    runs = []
print(runs[0]["head_sha"] if runs else "")' 2>/dev/null || true)
  source="api"
fi

if [ -z "$target" ]; then
  log skipped reason="no target" source="$source"
  exit 0
fi
log resolved target="$target" source="$source" current="$IMAGE_TAG"

if [ "$target" = "$IMAGE_TAG" ]; then
  down=$("${COMPOSE[@]}" ps --format '{{.Service}} {{.State}}' 2>/dev/null | grep -vc ' running' || true)
  if [ "$down" = 0 ]; then
    log skipped reason="up to date" tag="$target"
    exit 0
  fi
  log info reason="tag current but $down container(s) not running; re-applying"
fi

for image in web contact-api; do
  if ! docker manifest inspect "ghcr.io/${GITHUB_REPO%%/*}/$image:$target" >/dev/null 2>&1; then
    log skipped reason="images not published yet" image="$image" tag="$target"
    exit 0
  fi
done

if [ "$DRY_RUN" = 1 ]; then
  log dry-run reason="would run" target="$target"
  echo "sed s/^IMAGE_TAG=.*/IMAGE_TAG=$target/ $ENV_FILE (in place)"
  echo "IMAGE_TAG=$target ${COMPOSE[*]} pull --quiet"
  echo "IMAGE_TAG=$target ${COMPOSE[*]} up -d --remove-orphans"
  exit 0
fi

previous="$IMAGE_TAG"
# Portable in-place edit (GNU and BSD sed differ on -i); also atomic.
sed "s/^IMAGE_TAG=.*/IMAGE_TAG=$target/" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
export IMAGE_TAG="$target"
"${COMPOSE[@]}" pull --quiet
"${COMPOSE[@]}" up -d --remove-orphans
docker image prune -f --filter until=168h >/dev/null 2>&1 || true
log deployed tag="$target" previous="$previous"
