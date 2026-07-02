#!/usr/bin/env sh
# Detect Traefik HTTPS entrypoint and cert resolver from running stack / config files.
set -e

TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)

detect_from_yaml() {
  file="$1"
  [ -f "$file" ] || return 1
  awk '
    /^[[:space:]]*[a-zA-Z0-9_.-]+:[[:space:]]*$/ {
      ep = $1
      gsub(/:/, "", ep)
    }
    /address:[[:space:]]*"?(:443|"?:443)/ {
      if (ep != "" && ep != "entryPoints" && ep != "address") {
        print ep
        exit
      }
    }
  ' "$file"
}

detect_https_entrypoint() {
  if [ -n "$TRAEFIK_CID" ]; then
    for api in \
      "http://127.0.0.1:8080/api/entrypoints" \
      "http://127.0.0.1:8080/api/http/entrypoints"; do
      JSON=$(docker exec "$TRAEFIK_CID" wget -qO- "$api" 2>/dev/null || true)
      if [ -n "$JSON" ]; then
        for ep in websecure https secure; do
          if printf '%s' "$JSON" | grep -q "\"name\":\"$ep\""; then
            printf '%s' "$ep"
            return 0
          fi
        done
      fi
    done

    for cfg in /etc/traefik/traefik.yml /etc/traefik/traefik.yaml /traefik.yml /config/traefik.yml; do
      if docker exec "$TRAEFIK_CID" test -f "$cfg" 2>/dev/null; then
        TMP=$(mktemp)
        docker exec "$TRAEFIK_CID" cat "$cfg" >"$TMP" 2>/dev/null || true
        EP=$(detect_from_yaml "$TMP" || true)
        rm -f "$TMP"
        if [ -n "$EP" ]; then
          printf '%s' "$EP"
          return 0
        fi
      fi
    done
  fi

  for f in \
    "$TRAEFIK_DIR/traefik.yml" \
    "$TRAEFIK_DIR/traefik.yaml" \
    "$TRAEFIK_DIR/config/traefik.yml" \
    /etc/traefik/traefik.yml; do
    EP=$(detect_from_yaml "$f" || true)
    if [ -n "$EP" ]; then
      printf '%s' "$EP"
      return 0
    fi
  done

  printf '%s' "websecure"
}

detect_cert_resolver() {
  if [ -d "$TRAEFIK_DIR" ]; then
    FOUND=$(grep -rhoE 'certResolver:\s*[a-zA-Z0-9_.-]+' "$TRAEFIK_DIR" 2>/dev/null | awk '{print $2}' | head -1 || true)
    [ -n "$FOUND" ] && printf '%s' "$FOUND" && return 0
    FOUND=$(grep -A20 'certificatesResolvers:' "$TRAEFIK_DIR"/traefik.yml "$TRAEFIK_DIR"/traefik.yaml 2>/dev/null \
      | grep -E '^[[:space:]]+[a-zA-Z0-9_.-]+:' | head -1 | sed 's/[: ].*//;s/^[[:space:]]*//' || true)
    [ -n "$FOUND" ] && printf '%s' "$FOUND" && return 0
  fi
  printf '%s' "letsencrypt"
}

export TRAEFIK_HTTPS_ENTRYPOINT="${TRAEFIK_HTTPS_ENTRYPOINT:-$(detect_https_entrypoint)}"
export TRAEFIK_CERT_RESOLVER="${TRAEFIK_CERT_RESOLVER:-$(detect_cert_resolver)}"

if [ "${1:-}" = "--print" ]; then
  echo "TRAEFIK_HTTPS_ENTRYPOINT=$TRAEFIK_HTTPS_ENTRYPOINT"
  echo "TRAEFIK_CERT_RESOLVER=$TRAEFIK_CERT_RESOLVER"
  echo "TRAEFIK_CID=${TRAEFIK_CID:-none}"
  echo "TRAEFIK_DIR=$TRAEFIK_DIR"
fi
