#!/usr/bin/env sh
# Show how Traefik (or another reverse proxy) runs on this server.
set -e

echo "=== Processes named traefik ==="
pgrep -a traefik 2>/dev/null || ps aux 2>/dev/null | grep -i '[t]raefik' || echo "(none)"

echo ""
echo "=== Ports 80 / 443 ==="
ss -tlnp 2>/dev/null | grep -E ':80 |:443 ' || echo "(none)"

echo ""
echo "=== Docker containers (all) ==="
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}' 2>/dev/null || echo "(docker unavailable)"

echo ""
echo "=== Docker containers matching traefik ==="
docker ps -a --filter "name=traefik" --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}' 2>/dev/null || true

TRAEFIK_PID=$(pgrep -x traefik 2>/dev/null | head -1)
if [ -n "$TRAEFIK_PID" ]; then
  echo ""
  echo "=== Traefik host process (pid $TRAEFIK_PID) ==="
  tr '\0' ' ' < "/proc/$TRAEFIK_PID/cmdline" 2>/dev/null || true
  echo ""
  ls -la /etc/traefik/ 2>/dev/null || echo "/etc/traefik/ not found"
  ls -la /etc/traefik/dynamic/ 2>/dev/null || echo "/etc/traefik/dynamic/ not found"
fi

echo ""
echo "=== App health ==="
curl -sI http://127.0.0.1:9000/login 2>/dev/null | head -3 || echo "App not on :9000"
curl -sI https://modernitygate.com/login 2>/dev/null | head -5 || echo "HTTPS check failed"
