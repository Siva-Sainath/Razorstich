"""Read-only learning artifacts used by the Learning Lab."""

from __future__ import annotations

import json
from pathlib import Path

from agents_registry import get_agent
from episode_builder import build_all_cases

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "eval" / "results"
CHECKPOINTS = ROOT / "eval" / "checkpoints"
BASELINE_RESULTS = ROOT / "eval" / "baselines" / "v1" / "results"
BASELINE_MANIFEST = ROOT / "eval" / "baselines" / "v1" / "manifest.json"


def _validate_wedge(wedge: str) -> None:
    get_agent(wedge)


def load_training_curve(wedge: str) -> list[dict]:
    _validate_wedge(wedge)
    path = RESULTS / f"training_curve_{wedge}.json"
    return json.loads(path.read_text()) if path.exists() else []


def load_benchmark_stats(wedge: str) -> dict:
    _validate_wedge(wedge)
    path = RESULTS / f"benchmark_{wedge}_stats.json"
    return json.loads(path.read_text()) if path.exists() else {}


def load_baseline_benchmark(wedge: str) -> dict:
    _validate_wedge(wedge)
    path = BASELINE_RESULTS / f"benchmark_{wedge}_stats.json"
    return json.loads(path.read_text()) if path.exists() else {}


def load_baseline_manifest() -> dict:
    return json.loads(BASELINE_MANIFEST.read_text()) if BASELINE_MANIFEST.exists() else {}


def load_hpo_results(wedge: str) -> dict:
    _validate_wedge(wedge)
    path = RESULTS / f"hpo_{wedge}.json"
    return json.loads(path.read_text()) if path.exists() else {}


def load_hpo_summary() -> dict:
    path = RESULTS / "hpo_summary.json"
    return json.loads(path.read_text()) if path.exists() else {}


def load_train_v2_summary() -> dict:
    path = RESULTS / "train_v2_summary.json"
    return json.loads(path.read_text()) if path.exists() else {}


def load_learning_manifest(wedge: str) -> list[dict]:
    _validate_wedge(wedge)
    path = RESULTS / f"learning_manifest_{wedge}.json"
    return json.loads(path.read_text()) if path.exists() else []


def rank_validation_cases(wedge: str) -> list[dict]:
    """Rank fixed validation cases by recovered value and narrative depth."""
    _validate_wedge(wedge)
    rows = []
    for payload in build_all_cases(seed=42).values():
        case = payload["case"]
        if case["wedge"] != wedge:
            continue
        rollout = payload.get("rollout", [])
        recovered = case["status"] == "recovered"
        amount = float(case["amount"])
        # The case payload is generated from the same DQN rollout used by Theater.
        # This is a deterministic ranking signal, not a new model score.
        net_inr = amount if recovered else 0.0
        rows.append(
            {
                "case_id": case["id"],
                "net_inr": net_inr,
                "recovered": recovered,
                "steps": len(rollout),
                "amount_inr": amount,
            }
        )
    return sorted(rows, key=lambda row: (-row["net_inr"], -row["steps"], row["case_id"]))


def get_featured_case(wedge: str = "checkout_failed") -> dict:
    ranked = rank_validation_cases(wedge)
    if not ranked:
        raise RuntimeError(f"no validation cases available for {wedge}")
    return {
        **ranked[0],
        "rank": 1,
        "total_cases": len(ranked),
    }


def get_featured_case_id(wedge: str = "checkout_failed") -> str:
    return get_featured_case(wedge)["case_id"]


def learning_summary(wedge: str = "checkout_failed") -> dict:
    featured = get_featured_case(wedge)
    return {
        "wedge": wedge,
        "anchor_case_id": featured["case_id"],
        "featured": featured,
        "training_curve": load_training_curve(wedge),
        "benchmark": load_benchmark_stats(wedge),
        "baseline_benchmark": load_baseline_benchmark(wedge),
        "manifest": load_learning_manifest(wedge),
        "hpo": load_hpo_results(wedge),
        "train_v2": load_train_v2_summary(),
    }


def research_catalog_meta() -> dict:
    return {
        "baseline": load_baseline_manifest(),
        "hpo_summary": load_hpo_summary(),
        "train_v2": load_train_v2_summary(),
    }
