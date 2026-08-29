from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from packages.policy.baselines import FailureRulesPolicy
from packages.policy.dqn import DQNAgent, DQNConfig, get_device
from packages.policy.eval.stats import passes_acceptance, summarize
from packages.policy.export_weights import export_dueling_weights, export_weights
from packages.simulator.tasks.scenarios import load_val_scenarios
from packages.simulator.wedges import WEDGE_NAMES
from packages.simulator.wedges.registry import make_env


def _export_agent_weights(agent: DQNAgent, wedge: str) -> None:
    out_path = Path(f"packages/policy/weights/{wedge}.json")
    payload = export_dueling_weights(agent, out_path)
    payload["wedge"] = wedge
    web_path = Path(f"apps/web/src/data/weights/{wedge}.json")
    web_path.parent.mkdir(parents=True, exist_ok=True)
    web_path.write_text(json.dumps(payload, separators=(",", ":")))
    if wedge == "checkout_failed":
        Path("apps/web/src/data/weights.json").write_text(json.dumps(payload, separators=(",", ":")))
        Path("packages/policy/src/weights.json").write_text(json.dumps(payload, separators=(",", ":")))


def _run_episode_on_scenarios(agent, wedge: str, scenarios: list[dict], explore: bool = False) -> list[dict]:
    env = make_env(wedge, seed=0)
    rows = []
    for scenario in scenarios:
        if wedge == "checkout_failed":
            env.rng = np.random.default_rng(hash(scenario["case_id"]) % 2**31)
            env.customer.rng = env.rng
            obs, info = env.reset()
        else:
            obs, info = env.reset(scenario=scenario)

        total_r = 0.0
        while True:
            mask = info["action_mask"]
            if hasattr(agent, "select_action"):
                action = agent.select_action(obs, mask, explore=explore)
            else:
                action = agent(obs, mask)
            obs, reward, done, trunc, info = env.step(action)
            total_r += reward
            if done or trunc:
                break

        state = env.state
        amount = float(getattr(state, "amount_inr", 0))
        recovered = bool(getattr(state, "recovered", False))
        cost = float(getattr(state, "total_comm_cost", getattr(state, "total_cost", 0)))
        dup = bool(getattr(state, "duplicate_incident", getattr(state, "duplicate", False)))
        net = (amount if recovered else 0) - cost - (amount * 0.5 if dup else 0)
        rows.append(
            {
                "case_id": scenario.get("case_id"),
                "recovered": recovered,
                "net_inr": net,
                "reward": total_r,
            }
        )
    return rows


def evaluate_val_net(agent, wedge: str) -> float:
    scenarios = load_val_scenarios(wedge)
    rows = _run_episode_on_scenarios(agent, wedge, scenarios, explore=False)
    return float(sum(r["net_inr"] for r in rows))


def evaluate_wedge_rollout(agent, wedge: str, episodes: int, seed: int) -> dict:
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
            if hasattr(agent, "select_action"):
                if isinstance(agent, FailureRulesPolicy):
                    action = agent.select_action(obs, mask, info)
                else:
                    action = agent.select_action(obs, mask, explore=False)
            else:
                action = agent(obs, mask)
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

    dup_penalty = duplicates * (recovered_value / max(recovered_count, 1) * 0.5 if recovered_count else 0)
    return {
        "net_recovered_value_inr": recovered_value - comm_cost - dup_penalty,
        "recovery_rate": recovered_count / max(episodes, 1),
        "duplicate_incidents": duplicates,
        "avg_contacts_used": contacts / max(episodes, 1),
        "seed": seed,
        "wedge": wedge,
    }


