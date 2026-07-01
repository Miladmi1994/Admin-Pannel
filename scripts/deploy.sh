#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/root/admin-pannel-test/Admin-Pannel"
PM2_NAME="admin-pannel-test"
BRANCH="develop"

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

echo "==> Restarting PM2 process..."
export NODE_ENV=production

if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start dist/server.cjs --name "$PM2_NAME"
fi

pm2 save

echo "==> Deploy complete."
pm2 status "$PM2_NAME"
