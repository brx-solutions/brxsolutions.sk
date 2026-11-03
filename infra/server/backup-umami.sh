#!/usr/bin/env bash
# Dumps the Umami Postgres database to BACKUP_DIR (default /var/backups/umami) and keeps
# RETENTION_DAYS (default 14) of daily dumps. Run from /opt/brxsolutions/infra.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/umami}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
ENV_FILE="${ENV_FILE:-.env}"
# shellcheck disable=SC2206
COMPOSE=(docker compose --env-file "$ENV_FILE" ${COMPOSE_FILE_ARGS:--f docker-compose.yml -f compose.prod.yml})

log() {
  local ev=$1; shift
  local json="{\"ts\": \"$(date -u +%FT%TZ)\", \"event\": \"$ev\""
  for kv in "$@"; do json+=", \"${kv%%=*}\": \"${kv#*=}\""; done
  echo "$json}"
}

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/umami-$(date -u +%F).sql.gz"
tmp="$file.part"
if ! "${COMPOSE[@]}" exec -T umami-db pg_dump -U umami --no-owner umami | gzip > "$tmp"; then
  rm -f "$tmp"
  log error reason="pg_dump failed"
  exit 1
fi
mv "$tmp" "$file"
bytes=$(wc -c < "$file" | tr -d ' ')
find "$BACKUP_DIR" -name 'umami-*.sql.gz' -type f -mtime "+$RETENTION_DAYS" -delete
log backup file="$file" bytes="$bytes" retention_days="$RETENTION_DAYS"
