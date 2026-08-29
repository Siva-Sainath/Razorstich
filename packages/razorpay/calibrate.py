"""
Offline calibration: fit simulator priors from Razorpay Test Mode audit logs.

Usage (after collecting webhook outcomes in Supabase or JSONL):

    python -m packages.razorpay.calibrate --audit path/to/audit_export.jsonl

Does NOT train RL online. Adjusts CustomerResponseModel hints for next offline retrain.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


def load_outcomes(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text().splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def summarise_recovery_rates(rows: list[dict]) -> dict[str, dict]:
    """Aggregate recovered / failed by failure_reason from audit exports."""
    by_reason: dict[str, list[bool]] = defaultdict(list)
    for row in rows:
        payload = row.get("payload") or row
        reason = payload.get("failure_reason") or payload.get("error_reason")
        recovered = payload.get("recovered") or payload.get("payment_status") == "captured"
        if reason:
            by_reason[reason].append(bool(recovered))
    return {
        reason: {
            "n": len(vals),
            "recovery_rate": sum(vals) / len(vals) if vals else 0.0,
        }
        for reason, vals in by_reason.items()
    }


def main() -> None:
    p = argparse.ArgumentParser(description="Summarise Razorpay outcomes for simulator calibration")
    p.add_argument("--audit", type=Path, required=True, help="JSONL export of audit_entries or test runs")
    p.add_argument("--out", type=Path, default=Path("eval/results/razorpay_calibration.json"))
    args = p.parse_args()

    rows = load_outcomes(args.audit)
    summary = summarise_recovery_rates(rows)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(summary, indent=2))
    print(f"Wrote calibration summary to {args.out}")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
