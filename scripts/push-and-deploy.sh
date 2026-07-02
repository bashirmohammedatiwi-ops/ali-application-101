#!/usr/bin/env sh
# Deploy from your Mac/PC to the VPS via SSH (after initial setup-new-vps.sh).
# Usage:
#   VPS_HOST=187.77.88.174 VPS_USER=root ./scripts/push-and-deploy.sh
set -e

VPS_HOST="${VPS_HOST:-187.77.88.174}"
VPS_USER="${VPS_USER:-root}"
APP_DIR="${APP_DIR:-/opt/modernity-gate}"

echo "=== Push to GitHub (local) ==="
git push origin main

echo "=== Deploy on $VPS_USER@$VPS_HOST ==="
ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && git pull --ff-only && ./scripts/deploy-vps.sh"

echo ""
echo "Done: https://modernitygate.com"
