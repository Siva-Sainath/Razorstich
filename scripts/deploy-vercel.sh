#!/usr/bin/env bash
# Deploy frontend to Vercel production.
# Prerequisite: REACT_APP_BACKEND_URL set in Vercel (see frontend/.env.production.example)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install Vercel CLI: npm i -g vercel"
  exit 1
fi

echo "Building..."
npm run build
echo "Deploying to production..."
vercel deploy --prod --yes
echo "Done. Run ./scripts/deploy-check.sh <render-url> <vercel-url> to verify."
