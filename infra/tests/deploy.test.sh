#!/usr/bin/env bash
# Exercises infra/server/deploy.sh with fake curl/docker binaries on PATH.
set -uo pipefail
cd "$(dirname "$0")/.."
DEPLOY="$PWD/server/deploy.sh"
fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin" "$tmp/infra"
cat > "$tmp/bin/curl" <<'SH'
#!/usr/bin/env bash
[ "${FAKE_API_DOWN:-}" = 1 ] && exit 7
printf '%s' "${FAKE_API_BODY:-}"
SH
cat > "$tmp/bin/docker" <<'SH'
#!/usr/bin/env bash
echo "docker $*" >> "$FAKE_LOG"
if [ "$1" = manifest ]; then [ "${FAKE_MANIFEST_MISSING:-}" = 1 ] && exit 1; exit 0; fi
if [ "$1" = compose ] && [[ "$*" == *" ps "* ]]; then printf '%s\n' "${FAKE_PS:-web running}"; exit 0; fi
exit 0
SH
chmod +x "$tmp/bin/"*
export PATH="$tmp/bin:$PATH" FAKE_LOG="$tmp/log"

run() { # run <IMAGE_TAG> <PIN_TAG> -> stdout
  printf 'IMAGE_TAG=%s\nPIN_TAG=%s\nGITHUB_REPO=brx-solutions/brxsolutions.sk\nOTHER=keep\n' "$1" "$2" > "$tmp/infra/.env"
  : > "$FAKE_LOG"
  (cd "$tmp/infra" && bash "$DEPLOY" --dry-run 2>&1)
}
NEW='{"workflow_runs":[{"head_sha":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","conclusion":"success"}]}'

out=$(FAKE_API_DOWN=1 run aaaa "")
check "api down -> no target, no docker calls" "grep -q 'no target' <<<\"\$out\" && [ ! -s \"\$FAKE_LOG\" ]"

out=$(FAKE_API_BODY='{"workflow_runs":[]}' run aaaa "")
check "empty runs -> no target" "grep -q 'no target' <<<\"\$out\""

out=$(FAKE_API_BODY="$NEW" run bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb "")
check "same sha and running -> up to date" "grep -q 'up to date' <<<\"\$out\""

out=$(FAKE_API_BODY="$NEW" FAKE_MANIFEST_MISSING=1 run aaaa "")
check "manifest missing -> not published yet, no pull" "grep -q 'not published yet' <<<\"\$out\" && ! grep -q 'compose.*pull' \"\$FAKE_LOG\""

out=$(FAKE_API_BODY="$NEW" run aaaa "")
check "new sha -> would pull and up" "grep -q 'would run' <<<\"\$out\" && grep -q 'compose.*pull' <<<\"\$out\" && grep -q 'up -d --remove-orphans' <<<\"\$out\""
check "new sha -> dry run leaves .env untouched" "grep -q '^IMAGE_TAG=aaaa$' \"\$tmp/infra/.env\""

out=$(FAKE_API_BODY="$NEW" run aaaa cccc)
check "PIN_TAG wins over api" "grep -q '\"target\": \"cccc\"' <<<\"\$out\""

# Real write path: no --dry-run, fake docker succeeds.
printf 'IMAGE_TAG=aaaa\nPIN_TAG=\nGITHUB_REPO=brx-solutions/brxsolutions.sk\nOTHER=keep\n' > "$tmp/infra/.env"
out=$(cd "$tmp/infra" && FAKE_API_BODY="$NEW" bash "$DEPLOY" 2>&1)
check "deploy rewrites only IMAGE_TAG" "grep -q '^IMAGE_TAG=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb$' \"\$tmp/infra/.env\" && grep -q '^OTHER=keep$' \"\$tmp/infra/.env\" && grep -q '^PIN_TAG=$' \"\$tmp/infra/.env\""
check "deploy pulled, upped and pruned" "grep -q 'compose.*pull' \"\$FAKE_LOG\" && grep -q 'up -d --remove-orphans' \"\$FAKE_LOG\" && grep -q 'image prune' \"\$FAKE_LOG\""
check "deploy logs a json line with the tag" "grep -q '\"event\": *\"deployed\"' <<<\"\$out\""
exit $fail
