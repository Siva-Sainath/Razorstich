#!/usr/bin/env python3
"""Train all four wedges sequentially with unbuffered logging."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = ROOT / ".venv/bin/python"
EPISODES = int(os.environ.get("EPISODES", "20000"))
SEED = int(os.environ.get("SEED", "42"))
MILESTONES = os.environ.get("MILESTONES", "1000,4000,10000,15000,20000")
WEDGES = ["checkout_failed", "cart_abandon", "subscription_failed", "invoice_overdue"]
LOG_DIR = ROOT / "eval/logs"
RESULTS = ROOT / "eval/results"
BASELINE = ROOT / "eval/baselines/v1/results"
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


def load_baseline_mean(wedge: str) -> float | None:
    path = BASELINE / f"benchmark_{wedge}_stats.json"
    if not path.exists():
        return None
    return float(json.loads(path.read_text()).get("policy_mean_net_inr", 0))


def maybe_restore_baseline(wedge: str) -> None:
    baseline_ckpt = ROOT / "eval/baselines/v1/checkpoints" / f"dueling_{wedge}_best.pt"
    current_ckpt = ROOT / "eval/checkpoints" / f"dueling_{wedge}_best.pt"
    if baseline_ckpt.exists():
        current_ckpt.parent.mkdir(parents=True, exist_ok=True)
        current_ckpt.write_bytes(baseline_ckpt.read_bytes())
        log(f"RESTORED v1 checkpoint for {wedge}")


def main() -> int:
    regressions: list[str] = []
    for wedge in WEDGES:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        config_path = RESULTS / f"hpo_{wedge}_best.json"
        train_cmd = [
            str(PY),
            "-m",
            "packages.policy.train.run",
            "--wedge",
            wedge,
            "--train",
            "--episodes",
            str(EPISODES),
            "--seed",
            str(SEED),
            "--save-milestones",
            MILESTONES,
        ]
        if config_path.exists():
            train_cmd.extend(["--config-json", str(config_path)])
        else:
            log(f"WARN missing {config_path}, using default config for {wedge}")

        rc = run(train_cmd, f"train_{wedge}_{ts}.log")
        if rc != 0:
            log(f"FAILED train {wedge}")
            return rc

        brc = run(
            [
                str(PY),
                "-m",
                "packages.policy.train.run",
                "--wedge",
                wedge,
                "--benchmark",
                "--benchmark-episodes",
                "200",
            ],
            f"benchmark_{wedge}_{ts}.log",
        )
        if brc != 0:
            log(f"WARN benchmark {wedge} exit={brc}")

        vrc = run(
            [
                str(PY),
                "-m",
                "packages.policy.verify_inference",
                "--checkpoint",
                f"eval/checkpoints/dueling_{wedge}_best.pt",
            ],
            f"verify_{wedge}_{ts}.log",
        )
        if vrc != 0:
            log(f"FAILED verify_inference {wedge}")
            return vrc

        stats_path = RESULTS / f"benchmark_{wedge}_stats.json"
        if stats_path.exists():
            stats = json.loads(stats_path.read_text())
            acceptance = stats.get("acceptance", {})
            if isinstance(acceptance, dict) and not acceptance.get("pass", True):
                log(f"WARN acceptance failed for {wedge}")
            baseline_mean = load_baseline_mean(wedge)
            policy_mean = float(stats.get("policy_mean_net_inr", 0))
            if baseline_mean is not None and policy_mean < baseline_mean:
                log(
                    f"REGRESSION {wedge}: v2={policy_mean:.0f} < v1={baseline_mean:.0f}; restoring v1 weights"
                )
                maybe_restore_baseline(wedge)
                regressions.append(wedge)

    summary = {
        "episodes": EPISODES,
        "seed": SEED,
        "milestones": MILESTONES,
        "completed_at": datetime.now().isoformat(),
        "regressions_restored_to_v1": regressions,
    }
    (RESULTS / "train_v2_summary.json").write_text(json.dumps(summary, indent=2))
    log("ALL WEDGES COMPLETE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
