#!/usr/bin/env python3
"""Run per-wedge HPO sweeps and write hpo_summary.json."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = ROOT / ".venv/bin/python"
WEDGES = ["checkout_failed", "cart_abandon", "subscription_failed", "invoice_overdue"]


def main() -> int:
    trials = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    episodes = int(sys.argv[2]) if len(sys.argv) > 2 else 1500
    summary: dict = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "trials_per_wedge": trials,
        "episodes_per_trial": episodes,
        "wedges": {},
    }

    for wedge in WEDGES:
        cmd = [
            str(PY),
            str(ROOT / "scripts/tune_wedge.py"),
            "--wedge",
            wedge,
            "--trials",
            str(trials),
            "--episodes",
            str(episodes),
            "--seed",
            "42",
        ]
        rc = subprocess.run(cmd, cwd=ROOT)
        if rc.returncode != 0:
            return rc.returncode
        hpo_path = ROOT / "eval/results" / f"hpo_{wedge}.json"
        if hpo_path.exists():
            payload = json.loads(hpo_path.read_text())
            summary["wedges"][wedge] = {
                "best_trial_id": payload.get("best_trial_id"),
                "best_config": payload.get("best_config"),
                "best_metrics": payload.get("best_metrics"),
            }

    out = ROOT / "eval/results/hpo_summary.json"
    out.write_text(json.dumps(summary, indent=2))
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
