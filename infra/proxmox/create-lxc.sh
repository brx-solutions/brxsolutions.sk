#!/usr/bin/env bash
# Creates the brx-web LXC on the Proxmox host. Run as root on the host (node Shell in the UI).
# Idempotent enough to re-run after `pct destroy 102` if something went wrong.
set -euo pipefail

CTID="${CTID:-102}"
TEMPLATE="${TEMPLATE:-local:vztmpl/debian-13-standard_13.6-1_amd64.tar.zst}"

pct create "$CTID" "$TEMPLATE" \
  --hostname brx-web \
  --unprivileged 1 \
  --features nesting=1,keyctl=1 \
  --cores 2 --memory 1536 --swap 512 \
  --rootfs local-lvm:16 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp,firewall=1 \
  --ssh-public-keys /root/.ssh/authorized_keys \
  --onboot 1 \
  --description "brxsolutions.sk web: caddy, contact-api, umami, cloudflared"

pct start "$CTID"
sleep 8
pct status "$CTID"
pct exec "$CTID" -- ip -4 addr show eth0 | grep inet
