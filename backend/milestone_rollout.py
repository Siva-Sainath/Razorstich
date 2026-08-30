"""Replay a fixed validation scenario with an intermediate DQN checkpoint."""

from __future__ import annotations

from pathlib import Path

from agents_registry import get_agent
from episode_builder import _init_checkout_env, _init_wedge_env
from packages.policy.dqn import DQNAgent
from packages.simulator.actions import ACTION_NAMES
from packages.simulator.tasks.scenarios import load_val_scenarios
from packages.simulator.wedges.registry import make_env

ROOT = Path(__file__).resolve().parents[1]


def _scenario(wedge: str, case_id: str) -> dict:
    for row in load_val_scenarios(wedge):
        if row["case_id"] == case_id:
            return row
    raise KeyError(f"unknown validation case {case_id} for {wedge}")


def rollout_milestone(wedge: str, episode: int, scenario_id: str) -> dict:
    agent_meta = get_agent(wedge)
    checkpoint = ROOT / "eval" / "checkpoints" / "milestones" / f"{wedge}_ep{episode}.pt"
    if not checkpoint.exists():
        raise FileNotFoundError(f"milestone checkpoint not found: {checkpoint}")

    scenario = _scenario(wedge, scenario_id)
    agent = DQNAgent.load(checkpoint)
    env = make_env(wedge, seed=42, env_name="val")
    if wedge == "checkout_failed":
        obs, info = _init_checkout_env(env, scenario, 42)
    else:
        obs, info = _init_wedge_env(env, scenario, 42)

    steps = []
    total_reward = 0.0
    while len(steps) < agent_meta["max_steps"]:
        action = agent.select_action(obs, info["action_mask"], explore=False)
        obs, reward, done, trunc, info = env.step(action)
        total_reward += reward
        state = env.state
        steps.append(
            {
                "tick": len(steps) + 1,
                "action": ACTION_NAMES[action],
                "hours": getattr(state, "hours_since_failure", getattr(state, "hours", 0)),
                "contacts": getattr(state, "contacts_used", getattr(state, "contacts", 0)),
                "recovered": bool(getattr(state, "recovered", False)),
            }
        )
        if done or trunc:
            break

    state = env.state
    amount = float(getattr(state, "amount_inr", scenario.get("amount_inr", 0)))
    cost = float(getattr(state, "total_comm_cost", getattr(state, "total_cost", 0)))
    duplicate = bool(getattr(state, "duplicate_incident", getattr(state, "duplicate", False)))
    net_inr = (amount if state.recovered else 0) - cost - (amount * 0.5 if duplicate else 0)
    return {
        "episode": episode,
        "checkpoint": str(checkpoint.relative_to(ROOT)),
        "epsilon": agent.epsilon(),
        "case_id": scenario_id,
        "recovered": bool(state.recovered),
        "net_inr": net_inr,
        "reward": total_reward,
        "steps": steps,
    }
