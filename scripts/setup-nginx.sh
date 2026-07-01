#!/usr/bin/env bash
# One-time Nginx + SSL setup for admin.crrc.ir on the VPS.
# Run as root: bash scripts/setup-nginx.sh
set -euo pipefail

APP_DIR="/root/admin-pannel-test/Admin-Pannel"
DOMAIN="admin.crrc.ir"
SSL_CERT="/root/cert.crt"
SSL_KEY="/root/private.key"
NGINX_AVAILABLE="/etc/nginx/sites-available/admin-pannel"
NGINX_ENABLED="/etc/nginx/sites-enabled/admin-pannel"

echo "==> Checking SSL files..."
if [ ! -f "$SSL_CERT" ]; then
  echo "ERROR: Certificate not found: $SSL_CERT"
  exit 1
fi
if [ ! -f "$SSL_KEY" ]; then
  echo "ERROR: Private key not found: $SSL_KEY"
  exit 1
fi
chmod 600 "$SSL_KEY" 2>/dev/null || true

echo "==> Installing nginx (if needed)..."
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update
  apt-get install -y nginx
fi

echo "==> Installing site config..."
cp "$APP_DIR/scripts/nginx/admin.crrc.ir.conf" "$NGINX_AVAILABLE"
ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"

# Remove default site if it conflicts on port 80
if [ -f /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi

echo "==> Testing nginx config..."
nginx -t

echo "==> Reloading nginx..."
systemctl enable nginx
systemctl reload nginx

echo "==> Done."
echo "    URL:  https://$DOMAIN"
echo "    Ensure DNS A record for $DOMAIN points to this server."
echo "    Add to $APP_DIR/.env:"
echo "      APP_URL=https://$DOMAIN"
