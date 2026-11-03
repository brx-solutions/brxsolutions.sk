#!/usr/bin/env bash
# Starts the prod stack locally (without cloudflared), runs the backup script and restores
# the dump into a scratch database. Needs Docker and the example env.
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }
COMPOSE=(docker compose --env-file .env.example -f docker-compose.yml -f compose.prod.yml)
export UMAMI_DB_PASSWORD=test-password UMAMI_APP_SECRET=test-secret TUNNEL_TOKEN=unused IMAGE_TAG=dev
export COMPOSE_FILE_ARGS="-f docker-compose.yml -f compose.prod.yml" ENV_FILE=.env.example
cleanup() { "${COMPOSE[@]}" down -v >/dev/null 2>&1; rm -rf "$BACKUP_DIR"; }
BACKUP_DIR=$(mktemp -d); export BACKUP_DIR
trap cleanup EXIT

"${COMPOSE[@]}" up -d --build --wait umami umami-db 2>&1 | tail -1
check "umami is healthy" "\"\${COMPOSE[@]}\" ps --format '{{.Service}} {{.Health}}' | grep -q 'umami healthy'"

out=$(bash server/backup-umami.sh 2>&1); echo "$out"
dump=$(ls "$BACKUP_DIR"/umami-*.sql.gz 2>/dev/null | head -1)
check "dump file written" "[ -n \"\$dump\" ] && gunzip -t \"\$dump\""
check "script prints the dump size" "grep -qE '\"event\": \"backup\".*\"bytes\": \"[0-9]+\"' <<<\"\$out\""

# Retention: a 20-day-old file must be deleted, a 2-day-old one kept.
touch -d '20 days ago' "$BACKUP_DIR/umami-2000-01-01.sql.gz" 2>/dev/null || touch -t "$(date -v-20d +%Y%m%d0000)" "$BACKUP_DIR/umami-2000-01-01.sql.gz"
touch -d '2 days ago' "$BACKUP_DIR/umami-2000-01-02.sql.gz" 2>/dev/null || touch -t "$(date -v-2d +%Y%m%d0000)" "$BACKUP_DIR/umami-2000-01-02.sql.gz"
bash server/backup-umami.sh >/dev/null 2>&1
check "old dump pruned, recent kept" "[ ! -e \"\$BACKUP_DIR/umami-2000-01-01.sql.gz\" ] && [ -e \"\$BACKUP_DIR/umami-2000-01-02.sql.gz\" ]"

# Restore into a scratch database and count tables.
"${COMPOSE[@]}" exec -T umami-db psql -U umami -d postgres -qc 'CREATE DATABASE umami_restore' >/dev/null
gunzip -c "$dump" | "${COMPOSE[@]}" exec -T umami-db psql -U umami -d umami_restore -q >/dev/null 2>&1
tables=$("${COMPOSE[@]}" exec -T umami-db psql -U umami -d umami_restore -tAc "SELECT count(*) FROM pg_tables WHERE schemaname='public'")
check "restore yields umami tables (got $tables)" "[ \"\${tables:-0}\" -ge 10 ]"
exit $fail
