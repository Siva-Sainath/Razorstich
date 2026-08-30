from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from packages.policy.baselines import FailureRulesPolicy
from packages.policy.dqn import DQNAgent, DQNConfig, get_device
from packages.policy.eval.stats import passes_acceptance, stats_to_dict, summarize
from packages.policy.export_weights import export_dueling_weights, export_weights
from packages.simulator.tasks.scenarios import load_val_scenarios
from packages.simulator.wedges import WEDGE_NAMES
from packages.simulator.wedges.registry import make_env


def scale_config_for_episodes(cfg: DQNConfig, episodes: int) -> DQNConfig:
    """Scale exploration/LR schedules when training longer than 10k episodes."""
    if episodes <= 10_000:
        return cfg
    scale = episodes / 10_000
    return DQNConfig(
        architecture=cfg.architecture,
        hidden=cfg.hidden,
        lr=cfg.lr,
        gamma=cfg.gamma,
        epsilon_start=cfg.epsilon_start,
        epsilon_end=cfg.epsilon_end,
        epsilon_decay_steps=int(cfg.epsilon_decay_steps * scale),
        buffer_size=cfg.buffer_size,
        batch_size=cfg.batch_size,
        warmup_steps=cfg.warmup_steps,
        target_update=cfg.target_update,
        polyak_tau=cfg.polyak_tau,
        use_per=cfg.use_per,
        per_alpha=cfg.per_alpha,
        per_beta_start=cfg.per_beta_start,
        per_beta_frames=int(cfg.per_beta_frames * scale),
        train_steps=int(cfg.train_steps * scale),
        use_cosine_lr=cfg.use_cosine_lr,
    )


def build_config_from_dict(data: dict, episodes: int = 10_000) -> DQNConfig:
    cfg = DQNConfig(
        architecture=data.get("architecture", "dueling"),
        hidden=int(data.get("hidden", 256)),
        lr=float(data.get("lr", 1e-3)),
        gamma=float(data.get("gamma", 0.98)),
        epsilon_start=float(data.get("epsilon_start", 1.0)),
        epsilon_end=float(data.get("epsilon_end", 0.05)),
        epsilon_decay_steps=int(data.get("epsilon_decay_steps", 50_000)),
        buffer_size=int(data.get("buffer_size", 100_000)),
        batch_size=int(data.get("batch_size", 128)),
        warmup_steps=int(data.get("warmup_steps", 2000)),
        target_update=int(data.get("target_update", 0)),
        polyak_tau=float(data.get("polyak_tau", 0.005)),
        use_per=bool(data.get("use_per", True)),
        per_alpha=float(data.get("per_alpha", 0.6)),
        per_beta_start=float(data.get("per_beta_start", 0.4)),
        per_beta_frames=int(data.get("per_beta_frames", 200_000)),
        train_steps=int(data.get("train_steps", 100_000)),
        use_cosine_lr=bool(data.get("use_cosine_lr", True)),
    )
    return scale_config_for_episodes(cfg, episodes)


def config_to_dict(cfg: DQNConfig) -> dict:
    return {
        "architecture": cfg.architecture,
        "hidden": cfg.hidden,
        "lr": cfg.lr,
        "gamma": cfg.gamma,
        "epsilon_start": cfg.epsilon_start,
        "epsilon_end": cfg.epsilon_end,
        "epsilon_decay_steps": cfg.epsilon_decay_steps,
        "buffer_size": cfg.buffer_size,
        "batch_size": cfg.batch_size,
        "warmup_steps": cfg.warmup_steps,
        "target_update": cfg.target_update,
        "polyak_tau": cfg.polyak_tau,
        "use_per": cfg.use_per,
        "per_alpha": cfg.per_alpha,
        "per_beta_start": cfg.per_beta_start,
        "per_beta_frames": cfg.per_beta_frames,
        "train_steps": cfg.train_steps,
        "use_cosine_lr": cfg.use_cosine_lr,
    }


