"""
bandit_stub.py — LinUCB contextual-bandit baseline for RazorStitch (E6).

This is an *optional* sketch (<80 lines) used only in experiment E6 to
establish a lower bound on what a stateless arm-selection model can achieve.
It is NOT used in production; the deployed policy is DQN (packages/policy/dqn.py).

Algorithm: Disjoint LinUCB (Li et al., 2010).
  For each action a:
      A_a  ← d×d identity  (feature covariance)
      b_a  ← d-vector zero (feature-reward correlation)
      θ_a  = A_a⁻¹ b_a    (estimated weight vector)
      UCB_a = θ_aᵀ x + α √(xᵀ A_a⁻¹ x)

Context vector x is the raw observation from RecoveryEnv (OBS_DIM features).
Invalid actions (mask=False) are given UCB = -∞ so they are never selected.
"""
from __future__ import annotations

import numpy as np

from packages.simulator.actions import NUM_ACTIONS
from packages.simulator.state import OBS_DIM


class LinUCBPolicy:
    """Disjoint LinUCB — fits a separate linear model per action arm."""

    name = "linucb"

    def __init__(self, alpha: float = 1.0, d: int = OBS_DIM) -> None:
        self.alpha = alpha
        self.d = d
        # Per-arm parameters
        self.A = [np.eye(d) for _ in range(NUM_ACTIONS)]   # d×d
        self.b = [np.zeros(d) for _ in range(NUM_ACTIONS)] # d

    # ------------------------------------------------------------------
    # Policy interface (compatible with baselines.evaluate_policy)
    # ------------------------------------------------------------------

    def select_action(self, obs: np.ndarray, mask: np.ndarray, info: dict) -> int:
        x = obs.astype(float)
        ucb = np.full(NUM_ACTIONS, -np.inf)
        for a in range(NUM_ACTIONS):
            if not mask[a]:
                continue
            A_inv = np.linalg.inv(self.A[a])
            theta  = A_inv @ self.b[a]
            bonus  = self.alpha * np.sqrt(x @ A_inv @ x)
            ucb[a] = float(theta @ x) + bonus
        return int(np.argmax(ucb))

    def update(self, obs: np.ndarray, action: int, reward: float) -> None:
        """Online update — call after each env.step() if you want an adaptive bandit."""
        x = obs.astype(float)
        self.A[action] += np.outer(x, x)
        self.b[action] += reward * x

    # ------------------------------------------------------------------
    # Convenience: run a full evaluation episode with optional online updates
    # ------------------------------------------------------------------

    def run_episode(self, env, update: bool = False) -> dict:
        """Single episode rollout.  update=True enables online LinUCB learning."""
        obs, info = env.reset()
        total_r = 0.0
        while True:
            mask   = info["action_mask"]
            action = self.select_action(obs, mask, info)
            next_obs, reward, term, trunc, info = env.step(action)
            if update:
                self.update(obs, action, reward)
            total_r += reward
            obs = next_obs
            if term or trunc:
                break
        return {"reward": total_r}
