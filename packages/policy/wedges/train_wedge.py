from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from packages.policy.dqn import DQNAgent, DQNConfig
from packages.policy.export_weights import export_weights
from packages.simulator.wedges import WEDGE_NAMES
from packages.simulator.wedges.registry import make_env


def train_wedge(
    wedge: str,
    episodes: int = 1000,
    seed: int = 42,
    out_dir: Path | None = None,
) -> DQNAgent:
    if wedge not in WEDGE_NAMES:
        raise ValueError(f"unknown wedge {wedge}; choose from {WEDGE_NAMES}")
    out_dir = out_dir or Path("eval/checkpoints")
    out_dir.mkdir(parents=True, exist_ok=True)
    cfg = DQNConfig(architecture="dueling", gamma=0.98, warmup_steps=500)
    agent = DQNAgent(cfg)
    env = make_env(wedge, seed)
    curve = []

    for episode in range(episodes):
        if wedge == "checkout_failed":
            env.rng = np.random.default_rng(seed + episode)
            env.customer.rng = env.rng
            stats = agent.run_episode(env, explore=True)
            curve.append({"episode": episode + 1, "reward": stats["reward"]})
            if (episode + 1) % 200 == 0:
                print(f"[{wedge}] ep {episode+1}/{episodes} reward={stats['reward']:.1f} eps={agent.epsilon():.3f}")
            continue

        if hasattr(env, "rng"):
            env.rng = np.random.default_rng(seed + episode)
        obs, info = env.reset()
        total_r = 0.0
        while True:
            mask = info["action_mask"]
            action = agent.select_action(obs, mask, explore=True)
            next_obs, reward, done, trunc, info = env.step(action)
            nmask = info["action_mask"]
            agent.buffer.push((obs, action, reward, next_obs, done or trunc, mask, nmask))
            agent.train_step()
            total_r += reward
            obs = next_obs
            if done or trunc:
                break
        if (episode + 1) % 200 == 0:
            curve.append({"episode": episode + 1, "reward": float(total_r), "epsilon": agent.epsilon()})
            print(f"[{wedge}] ep {episode+1}/{episodes} reward={total_r:.1f} eps={agent.epsilon():.3f}")

    checkpoint = out_dir / f"dueling_{wedge}_best.pt"
    agent.save(checkpoint)
    export_weights(checkpoint, wedge=wedge)
    results = Path("eval/results")
    results.mkdir(parents=True, exist_ok=True)
    (results / f"training_curve_{wedge}.json").write_text(json.dumps(curve, indent=2))
    return agent


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--wedge", choices=WEDGE_NAMES, required=True)
    parser.add_argument("--episodes", type=int, default=800)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    train_wedge(args.wedge, args.episodes, args.seed)
