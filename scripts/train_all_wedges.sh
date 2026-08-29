#!/usr/bin/env bash
# Long training run for all four recovery wedges (v2 architecture, no LayerNorm)
set -euo pipefail
cd "$(dirname "$0")/.."
PY=".venv/bin/python"
EPISODES="${EPISODES:-10000}"
SEED="${SEED:-42}"
LOG_DIR="eval/logs"
mkdir -p "$LOG_DIR" eval/checkpoints eval/results

for WEDGE in checkout_failed cart_abandon subscription_failed invoice_overdue; do
  echo "=== Training $WEDGE ($EPISODES episodes) ==="
  "$PY" -m packages.policy.train.run \
    --wedge "$WEDGE" \
    --train \
    --episodes "$EPISODES" \
    --seed "$SEED" \
    2>&1 | tee "$LOG_DIR/train_${WEDGE}_$(date +%Y%m%d_%H%M%S).log"

  echo "=== Benchmark $WEDGE ==="
  "$PY" -m packages.policy.train.run \
    --wedge "$WEDGE" \
    --benchmark \
    --benchmark-episodes 200 \
    2>&1 | tee "$LOG_DIR/benchmark_${WEDGE}_$(date +%Y%m%d_%H%M%S).log"
done

echo "=== All wedges complete ==="
