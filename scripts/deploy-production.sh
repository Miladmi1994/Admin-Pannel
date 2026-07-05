#!/usr/bin/env bash
# Manual production deploy only (no GitHub Actions).
# Run on the server: bash /root/Admin-Pannel/scripts/deploy-production.sh
# Access: https://admin.crrc.ir (nginx → port 3001)
set -euo pipefail

APP_DIR="/root/Admin-Pannel"
PM2_NAME="admin-pannel"
BRANCH="main"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "ERROR: $APP_DIR is not a git repo. Run one-time server setup first."
  exit 1
fi

cd "$APP_DIR"

echo "==> Fetching latest $BRANCH..."
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Installing dependencies..."
npm install

echo "==> Building frontend + server..."
npm run build

echo "==> Restarting PM2 process (production)..."
export APP_ENV=production

if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start dist/server.cjs --name "$PM2_NAME"
fi

pm2 save

echo "==> Production deploy complete."
echo "    URL:  https://admin.crrc.ir"
echo "    Ensure $APP_DIR/.env has:"
echo "      APP_ENV=production"
echo "      PORT=3001"
echo "      APP_URL=https://admin.crrc.ir"
echo "      DB_PATH=/root/telbot/telbot.db"
pm2 status "$PM2_NAME"
