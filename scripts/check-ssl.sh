#!/usr/bin/env sh
# Diagnose SSL / HTTPS for modernitygate.com
DOMAIN="${DOMAIN:-modernitygate.com}"

echo "=== DNS ==="
echo -n "$DOMAIN A: "
dig +short "$DOMAIN" A 2>/dev/null | tr '\n' ' ' || echo "?"
echo ""
echo -n "www.$DOMAIN: "
dig +short "www.$DOMAIN" A 2>/dev/null | tr '\n' ' '
dig +short "www.$DOMAIN" CNAME 2>/dev/null | tr '\n' ' '
echo ""

VPS_IP=$(curl -4 -s --max-time 5 ifconfig.me 2>/dev/null || true)
echo "VPS public IP: ${VPS_IP:-unknown}"

echo ""
echo "=== Certificate (public) ==="
if command -v openssl >/dev/null 2>&1; then
  echo | openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates 2>/dev/null \
    || echo "Could not read certificate (DNS or port 443 issue)"
else
  curl -svI "https://$DOMAIN/login" 2>&1 | grep -iE 'subject|issuer|SSL|certificate' | head -10
fi

echo ""
echo "=== HTTPS response ==="
curl -skI "https://$DOMAIN/login" 2>/dev/null | head -8 || echo "HTTPS failed"

echo ""
echo "=== Traefik ACME logs ==="
docker logs traefik-traefik-1 2>&1 | grep -iE 'acme|certificate|error|modernitygate' | tail -20 \
  || docker logs "$(docker ps -q --filter name=traefik | head -1)" 2>&1 | grep -iE 'acme|certificate|error' | tail -20

echo ""
echo "=== acme.json (if present) ==="
for f in /docker/traefik/acme.json /docker/traefik/data/acme.json /docker/traefik/letsencrypt/acme.json; do
  if [ -f "$f" ]; then
    echo "Found: $f"
    if command -v python3 >/dev/null 2>&1; then
      python3 -c "
import json,sys
d=json.load(open('$f'))
for k,v in d.items():
  certs=v.get('Certificates') or []
  print(f'Resolver {k}: {len(certs)} cert(s)')
  for c in certs:
    print(' -', c.get('domain',{}).get('main','?'))
" 2>/dev/null || wc -c < "$f"
    else
      wc -c < "$f"
    fi
  fi
done
