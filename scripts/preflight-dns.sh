#!/usr/bin/env sh
# Verify DNS points to this server before HTTP-01 certbot.
set -e

DOMAIN="${1:-modernitygate.com}"

VPS_IP=$(curl -4 -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
DNS_IP=$(dig +short "$DOMAIN" A 2>/dev/null | tail -1)

echo "=== DNS preflight for $DOMAIN ==="
echo "This server public IP: ${VPS_IP:-unknown}"
echo "DNS A record:          ${DNS_IP:-not found}"

if [ -z "$VPS_IP" ] || [ -z "$DNS_IP" ]; then
  echo "WARNING: Could not compare IPs."
  exit 0
fi

if [ "$DNS_IP" != "$VPS_IP" ]; then
  echo ""
  echo "DNS does NOT point directly to this VPS."
  echo "Let's Encrypt HTTP challenge will fail (often via Hostinger CDN hcdn)."
  echo ""
  echo "Fix in Hostinger panel:"
  echo "  1. Disable CDN/proxy for $DOMAIN"
  echo "  2. Set A record -> $VPS_IP"
  echo "  3. Wait 5-15 min, then re-run issue-ssl.sh"
  echo ""
  echo "Or use Traefik (already has ACME on this server):"
  echo "  sudo sh scripts/start-traefik-stack.sh"
  exit 1
fi

echo "DNS OK — HTTP challenge should reach this server."
