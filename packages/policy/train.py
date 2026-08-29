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
    checkpoint_name: str = "dueling_best.pt",
    validate_every: int = 200,
    val_episodes: int = 200,
) -> DQNAgent:
    out_dir = out_dir or Path("eval/checkpoints")
    out_dir.mkdir(parents=True, exist_ok=True)
    cfg = cfg or DQNConfig()
    agent = DQNAgent(cfg, get_device())
    env = RecoveryEnv(env_name=env_name, seed=seed, recovery_gamma=cfg.gamma)
    rewards = []
    curve = []
    best_val_net = float("-inf")
    best_path = out_dir / checkpoint_name

    for ep in range(episodes):
        env.rng = np.random.default_rng(seed + ep)
        env.customer.rng = env.rng
        stats = agent.run_episode(env, explore=True)
        rewards.append(stats["reward"])
        if (ep + 1) % validate_every == 0:
            avg = np.mean(rewards[-validate_every:])
            val = evaluate_policy(agent, "val", val_episodes, seed + ep + 1)
            val_net = val["net_recovered_value_inr"]
            curve.append(
                {
                    "episode": ep + 1,
                    "mean_train_reward": float(avg),
                    "epsilon": agent.epsilon(),
                    "val_net_recovered_value_inr": val_net,
                    "val_recovery_rate": val["recovery_rate"],
                    "val_duplicate_incidents": val["duplicate_incidents"],
                    "architecture": cfg.architecture,
                }
            )
            print(
                f"ep {ep+1}/{episodes} avg_reward={avg:.2f} "
                f"val_net={val_net:.2f} eps={agent.epsilon():.3f} arch={cfg.architecture}"
            )
            if val_net > best_val_net:
                best_val_net = val_net
                agent.save(best_path)

    ckpt_path = out_dir / f"{cfg.architecture}_{env_name}_seed{seed}.pt"
    agent.save(ckpt_path)
    export_policy_manifest(agent, out_dir / f"{cfg.architecture}_manifest.json")
    results_dir = out_dir.parent / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    (results_dir / "training_curve.json").write_text(json.dumps(curve, indent=2))

    if cfg.architecture == "dueling" and best_path.exists():
        from packages.policy.export_weights import export_weights

        export_weights(best_path)

    return agent


def export_policy_manifest(agent: DQNAgent, path: Path) -> None:
    from packages.simulator.actions import ACTION_NAMES

    manifest = {
        "policy_version": f"{agent.name}-v1-steps{agent.steps}",
        "architecture": agent.cfg.architecture,
        "obs_dim": OBS_DIM,
        "actions": ACTION_NAMES,
        "device_trained": str(agent.device),
        "train_steps": agent.steps,
        "gamma": agent.cfg.gamma,
        "use_per": agent.cfg.use_per,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2))


from packages.simulator.state import OBS_DIM


def run_benchmark(
    seeds: list[int] | None = None,
    episodes_per_seed: int = 500,
    out_dir: Path | None = None,
    checkpoint: Path | None = None,
) -> dict:
    from packages.policy.benchmark import run_multi_seed_benchmark, BenchmarkConfig

    seeds = seeds or list(range(42, 52))
    return run_multi_seed_benchmark(
        BenchmarkConfig(seeds=seeds, episodes_per_seed=episodes_per_seed, out_dir=out_dir or Path("eval/results")),
        checkpoint=checkpoint,
    )


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--train", action="store_true")
    p.add_argument("--eval", action="store_true")
    p.add_argument("--architecture", choices=["dueling", "standard"], default="dueling")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--episodes", type=int, default=1500)
    args = p.parse_args()
    ckpt = Path("eval/checkpoints/dueling_best.pt")
    if args.architecture == "standard":
        ckpt = Path("eval/checkpoints/standard_best.pt")
    if args.train:
        train_dqn(
            seed=args.seed,
            episodes=args.episodes,
            cfg=DQNConfig(architecture=args.architecture),
            checkpoint_name=f"{args.architecture}_best.pt",
        )
    if args.eval:
        run_benchmark(checkpoint=ckpt)
