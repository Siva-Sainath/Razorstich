"""Read-only learning artifacts used by the Learning Lab and theater."""

from __future__ import annotations

from agents_registry import get_agent
from episode_builder import build_all_cases
from eval_stats import (
    load_baseline_benchmark,
    load_baseline_manifest,
    load_hpo_results,
    load_hpo_summary,
    load_shipped_benchmark,
    load_shipped_manifest,
    load_shipped_training_curve,
    load_trained_benchmark,
    load_train_v2_summary,
    shipped_model,
)


def _validate_wedge(wedge: str) -> None:
    get_agent(wedge)


def load_training_curve(wedge: str) -> list[dict]:
    return load_shipped_training_curve(wedge)


def load_benchmark_stats(wedge: str) -> dict:
    return load_shipped_benchmark(wedge)


def load_learning_manifest(wedge: str) -> list[dict]:
    return load_shipped_manifest(wedge)


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
        "training_curve": load_shipped_training_curve(wedge),
        "benchmark": load_shipped_benchmark(wedge),
        "trained_benchmark": load_trained_benchmark(wedge),
        "baseline_benchmark": load_baseline_benchmark(wedge),
        "manifest": load_shipped_manifest(wedge),
        "hpo": load_hpo_results(wedge),
        "train_v2": load_train_v2_summary(),
        "model": shipped_model(wedge),
    }


def research_catalog_meta() -> dict:
    return {
        "baseline": load_baseline_manifest(),
        "hpo_summary": load_hpo_summary(),
        "train_v2": load_train_v2_summary(),
    }
