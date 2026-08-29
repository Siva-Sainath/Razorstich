from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from packages.policy.dqn import DQNAgent
from packages.simulator.actions import RecoveryAction
from packages.simulator.wedges import WEDGE_NAMES
from packages.simulator.wedges.registry import make_env


def evaluate_wedge_policy(agent, wedge: str, episodes: int, seed: int) -> dict:
    env = make_env(wedge, seed)
    recovered_value = 0.0
    recovered_count = 0
    duplicates = 0
    contacts = 0
    comm_cost = 0.0

    for ep in range(episodes):
        if wedge == "checkout_failed":
            env.rng = np.random.default_rng(seed + ep)
            env.customer.rng = env.rng
        elif hasattr(env, "rng"):
            env.rng = np.random.default_rng(seed + ep)
        obs, info = env.reset()
        while True:
            mask = info["action_mask"]
            action = agent.select_action(obs, mask, explore=False)
            obs, _, done, trunc, info = env.step(action)
            if done or trunc:
                break
        state = env.state
        amount = getattr(state, "amount_inr", 0)
        contacts += getattr(state, "contacts_used", getattr(state, "contacts", 0))
        comm_cost += getattr(state, "total_comm_cost", getattr(state, "total_cost", 0))
        if getattr(state, "recovered", False):
            recovered_count += 1
            recovered_value += amount
        if getattr(state, "duplicate_incident", getattr(state, "duplicate", False)):
            duplicates += 1

    rate = recovered_count / max(episodes, 1)
    dup_penalty = duplicates * (recovered_value / max(recovered_count, 1) * 0.5 if recovered_count else 0)
    return {
        "policy": getattr(agent, "name", "dqn"),
        "episodes": episodes,
        "recovery_rate": rate,
        "gross_recovered_value_inr": recovered_value,
        "communication_cost_inr": comm_cost,
        "duplicate_penalty_inr": dup_penalty,
        "net_recovered_value_inr": recovered_value - comm_cost - dup_penalty,
        "duplicate_incidents": duplicates,
        "avg_contacts_used": contacts / max(episodes, 1),
        "seed": seed,
        "wedge": wedge,
    }


def benchmark_wedge(wedge: str, seeds: list[int] | None = None, episodes: int = 200) -> dict:
    seeds = seeds or [42, 1337, 2025]
    ckpt = Path(f"eval/checkpoints/dueling_{wedge}_best.pt")
    rows = []
    if ckpt.exists():
        agent = DQNAgent.load(ckpt)
        agent.name = f"dueling_{wedge}"
        for seed in seeds:
            rows.append(evaluate_wedge_policy(agent, wedge, episodes, seed))

    summary = {
        "wedge": wedge,
        "dueling_net_mean": float(np.mean([r["net_recovered_value_inr"] for r in rows])) if rows else None,
        "rows": rows,
    }
    out = Path("eval/results") / f"benchmark_{wedge}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--wedge", choices=WEDGE_NAMES, required=True)
    p.add_argument("--episodes", type=int, default=200)
    args = p.parse_args()
    print(json.dumps(benchmark_wedge(args.wedge, episodes=args.episodes), indent=2))
