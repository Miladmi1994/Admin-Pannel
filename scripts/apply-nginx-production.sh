#!/usr/bin/env bash
# Point admin.crrc.ir nginx at production (127.0.0.1:3001), not staging (:3000).
# Run on VPS as root after production PM2 is running on port 3001.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="$SCRIPT_DIR/nginx/admin.crrc.ir.conf"
NGINX_AVAILABLE="/etc/nginx/sites-available/admin-pannel"
NGINX_ENABLED="/etc/nginx/sites-enabled/admin-pannel"

if [ ! -f "$CONF_SRC" ]; then
  echo "ERROR: Missing $CONF_SRC"
  exit 1
fi

echo "==> Current nginx proxy target:"
grep -E 'proxy_pass|server_name' "$NGINX_AVAILABLE" 2>/dev/null || echo "(no config yet)"

echo "==> Installing nginx config (production → :3001)..."
cp "$CONF_SRC" "$NGINX_AVAILABLE"
ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"

echo "==> Checking production app on :3001..."
if ! ss -tlnp 2>/dev/null | grep -q ':3001'; then
  echo "ERROR: Nothing is listening on port 3001."
  echo "       Nginx would still serve staging if you only changed .env on the staging app."
  echo "       1) Set up production at /root/admin-pannel/Admin-Pannel/"
  echo "       2) .env: APP_ENV=production PORT=3001 APP_URL=https://admin.crrc.ir"
  echo "       3) bash scripts/deploy-production.sh"
  echo "       4) Re-run this script"
  exit 1
fi

nginx -t
systemctl reload nginx

echo "==> Done. Verify:"
echo "    curl -s https://admin.crrc.ir/api/health | jq .environment"
echo "    (should print \"production\", not \"staging\")"
