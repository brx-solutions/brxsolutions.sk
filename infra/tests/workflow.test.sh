#!/usr/bin/env bash
# Static checks on the CI workflow and image naming. Run from the repo root.
set -uo pipefail
cd "$(dirname "$0")/../.."
fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

check "publish job exists" "grep -qE '^  publish:' .github/workflows/ci.yml"
check "publish job needs test and docker" "grep -A4 -E '^  publish:' .github/workflows/ci.yml | grep -qE 'needs: \[test, docker\]'"
check "publish job runs only on push to main" "grep -A6 -E '^  publish:' .github/workflows/ci.yml | grep -qE \"github.event_name == 'push'\""
check "packages: write permission" "grep -qE 'packages: write' .github/workflows/ci.yml"
check "web image name" "grep -qE 'ghcr.io/brx-solutions/web:' .github/workflows/ci.yml"
check "contact-api image name" "grep -qE 'ghcr.io/brx-solutions/contact-api:' .github/workflows/ci.yml"
check "no misspelled org anywhere" "! grep -rqE --exclude-dir=tests 'ghcr.io/brxsolutions/' infra .github README.md"
exit $fail
