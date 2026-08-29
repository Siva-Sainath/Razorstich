from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from packages.policy.baselines import BASELINES, evaluate_policy
from packages.policy.dqn import DQNAgent, DQNConfig, get_device
from packages.simulator.env import RecoveryEnv


def train_dqn(
    env_name: str = "train",
    seed: int = 42,
    episodes: int = 1500,
    cfg: DQNConfig | None = None,
    out_dir: Path | None = None,
) -> DQNAgent:
    out_dir = out_dir or Path("eval/checkpoints")
    out_dir.mkdir(parents=True, exist_ok=True)
    agent = DQNAgent(cfg, get_device())
    env = RecoveryEnv(env_name=env_name, seed=seed)
    rewards = []
    curve = []
    best_val_net = float("-inf")

    for ep in range(episodes):
        env.rng = np.random.default_rng(seed + ep)
        env.customer.rng = env.rng
        stats = agent.run_episode(env, explore=True)
        rewards.append(stats["reward"])
        if (ep + 1) % 200 == 0:
            avg = np.mean(rewards[-200:])
            val = evaluate_policy(agent, "val", 200, seed + ep + 1)
            val_net = val["net_recovered_value_inr"]
            curve.append(
                {
                    "episode": ep + 1,
                    "mean_train_reward": float(avg),
                    "epsilon": agent.epsilon(),
                    "val_net_recovered_value_inr": val_net,
                    "val_recovery_rate": val["recovery_rate"],
                    "val_duplicate_incidents": val["duplicate_incidents"],
                }
            )
            print(
                f"ep {ep+1}/{episodes} avg_reward={avg:.2f} "
                f"val_net={val_net:.2f} eps={agent.epsilon():.3f}"
            )
            if val_net > best_val_net:
                best_val_net = val_net
                agent.save(out_dir / "dqn_best.pt")

    ckpt_path = out_dir / f"dqn_{env_name}_seed{seed}.pt"
    agent.save(ckpt_path)
    export_policy_manifest(agent, out_dir / "policy_manifest.json")
    (out_dir.parent / "results" / "training_curve.json").parent.mkdir(
        parents=True, exist_ok=True
    )
    (out_dir.parent / "results" / "training_curve.json").write_text(
        json.dumps(curve, indent=2)
    )
    return agent


def export_policy_manifest(agent: DQNAgent, path: Path) -> None:
    from packages.simulator.actions import ACTION_NAMES

    manifest = {
        "policy_version": f"dqn-v0-seed{agent.steps}",
        "obs_dim": agent.policy.net[0].in_features,
        "actions": ACTION_NAMES,
        "device_trained": str(agent.device),
        "train_steps": agent.steps,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2))


def run_benchmark(
    seeds: list[int] | None = None,
    episodes_per_seed: int = 500,
    out_dir: Path | None = None,
    checkpoint: Path | None = None,
) -> dict:
    seeds = seeds or [42, 1337, 2025]
    out_dir = out_dir or Path("eval/results")
    out_dir.mkdir(parents=True, exist_ok=True)
    results = {
        "baselines": [],
        "dqn": [],
        "meta": {"episodes_per_seed": episodes_per_seed},
    }

    for seed in seeds:
        for policy in BASELINES:
            r = evaluate_policy(policy, "test", episodes_per_seed, seed)
            r["seed"] = seed
            results["baselines"].append(r)
        if checkpoint and checkpoint.exists():
            agent = DQNAgent.load(checkpoint)
            agent.name = "dqn"
            r = evaluate_policy(agent, "test", episodes_per_seed, seed)
            r["seed"] = seed
            results["dqn"].append(r)

    out_path = out_dir / "benchmark.json"
    out_path.write_text(json.dumps(results, indent=2))
    write_tables_md(results, out_dir / "tables.md")
    return results


def write_tables_md(results: dict, path: Path) -> None:
    lines = ["# RazorStitch simulated recovery benchmark\n", "_simulated recovered value — not Test Mode_\n"]
    by_policy: dict[str, list] = {}
    for row in results["baselines"]:
        by_policy.setdefault(row["policy"], []).append(row)
    for row in results.get("dqn", []):
        by_policy.setdefault("dqn", []).append(row)

    lines.append("| Policy | Net recovered ₹ (sum/seeds) | Gross recovered ₹ | Recovery rate | Duplicates |")
    lines.append("|---|---:|---:|---:|---:|")
    for name, rows in sorted(
        by_policy.items(),
        key=lambda item: -np.mean([r["net_recovered_value_inr"] for r in item[1]]),
    ):
        rate = np.mean([r["recovery_rate"] for r in rows])
        gross = sum(r["gross_recovered_value_inr"] for r in rows)
        net = sum(r["net_recovered_value_inr"] for r in rows)
        dups = sum(r["duplicate_incidents"] for r in rows)
        lines.append(f"| {name} | {net:,.0f} | {gross:,.0f} | {rate:.2%} | {dups} |")

    if "failure_rules" in by_policy and "dqn" in by_policy:
        base = np.mean([r["net_recovered_value_inr"] for r in by_policy["failure_rules"]])
        dqn = np.mean([r["net_recovered_value_inr"] for r in by_policy["dqn"]])
        lines.append(f"\n**Incremental net value vs failure_rules:** {dqn - base:,.0f} INR/seed\n")

    path.write_text("\n".join(lines))


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--train", action="store_true")
    p.add_argument("--eval", action="store_true")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--episodes", type=int, default=1500)
    args = p.parse_args()
    ckpt = Path("eval/checkpoints/dqn_best.pt")
    if not ckpt.exists():
        ckpt = Path(f"eval/checkpoints/dqn_train_seed{args.seed}.pt")
    if args.train:
        train_dqn(seed=args.seed, episodes=args.episodes)
    if args.eval:
        run_benchmark(checkpoint=ckpt)
