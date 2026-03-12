#!/bin/bash
set -euo pipefail

BRANCH="documentation"
REPO_DIR="/var/www/historisches-wald"

echo "Update gestartet ($(date -Iseconds))"

cd "$REPO_DIR"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

pushd frontend >/dev/null
npm ci
npm run build
popd >/dev/null

pushd backend >/dev/null
npm ci
pm2 restart historisches-backend
popd >/dev/null

systemctl reload nginx

echo "Update abgeschlossen ($(date -Iseconds))"
