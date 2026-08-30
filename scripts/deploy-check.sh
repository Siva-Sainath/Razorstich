#!/usr/bin/env bash
# Smoke-test a deployed RazorStitch backend (+ optional frontend).
# Usage:
#   ./scripts/deploy-check.sh https://razorstitch-api.onrender.com
#   ./scripts/deploy-check.sh https://razorstitch-api.onrender.com https://frontend-nine-teal-86.vercel.app

set -euo pipefail

BACKEND_URL="${1:?Usage: $0 <backend-url> [frontend-url]}"
FRONTEND_URL="${2:-}"
BACKEND_URL="${BACKEND_URL%/}"

echo "==> Backend: $BACKEND_URL"

agents_code=$(curl -s -o /tmp/rs-agents.json -w "%{http_code}" "$BACKEND_URL/api/agents")
if [[ "$agents_code" != "200" ]]; then
  echo "FAIL GET /api/agents (HTTP $agents_code)"
  cat /tmp/rs-agents.json 2>/dev/null || true
  exit 1
fi
echo "OK   GET /api/agents"

growth=$(curl -s -X POST "$BACKEND_URL/api/razorpay/orders" \
  -H 'Content-Type: application/json' \
  -d '{"plan_id":"growth","wedge":"checkout_failed"}')
plan_id=$(echo "$growth" | python3 -c "import sys,json; print(json.load(sys.stdin).get('plan_id',''))" 2>/dev/null || echo "")
amount=$(echo "$growth" | python3 -c "import sys,json; print(json.load(sys.stdin).get('amount_inr',''))" 2>/dev/null || echo "")
if [[ "$plan_id" != "growth" ]] || [[ "$amount" != "499" && "$amount" != "499.0" ]]; then
  echo "FAIL POST /api/razorpay/orders growth"
  echo "$growth"
  exit 1
fi
echo "OK   POST /api/razorpay/orders (growth ₹499)"

catalog_code=$(curl -s -o /tmp/rs-catalog.json -w "%{http_code}" "$BACKEND_URL/api/wedges/catalog")
if [[ "$catalog_code" != "200" ]]; then
  echo "WARN GET /api/wedges/catalog (HTTP $catalog_code) — research page needs this"
else
  echo "OK   GET /api/wedges/catalog"
fi

if [[ -n "$FRONTEND_URL" ]]; then
  FRONTEND_URL="${FRONTEND_URL%/}"
  echo ""
  echo "==> Frontend: $FRONTEND_URL"
  for path in / /research /checkout /pricing; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$path")
    if [[ "$code" == "200" ]]; then
      echo "OK   GET $path"
    else
      echo "FAIL GET $path (HTTP $code)"
    fi
  done
fi

echo ""
echo "All backend checks passed."
