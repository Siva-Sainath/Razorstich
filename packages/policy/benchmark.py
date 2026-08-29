from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from packages.policy.baselines import (
    AlwaysPaymentLinkPolicy,
    FailureRulesPolicy,
    evaluate_policy,
)
from packages.policy.dqn import DQNAgent, DQNConfig, get_device
from packages.policy.train import train_dqn


@dataclass
class BenchmarkConfig:
    seeds: list[int]
    episodes_per_seed: int = 500
    train_episodes: int = 800
    out_dir: Path = Path("eval/results")


def _mean_metric(rows: list[dict], key: str) -> float:
    return float(np.mean([r[key] for r in rows])) if rows else 0.0


def _sum_metric(rows: list[dict], key: str) -> float:
    return float(sum(r[key] for r in rows))


def run_multi_seed_benchmark(cfg: BenchmarkConfig, checkpoint: Path | None = None) -> dict:
    cfg.out_dir.mkdir(parents=True, exist_ok=True)
    results: dict = {
        "meta": {
            "seeds": cfg.seeds,
            "episodes_per_seed": cfg.episodes_per_seed,
        },
        "policies": {},
    }

    policy_builders = {
        "HeuristicFailureRules": lambda: FailureRulesPolicy(),
        "AlwaysPaymentLink": lambda: AlwaysPaymentLinkPolicy(),
    }

    for name, builder in policy_builders.items():
        rows = []
        for seed in cfg.seeds:
            row = evaluate_policy(builder(), "test", cfg.episodes_per_seed, seed)
            row["seed"] = seed
            rows.append(row)
        results["policies"][name] = rows

    dueling_ckpt = checkpoint or Path("eval/checkpoints/dueling_best.pt")
    if not dueling_ckpt.exists():
        agent = train_dqn(
            seed=cfg.seeds[0],
            episodes=cfg.train_episodes,
            cfg=DQNConfig(architecture="dueling"),
            out_dir=Path("eval/checkpoints"),
            checkpoint_name="dueling_best.pt",
        )
        agent.save(dueling_ckpt)

    for arch, ckpt_name, label in [
        ("dueling", "dueling_best.pt", "DuelingDoubleDQN"),
        ("standard", "standard_best.pt", "StandardDQN"),
    ]:
        ckpt = checkpoint if arch == "dueling" and checkpoint else Path(f"eval/checkpoints/{ckpt_name}")
        if not ckpt.exists() and arch == "standard":
            train_dqn(
                seed=cfg.seeds[0],
                episodes=cfg.train_episodes,
                cfg=DQNConfig(architecture="standard", use_per=False, hidden=128),
                out_dir=Path("eval/checkpoints"),
                checkpoint_name=ckpt_name,
            )
        if ckpt.exists():
            agent = DQNAgent.load(ckpt)
            rows = []
            for seed in cfg.seeds:
                row = evaluate_policy(agent, "test", cfg.episodes_per_seed, seed)
                row["seed"] = seed
                rows.append(row)
            results["policies"][label] = rows

    summary = _build_summary(results)
    results["summary"] = summary

    json_path = cfg.out_dir / "benchmark_multi_seed.json"
    json_path.write_text(json.dumps(results, indent=2))
    md_path = cfg.out_dir / "benchmark_comparison.md"
    md_path.write_text(_format_markdown(summary, results))
    return results


def _build_summary(results: dict) -> dict:
    summary = {}
    for policy, rows in results["policies"].items():
        summary[policy] = {
            "net_recovered_inr_total": _sum_metric(rows, "net_recovered_value_inr"),
            "net_recovered_inr_per_seed": _mean_metric(rows, "net_recovered_value_inr"),
            "gross_recovery_rate_pct": _mean_metric(rows, "recovery_rate") * 100,
            "avg_trust_budget_spent": _mean_metric(rows, "avg_contacts_used"),
            "upi_duplicate_collision_rate_pct": _mean_metric(rows, "upi_duplicate_collision_rate") * 100,
            "avg_time_to_recovery_hours": _mean_metric(rows, "avg_time_to_recovery_hours"),
        }
    rules = summary.get("HeuristicFailureRules", {}).get("net_recovered_inr_per_seed", 0)
    dueling = summary.get("DuelingDoubleDQN", {}).get("net_recovered_inr_per_seed", 0)
    dueling_rows = results["policies"].get("DuelingDoubleDQN", [])
    total_seeds = len(results.get("meta", {}).get("seeds", []))
    beats_rules = (
        sum(1 for r in dueling_rows if r["net_recovered_value_inr"] > _rules_net_for_seed(results, r["seed"]))
        if dueling_rows
        else 0
    )
    summary["acceptance"] = {
        "dueling_beats_rules_seeds": beats_rules,
        "dueling_beats_rules_total_seeds": total_seeds,
        "passes_10_of_10": beats_rules >= total_seeds and total_seeds >= 10,
        "incremental_net_vs_rules": dueling - rules,
    }
    return summary


def cfg_seeds(results: dict) -> list[int]:
    return results.get("meta", {}).get("seeds", [])


def _rules_net_for_seed(results: dict, seed: int) -> float:
    for row in results["policies"].get("HeuristicFailureRules", []):
        if row["seed"] == seed:
            return row["net_recovered_value_inr"]
    return 0.0


def _format_markdown(summary: dict, results: dict) -> str:
    lines = [
        "# RazorStitch Multi-Seed Benchmark\n",
        "_Simulated recovery — net economic value primary metric_\n",
        "",
        "| Policy | Net Recovered ₹/seed | Gross Recovery % | Avg Trust Spent | UPI Dup % | TTR (hrs) |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for policy, metrics in sorted(
        summary.items(),
        key=lambda item: -item[1].get("net_recovered_inr_per_seed", 0) if isinstance(item[1], dict) else 0,
    ):
        if policy == "acceptance":
            continue
        lines.append(
            f"| {policy} | {metrics['net_recovered_inr_per_seed']:,.0f} | "
            f"{metrics['gross_recovery_rate_pct']:.1f}% | {metrics['avg_trust_budget_spent']:.2f} | "
            f"{metrics['upi_duplicate_collision_rate_pct']:.2f}% | "
            f"{metrics['avg_time_to_recovery_hours']:.1f} |"
        )

    acc = summary.get("acceptance", {})
    lines.extend(
        [
            "",
            f"**Dueling beats rules on {acc.get('dueling_beats_rules_seeds', 0)}/"
            f"{acc.get('dueling_beats_rules_total_seeds', 0)} seeds** "
            f"(incremental net ₹/seed: {acc.get('incremental_net_vs_rules', 0):,.0f})",
        ]
    )
    return "\n".join(lines)


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="Multi-seed Dueling vs Standard vs heuristic benchmark")
    p.add_argument("--seeds", type=int, nargs="+", default=list(range(42, 52)))
    p.add_argument("--episodes", type=int, default=500)
    p.add_argument("--train-episodes", type=int, default=800)
    p.add_argument("--checkpoint", type=Path, default=None)
    args = p.parse_args()

    run_multi_seed_benchmark(
        BenchmarkConfig(
            seeds=args.seeds,
            episodes_per_seed=args.episodes,
            train_episodes=args.train_episodes,
        ),
        checkpoint=args.checkpoint,
    )