def train_wedge(
    wedge: str,
    episodes: int = 10_000,
    seed: int = 42,
    seeds: list[int] | None = None,
    validate_every: int = 500,
    val_rollout_episodes: int = 100,
    out_dir: Path | None = None,
    cfg: DQNConfig | None = None,
) -> DQNAgent:
    if wedge not in WEDGE_NAMES:
        raise ValueError(f"unknown wedge {wedge}; choose from {WEDGE_NAMES}")

    out_dir = out_dir or Path("eval/checkpoints")
    out_dir.mkdir(parents=True, exist_ok=True)
    cfg = cfg or DQNConfig(architecture="dueling", gamma=0.98, warmup_steps=2000)
    agent = DQNAgent(cfg, get_device())
    env = make_env(wedge, seed)
    curve = []
    best_val_net = float("-inf")
    best_path = out_dir / f"dueling_{wedge}_best.pt"

    for episode in range(episodes):
        if wedge == "checkout_failed":
            env.rng = np.random.default_rng(seed + episode)
            env.customer.rng = env.rng
            stats = agent.run_episode(env, explore=True)
        else:
            if hasattr(env, "rng"):
                env.rng = np.random.default_rng(seed + episode)
            obs, info = env.reset()
            total_r = 0.0
            while True:
                mask = info["action_mask"]
                action = agent.select_action(obs, mask, explore=True)
                next_obs, reward, done, trunc, info = env.step(action)
                nmask = info.get("action_mask", mask)
                agent.buffer.push((obs, action, reward, next_obs, done or trunc, mask, nmask))
                agent.train_step()
                total_r += reward
                obs = next_obs
                if done or trunc:
                    break
            stats = {"reward": total_r}

        if (episode + 1) % validate_every == 0:
            val_net = evaluate_val_net(agent, wedge)
            rollout = evaluate_wedge_rollout(agent, wedge, val_rollout_episodes, seed + episode)
            curve.append(
                {
                    "episode": episode + 1,
                    "train_reward": stats["reward"],
                    "val_net_inr": val_net,
                    "rollout_net_inr": rollout["net_recovered_value_inr"],
                    "epsilon": agent.epsilon(),
                }
            )
            print(
                f"[{wedge}] ep {episode+1}/{episodes} "
                f"train_r={stats['reward']:.1f} val_net={val_net:.0f} "
                f"eps={agent.epsilon():.3f}"
            )
            if val_net > best_val_net:
                best_val_net = val_net
                agent.save(best_path)
                _export_agent_weights(agent, wedge)

    agent.save(best_path)
    _export_agent_weights(agent, wedge)
    results = Path("eval/results")
    results.mkdir(parents=True, exist_ok=True)
    (results / f"training_curve_{wedge}.json").write_text(json.dumps(curve, indent=2))
    return agent


def benchmark_wedge_statistical(
    wedge: str,
    seeds: list[int] | None = None,
    episodes: int = 200,
    checkpoint: Path | None = None,
) -> dict:
    seeds = seeds or list(range(42, 52))
    ckpt = checkpoint or Path(f"eval/checkpoints/dueling_{wedge}_best.pt")
    if not ckpt.exists():
        return {"error": f"checkpoint missing: {ckpt}"}

    agent = DQNAgent.load(ckpt)
    agent.name = f"dueling_{wedge}"

    policy_vals = []
    baseline_vals = []
    for seed in seeds:
        policy_vals.append(evaluate_wedge_rollout(agent, wedge, episodes, seed)["net_recovered_value_inr"])
        baseline_vals.append(
            evaluate_wedge_rollout(FailureRulesPolicy(), wedge, episodes, seed)["net_recovered_value_inr"]
        )

    policy_stats = summarize(policy_vals, baseline_vals)
    baseline_stats = summarize(baseline_vals)
    acceptance = passes_acceptance(policy_stats, baseline_stats)

    report = {
        "wedge": wedge,
        "checkpoint": str(ckpt),
        "episodes_per_seed": episodes,
        "seeds": seeds,
        "policy_mean_net_inr": policy_stats.mean,
        "policy_median_net_inr": policy_stats.median,
        "policy_ci95": [policy_stats.ci95_low, policy_stats.ci95_high],
        "policy_worst_seed_inr": policy_stats.worst,
        "baseline_mean_net_inr": baseline_stats.mean,
        "baseline_ci95": [baseline_stats.ci95_low, baseline_stats.ci95_high],
        "seeds_beaten": f"{policy_stats.seeds_beaten}/{policy_stats.seeds_total}",
        "acceptance": acceptance,
    }
    out = Path("eval/results") / f"benchmark_{wedge}_stats.json"
    out.write_text(json.dumps(report, indent=2, default=str))
    return report


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="Unified wedge training and benchmarking")
    p.add_argument("--wedge", choices=WEDGE_NAMES, required=True)
    p.add_argument("--episodes", type=int, default=10_000)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--train", action="store_true")
    p.add_argument("--benchmark", action="store_true")
    p.add_argument("--benchmark-episodes", type=int, default=200)
    args = p.parse_args()

    if args.train:
        train_wedge(args.wedge, episodes=args.episodes, seed=args.seed)
    if args.benchmark:
        print(json.dumps(benchmark_wedge_statistical(args.wedge, episodes=args.benchmark_episodes), indent=2))
