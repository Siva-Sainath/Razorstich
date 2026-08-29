from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass
class BenchmarkStats:
    mean: float
    median: float
    std: float
    ci95_low: float
    ci95_high: float
    worst: float
    best: float
    seeds_beaten: int
    seeds_total: int
    values: list[float]


def bootstrap_ci(values: list[float], n_bootstrap: int = 2000, alpha: float = 0.05, seed: int = 0) -> tuple[float, float]:
    if not values:
        return 0.0, 0.0
    rng = np.random.default_rng(seed)
    arr = np.array(values, dtype=np.float64)
    means = []
    for _ in range(n_bootstrap):
        sample = rng.choice(arr, size=len(arr), replace=True)
        means.append(float(sample.mean()))
    lo = float(np.percentile(means, 100 * alpha / 2))
    hi = float(np.percentile(means, 100 * (1 - alpha / 2)))
    return lo, hi


def summarize(values: list[float], baseline_values: list[float] | None = None) -> BenchmarkStats:
    arr = np.array(values, dtype=np.float64)
    ci_lo, ci_hi = bootstrap_ci(values)
    seeds_beaten = 0
    seeds_total = len(values)
    if baseline_values and len(baseline_values) == len(values):
        seeds_beaten = sum(1 for a, b in zip(values, baseline_values) if a > b)
    return BenchmarkStats(
        mean=float(arr.mean()) if len(arr) else 0.0,
        median=float(np.median(arr)) if len(arr) else 0.0,
        std=float(arr.std()) if len(arr) else 0.0,
        ci95_low=ci_lo,
        ci95_high=ci_hi,
        worst=float(arr.min()) if len(arr) else 0.0,
        best=float(arr.max()) if len(arr) else 0.0,
        seeds_beaten=seeds_beaten,
        seeds_total=seeds_total,
        values=values,
    )


def stats_to_dict(s: BenchmarkStats) -> dict:
    return {
        "mean": s.mean,
        "median": s.median,
        "std": s.std,
        "ci95_low": s.ci95_low,
        "ci95_high": s.ci95_high,
        "worst": s.worst,
        "best": s.best,
        "seeds_beaten": s.seeds_beaten,
        "seeds_total": s.seeds_total,
        "values": s.values,
    }


def passes_acceptance(
    policy_stats: BenchmarkStats,
    baseline_stats: BenchmarkStats,
    min_improvement_pct: float = 10.0,
) -> dict:
    if baseline_stats.mean == 0:
        improved = policy_stats.mean > 0
    else:
        improved = policy_stats.mean >= baseline_stats.mean * (1 + min_improvement_pct / 100)

    ci_non_overlap = policy_stats.ci95_low > baseline_stats.ci95_high
    return {
        "pass": improved and (ci_non_overlap or policy_stats.seeds_beaten >= max(1, policy_stats.seeds_total * 0.6)),
        "mean_improvement_pct": (
            (policy_stats.mean - baseline_stats.mean) / abs(baseline_stats.mean) * 100
            if baseline_stats.mean
            else None
        ),
        "seeds_beaten_report": f"{policy_stats.seeds_beaten}/{policy_stats.seeds_total}",
        "policy": stats_to_dict(policy_stats),
        "baseline": stats_to_dict(baseline_stats),
        "ci_non_overlap": ci_non_overlap,
    }