def build_config_from_args(args) -> DQNConfig:
    if getattr(args, "config_json", None):
        data = json.loads(Path(args.config_json).read_text())
        return build_config_from_dict(data, episodes=args.episodes)

    cfg = DQNConfig(architecture="dueling", gamma=0.98, warmup_steps=2000)
    overrides = {
        "lr": getattr(args, "lr", None),
        "batch_size": getattr(args, "batch_size", None),
        "gamma": getattr(args, "gamma", None),
        "warmup_steps": getattr(args, "warmup_steps", None),
        "epsilon_decay_steps": getattr(args, "epsilon_decay_steps", None),
        "train_steps": getattr(args, "train_steps", None),
        "per_alpha": getattr(args, "per_alpha", None),
        "hidden": getattr(args, "hidden", None),
        "polyak_tau": getattr(args, "polyak_tau", None),
        "per_beta_frames": getattr(args, "per_beta_frames", None),
    }
    for key, value in overrides.items():
        if value is not None:
            setattr(cfg, key, value)
    return scale_config_for_episodes(cfg, args.episodes)


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
    save_milestones: list[int] | None = None,
    export_weights: bool = True,
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
    milestone_set = set(save_milestones or [])
    milestone_dir = out_dir / "milestones"
    milestone_manifest: list[dict] = []
    if milestone_set:
        milestone_dir.mkdir(parents=True, exist_ok=True)

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
            completed_episode = episode + 1
            curve.append(
                {
                    "episode": completed_episode,
                    "train_reward": stats["reward"],
                    "val_net_inr": val_net,
                    "rollout_net_inr": rollout["net_recovered_value_inr"],
                    "epsilon": agent.epsilon(),
                }
            )
            if completed_episode in milestone_set:
                milestone_path = milestone_dir / f"{wedge}_ep{completed_episode}.pt"
                agent.save(milestone_path)
                milestone_manifest.append(
                    {
                        "episode": completed_episode,
                        "checkpoint": str(milestone_path),
                        "val_net_inr": val_net,
                        "rollout_net_inr": rollout["net_recovered_value_inr"],
                        "epsilon": agent.epsilon(),
                    }
                )
                (results_dir := Path("eval/results")).mkdir(parents=True, exist_ok=True)
                (results_dir / f"learning_manifest_{wedge}.json").write_text(
                    json.dumps(milestone_manifest, indent=2)
                )
            print(
                f"[{wedge}] ep {episode+1}/{episodes} "
                f"train_r={stats['reward']:.1f} val_net={val_net:.0f} "
                f"eps={agent.epsilon():.3f}"
            )
            if val_net > best_val_net:
                best_val_net = val_net
                agent.save(best_path)
                if export_weights:
                    _export_agent_weights(agent, wedge)

    agent.save(best_path)
    if export_weights:
        _export_agent_weights(agent, wedge)
    results = Path("eval/results")
    results.mkdir(parents=True, exist_ok=True)
    (results / f"training_curve_{wedge}.json").write_text(json.dumps(curve, indent=2))
    if milestone_set:
        (results / f"learning_manifest_{wedge}.json").write_text(
            json.dumps(milestone_manifest, indent=2)
        )
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
    out.write_text(json.dumps(report, indent=2))
    return report


def serialize_benchmark_report(report: dict) -> dict:
    """Return a JSON-serializable copy of a benchmark report."""
    out = dict(report)
    acceptance = out.get("acceptance")
    if isinstance(acceptance, dict):
        serialized = dict(acceptance)
        for key in ("policy", "baseline"):
            val = serialized.get(key)
            if hasattr(val, "mean"):
                serialized[key] = stats_to_dict(val)
        out["acceptance"] = serialized
    return out

if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="Unified wedge training and benchmarking")
    p.add_argument("--wedge", choices=WEDGE_NAMES, required=True)
    p.add_argument("--episodes", type=int, default=10_000)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--train", action="store_true")
    p.add_argument("--benchmark", action="store_true")
    p.add_argument("--benchmark-episodes", type=int, default=200)
    p.add_argument("--validate-every", type=int, default=500)
    p.add_argument("--config-json", type=Path, help="Path to DQNConfig JSON for training")
    p.add_argument("--lr", type=float)
    p.add_argument("--batch-size", type=int)
    p.add_argument("--gamma", type=float)
    p.add_argument("--warmup-steps", type=int)
    p.add_argument("--epsilon-decay-steps", type=int)
    p.add_argument("--train-steps", type=int)
    p.add_argument("--per-alpha", type=float)
    p.add_argument("--per-beta-frames", type=int)
    p.add_argument("--hidden", type=int)
    p.add_argument("--polyak-tau", type=float)
    p.add_argument(
        "--save-milestones",
        nargs="?",
        const="500,2000,5000,7500,10000",
        help="Save checkpoints at comma-separated validation episodes.",
    )
    args = p.parse_args()

    if args.train:
        milestones = (
            [int(value) for value in args.save_milestones.split(",") if value.strip()]
            if args.save_milestones
            else None
        )
        cfg = build_config_from_args(args)
        train_wedge(
            args.wedge,
            episodes=args.episodes,
            seed=args.seed,
            validate_every=args.validate_every,
            cfg=cfg,
            save_milestones=milestones,
        )
    if args.benchmark:
        report = benchmark_wedge_statistical(args.wedge, episodes=args.benchmark_episodes)
        print(json.dumps(serialize_benchmark_report(report), indent=2))
