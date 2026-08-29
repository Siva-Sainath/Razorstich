#!/usr/bin/env python3
"""Train all four wedges sequentially with unbuffered logging."""
from __future__ import annotations

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = ROOT / ".venv/bin/python"
EPISODES = int(os.environ.get("EPISODES", "10000"))
SEED = int(os.environ.get("SEED", "42"))
WEDGES = ["checkout_failed", "cart_abandon", "subscription_failed", "invoice_overdue"]
LOG_DIR = ROOT / "eval/logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def log(msg: str) -> None:
    line = f"[{datetime.now().isoformat()}] {msg}"
    print(line, flush=True)
    (LOG_DIR / "train_all_master.log").open("a").write(line + "\n")


def run(cmd: list[str], log_name: str) -> int:
    log_path = LOG_DIR / log_name
    log(f"START {' '.join(cmd)}")
    with log_path.open("w") as f:
        proc = subprocess.run(cmd, cwd=ROOT, stdout=f, stderr=subprocess.STDOUT)
    log(f"DONE exit={proc.returncode} -> {log_path.name}")
    return proc.returncode


def main() -> int:
    for wedge in WEDGES:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        rc = run(
            [str(PY), "-m", "packages.policy.train.run", "--wedge", wedge, "--train", "--episodes", str(EPISODES), "--seed", str(SEED)],
            f"train_{wedge}_{ts}.log",
        )
        if rc != 0:
            log(f"FAILED train {wedge}")
            return rc
        brc = run(
            [str(PY), "-m", "packages.policy.train.run", "--wedge", wedge, "--benchmark", "--benchmark-episodes", "200"],
            f"benchmark_{wedge}_{ts}.log",
        )
        if brc != 0:
            log(f"WARN benchmark {wedge} exit={brc} (training checkpoint still saved)")
    log("ALL WEDGES COMPLETE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
