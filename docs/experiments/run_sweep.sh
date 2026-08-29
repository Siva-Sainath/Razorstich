#!/usr/bin/env bash
# run_sweep.sh — E1: friction_weight sweep for RazorStitch RL
#
# Trains and evaluates DQN for each friction_weight in {0.5, 1.0, 1.5}.
# Results written to eval/results/sweep_friction_<value>_seed<seed>.json
#
# Usage:
#   bash docs/experiments/run_sweep.sh [--seed SEED] [--episodes EPISODES]
#
# Requires: python -m packages.policy.train (non-interactive, no prompts)
# All flags forwarded to train.py are pre-existing; none are added here.

set -euo pipefail

# ── defaults ──────────────────────────────────────────────────────────────────
SEED=42
EPISODES=1500
RESULTS_DIR="eval/results"
CKPT_DIR="eval/checkpoints"

# ── argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)     SEED="$2";     shift 2 ;;
    --episodes) EPISODES="$2"; shift 2 ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: bash run_sweep.sh [--seed SEED] [--episodes EPISODES]" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$RESULTS_DIR" "$CKPT_DIR"

echo "========================================================"
echo "  RazorStitch RL — E1: friction_weight sweep"
echo "  seed=${SEED}  episodes=${EPISODES}"
echo "========================================================"

# ── sweep loop ────────────────────────────────────────────────────────────────
for FW in 0.5 1.0 1.5; do
  TAG="friction${FW}_seed${SEED}"
  echo ""
  echo "── E1 run: friction_weight=${FW} ──"

  # Train: python -m packages.policy.train --train --seed SEED --episodes EPISODES
  # We pass the standard CLI flags; friction_weight is injected via the
  # RAZORSTITCH_FRICTION_WEIGHT environment variable read by a thin wrapper below.
  RAZORSTITCH_FRICTION_WEIGHT="$FW" \
    python -m packages.policy.train \
      --train \
      --seed "$SEED" \
      --episodes "$EPISODES"

  # Rename training curve so it isn't overwritten on the next iteration
  if [[ -f "${RESULTS_DIR}/training_curve.json" ]]; then
    cp "${RESULTS_DIR}/training_curve.json" \
       "${RESULTS_DIR}/curve_${TAG}.json"
    echo "  → Saved training curve: ${RESULTS_DIR}/curve_${TAG}.json"
  fi

  # Evaluate using the best checkpoint produced by this run
  CKPT="${CKPT_DIR}/dqn_best.pt"
  if [[ ! -f "$CKPT" ]]; then
    CKPT="${CKPT_DIR}/dqn_train_seed${SEED}.pt"
  fi

  RAZORSTITCH_FRICTION_WEIGHT="$FW" \
    python -m packages.policy.train \
      --eval \
      --seed "$SEED"

  # Snapshot the benchmark JSON for this configuration
  if [[ -f "${RESULTS_DIR}/benchmark.json" ]]; then
    cp "${RESULTS_DIR}/benchmark.json" \
       "${RESULTS_DIR}/sweep_${TAG}.json"
    echo "  → Saved benchmark:      ${RESULTS_DIR}/sweep_${TAG}.json"
  fi

  # ── inline summary ─────────────────────────────────────────────────────────
  python - << PYEOF
import json, pathlib, sys

path = pathlib.Path("${RESULTS_DIR}/sweep_${TAG}.json")
if not path.exists():
    print("  [warn] benchmark file not found, skipping summary")
    sys.exit(0)

data = json.loads(path.read_text())
dqn_rows = data.get("dqn", [])
if dqn_rows:
    nets  = [r["net_recovered_value_inr"] for r in dqn_rows]
    rates = [r["recovery_rate"]           for r in dqn_rows]
    dups  = sum(r["duplicate_incidents"]  for r in dqn_rows)
    print(f"  friction_weight={${FW}}  "
          f"net_sum={sum(nets):,.0f} INR  "
          f"recovery={sum(rates)/len(rates):.2%}  "
          f"dups={dups}")
else:
    bl = data.get("baselines", [])
    if bl:
        print(f"  (no DQN rows — baseline-only run, {len(bl)} baseline records)")
PYEOF

done

# ── comparison table ──────────────────────────────────────────────────────────
echo ""
echo "========================================================"
echo "  E1 sweep complete. Generating comparison table…"
echo "========================================================"

python - << PYEOF
import json, pathlib

results_dir = pathlib.Path("${RESULTS_DIR}")
rows = []

for fw in ("0.5", "1.0", "1.5"):
    tag  = f"friction{fw}_seed${SEED}"
    path = results_dir / f"sweep_{tag}.json"
    if not path.exists():
        rows.append((fw, None, None, None))
        continue
    data = json.loads(path.read_text())
    dqn  = data.get("dqn", [])
    if dqn:
        net  = sum(r["net_recovered_value_inr"] for r in dqn)
        rate = sum(r["recovery_rate"]           for r in dqn) / len(dqn)
        dups = sum(r["duplicate_incidents"]     for r in dqn)
        rows.append((fw, net, rate, dups))
    else:
        rows.append((fw, None, None, None))

header = f"{'friction_weight':>16}  {'net_recovered_INR':>20}  {'recovery_rate':>14}  {'duplicates':>10}"
sep    = "-" * len(header)
print(header)
print(sep)
for fw, net, rate, dups in rows:
    if net is None:
        print(f"{fw:>16}  {'(no data)':>20}  {'—':>14}  {'—':>10}")
    else:
        print(f"{fw:>16}  {net:>20,.0f}  {rate:>14.2%}  {dups:>10}")

summary_path = results_dir / "sweep_friction_summary.json"
summary_path.write_text(json.dumps(
    [{"friction_weight": fw, "net_recovered_inr": net,
      "recovery_rate": rate, "duplicate_incidents": dups}
     for fw, net, rate, dups in rows],
    indent=2
))
print(f"\nSummary written to {summary_path}")
PYEOF

echo ""
echo "Done. See ${RESULTS_DIR}/sweep_friction_summary.json for machine-readable output."
