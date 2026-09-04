"""Shipped RL eval artifacts — the numbers the website must display.

v2 trained all four wedges. cart_abandon and subscription_failed were rolled
back to v1 weights. Checkout kept v2. Invoice v2 is held for parity review.
Display the benchmark that matches the JSON weights in packages/policy/weights/.
"""

from __future__ import annotations

import json
from pathlib import Path

from agents_registry import get_agent

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "eval" / "results"
BASELINE_RESULTS = ROOT / "eval" / "baselines" / "v1" / "results"
BASELINE_MANIFEST = ROOT / "eval" / "baselines" / "v1" / "manifest.json"


def _read_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text())


def load_train_v2_summary() -> dict:
    return _read_json(RESULTS / "train_v2_summary.json", {})


def load_baseline_manifest() -> dict:
    return _read_json(BASELINE_MANIFEST, {})


def load_hpo_summary() -> dict:
    return _read_json(RESULTS / "hpo_summary.json", {})


def shipped_model(wedge: str) -> dict:
    get_agent(wedge)
    v2 = load_train_v2_summary()
    restored = set(v2.get("regressions_restored_to_v1") or [])
    kept = set(v2.get("v2_kept") or [])
    if wedge in restored:
        return {
            "gen": "v1",
            "shipped": True,
            "label": "v1 restored after v2 regression",
            "episodes_trained": 10000,
            "artifact": "eval/baselines/v1",
        }
    if wedge in kept:
        return {
            "gen": "v2",
            "shipped": True,
            "label": "v2 HPO-tuned · 20k episodes",
            "episodes_trained": int(v2.get("episodes") or 20000),
            "artifact": "eval/results",
        }
    if wedge == "invoice_overdue":
        return {
            "gen": "v2",
            "shipped": False,
            "label": "v2 trained · inference parity review",
            "episodes_trained": int(v2.get("episodes") or 20000),
            "artifact": "eval/results",
        }
    return {
        "gen": "v1",
        "shipped": True,
        "label": "v1 checkpoint",
        "episodes_trained": 10000,
        "artifact": "eval/results",
    }


def _load_stats(directory: Path, wedge: str) -> dict:
    return _read_json(directory / f"benchmark_{wedge}_stats.json", {})


def load_trained_benchmark(wedge: str) -> dict:
    get_agent(wedge)
    return _load_stats(RESULTS, wedge)


def load_baseline_benchmark(wedge: str) -> dict:
    get_agent(wedge)
    return _load_stats(BASELINE_RESULTS, wedge)


def load_shipped_benchmark(wedge: str) -> dict:
    """Benchmark for the weights actually served in the demo."""
    model = shipped_model(wedge)
    if model["artifact"] == "eval/baselines/v1":
        stats = load_baseline_benchmark(wedge) or load_trained_benchmark(wedge)
    else:
        stats = load_trained_benchmark(wedge) or load_baseline_benchmark(wedge)
    if not stats:
        return {"model": model}
    out = dict(stats)
    out["model"] = model
    return out


def load_shipped_training_curve(wedge: str) -> list:
    get_agent(wedge)
    model = shipped_model(wedge)
    directory = BASELINE_RESULTS if model["artifact"] == "eval/baselines/v1" else RESULTS
    curve = _read_json(directory / f"training_curve_{wedge}.json", [])
    if curve:
        return curve
    return _read_json(RESULTS / f"training_curve_{wedge}.json", [])


def load_shipped_manifest(wedge: str) -> list:
    get_agent(wedge)
    model = shipped_model(wedge)
    directory = BASELINE_RESULTS if model["artifact"] == "eval/baselines/v1" else RESULTS
    rows = _read_json(directory / f"learning_manifest_{wedge}.json", [])
    if rows:
        return rows
    return _read_json(RESULTS / f"learning_manifest_{wedge}.json", [])


def load_hpo_results(wedge: str) -> dict:
    get_agent(wedge)
    return _read_json(RESULTS / f"hpo_{wedge}.json", {})
