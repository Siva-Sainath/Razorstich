from __future__ import annotations

import numpy as np

from packages.simulator.actions import ACTION_COST_INR, RecoveryAction
from packages.simulator.customer_model import ERROR_SOURCES, FAILURE_REASONS, CustomerResponseModel
from packages.simulator.state import OBS_DIM, EpisodeState, action_mask


class RecoveryEnv:
    """Gymnasium-style recovery MDP. Max horizon 72 hours (12 steps × 6h)."""

    metadata = {"render_modes": []}

    def __init__(
        self,
        env_name: str = "train",
        seed: int | None = None,
        recovery_gamma: float = 0.98,
    ):
        self.env_name = env_name
        self.rng = np.random.default_rng(seed)
        self.customer = CustomerResponseModel(self.rng, env_name)
        self.state: EpisodeState | None = None
        self.step_count = 0
        self.max_steps = 12
        self.hour_per_step = 6.0
        self.recovery_gamma = recovery_gamma

    @property
    def observation_space_shape(self) -> tuple[int, ...]:
        return (OBS_DIM,)

    @property
    def action_space_n(self) -> int:
        from packages.simulator.actions import NUM_ACTIONS

        return NUM_ACTIONS

    def reset(self, *, seed: int | None = None, options: dict | None = None) -> tuple[np.ndarray, dict]:
        if seed is not None:
            self.rng = np.random.default_rng(seed)
            self.customer = CustomerResponseModel(self.rng, self.env_name)
        self.step_count = 0
        amount = float(self.rng.uniform(99, 4999))
        method = self.rng.choice(["card", "upi"], p=[0.55, 0.45])
        reason = self.rng.choice(FAILURE_REASONS)
        source = self._reason_to_source(reason)
        self.state = EpisodeState(
            case_id=f"SIM-{self.rng.integers(10000, 99999)}",
            amount_inr=amount,
            method=method,
            failure_reason=reason,
            error_source=source,
            is_returning=bool(self.rng.random() < 0.4),
            late_auth_risk=bool(method == "upi" and self.rng.random() < 0.15),
        )
        return self.state.to_obs(), self._info()

    def step(self, action: int) -> tuple[np.ndarray, float, bool, bool, dict]:
        assert self.state is not None
        s = self.state
        mask = action_mask(s)
        if not mask[action]:
            action = int(RecoveryAction.WAIT)

        reward = self._compute_step_reward(action, invalid=not mask[action])
        s.action_history.append(action)
        s.prior_action = action

        if action == int(RecoveryAction.STOP):
            s.stopped = True
            s.prior_outcome = 0
        elif action == int(RecoveryAction.WAIT):
            p = self.customer.spontaneous_recovery_prob(s.failure_reason, s.hours_since_failure)
            if self.rng.random() < p:
                s.recovered = True
                reward += s.amount_inr * (self.recovery_gamma ** self.step_count)
                s.prior_outcome = 1
            else:
                s.prior_outcome = -1
        else:
            cost = ACTION_COST_INR.get(RecoveryAction(action), 0.1)
            s.total_comm_cost += cost
            if action in (
                int(RecoveryAction.NOTIFY_CUSTOMER),
                int(RecoveryAction.RESEND_LINK),
                int(RecoveryAction.SUGGEST_ALT_METHOD),
            ):
                s.contacts_used += 1
            dup_risk = self.customer.duplicate_payment_risk(action, s.failure_reason, s.hours_since_failure)
            if self.rng.random() < dup_risk:
                s.duplicate_incident = True
                reward -= s.amount_inr * 0.5
            p_succ = self.customer.action_success_prob(
                action, s.failure_reason, s.contacts_used, s.hours_since_failure, s.amount_inr
            )
            if self.rng.random() < p_succ:
                s.recovered = True
                reward += s.amount_inr * (self.recovery_gamma ** self.step_count)
                s.prior_outcome = 1
            else:
                s.prior_outcome = -1

        s.hours_since_failure += self.hour_per_step
        self.step_count += 1
        terminated = s.recovered or s.stopped
        truncated = self.step_count >= self.max_steps
        if truncated and not s.recovered:
            reward += self._timeout_penalty()
        return s.to_obs(), reward, terminated, truncated, self._info()

    def _timeout_penalty(self) -> float:
        from packages.policy.reward import RewardCalculator

        assert self.state is not None
        calc = RewardCalculator(normalize_for_training=True)
        return calc.step_reward(
            action=int(RecoveryAction.WAIT),
            amount_inr=self.state.amount_inr,
            contacts_used=self.state.contacts_used,
            contacts_max=self.state.contacts_max,
            invalid_action=False,
            duplicate=False,
            recovered=False,
            comm_cost=0.0,
            episode_timed_out=True,
        )

    def _compute_step_reward(self, action: int, invalid: bool) -> float:
        import os
        from packages.policy.reward import RewardCalculator

        assert self.state is not None
        kwargs: dict = {}
        if (fw := os.environ.get("RAZORSTITCH_FRICTION_WEIGHT")) is not None:
            kwargs["friction_weight"] = float(fw)
        if (dp := os.environ.get("RAZORSTITCH_DUPLICATE_PENALTY")) is not None:
            kwargs["duplicate_penalty"] = float(dp)
        calc = RewardCalculator(**kwargs)
        return calc.step_reward(
            action=action,
            amount_inr=self.state.amount_inr,
            contacts_used=self.state.contacts_used,
            contacts_max=self.state.contacts_max,
            invalid_action=invalid,
            duplicate=self.state.duplicate_incident,
            recovered=False,
            comm_cost=self.state.total_comm_cost,
            is_wait=action == int(RecoveryAction.WAIT),
        )

    def _reason_to_source(self, reason: str) -> str:
        mapping = {
            "insufficient_funds": "customer",
            "payment_cancelled": "customer",
            "authentication_failed": "customer",
            "gateway_error": "gateway",
            "upi_timeout": "gateway",
            "bank_outage": "razorpay",
        }
        return mapping.get(reason, self.rng.choice(ERROR_SOURCES))

    def _info(self) -> dict:
        assert self.state is not None
        return {
            "case_id": self.state.case_id,
            "amount_inr": self.state.amount_inr,
            "failure_reason": self.state.failure_reason,
            "recovered": self.state.recovered,
            "action_mask": action_mask(self.state),
            "q_context": {
                "reason": self.state.failure_reason,
                "method": self.state.method,
                "hours": self.state.hours_since_failure,
            },
        }


ENV_REGISTRY = {
    "train": RecoveryEnv,
    "val": RecoveryEnv,
    "test": RecoveryEnv,
    "shift": RecoveryEnv,
    "bank_outage": RecoveryEnv,
    "adversarial": RecoveryEnv,
}
