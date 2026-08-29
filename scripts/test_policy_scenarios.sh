#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

post_case() {
  local case_id="$1"
  local reason="$2"
  local method="$3"
  local hours="$4"
  curl -fsS -X POST "${BASE_URL}/api/policy/recommend" \
    -H "content-type: application/json" \
    -d "{\"case_id\":\"${case_id}\",\"failure_reason\":\"${reason}\",\"method\":\"${method}\",\"hours_since_failure\":${hours},\"contacts_used\":0,\"amount_paise\":150000}"
  printf '\n'
}

echo "DQN policy contract scenarios (no Razorpay charge is made)"
post_case "SIM-CARD-INSUFFICIENT" "insufficient_funds" "card" 0
post_case "SIM-CARD-GATEWAY" "gateway_error" "card" 0
post_case "SIM-UPI-TIMEOUT" "upi_timeout" "upi" 0
echo "For real Test Mode validation, follow docs/RAZORPAY_TEST_MODE.md."
