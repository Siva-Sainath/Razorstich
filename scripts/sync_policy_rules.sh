#!/usr/bin/env bash
# Sync DQN-exported rules into Next.js after training
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$ROOT/eval/checkpoints/policy_rules.json}"
DEST="$ROOT/apps/web/src/data/policy_rules.json"
cp "$SRC" "$DEST"
echo "Synced $SRC -> $DEST"
