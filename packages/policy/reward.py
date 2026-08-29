from __future__ import annotations

import numpy as np

from packages.simulator.actions import ACTION_COST_INR, RecoveryAction


class RewardCalculator:
    """Net-value reward with intermediate step signals.

    Training uses clipped normalized rewards; raw INR metrics are reported separately.
    """

    def __init__(
        self,
        comm_weight: float = 1.0,
        friction_weight: float = 0.5,
        duplicate_penalty: float = 1.0,
        unsafe_penalty: float = 2.0,
        time_cost_weight: float = 0.001,
        timeout_penalty_frac: float = 0.15,
        clip_range: tuple[float, float] = (-5000.0, 5000.0),
        normalize_for_training: bool = True,
    ):
        self.comm_weight = comm_weight
        self.friction_weight = friction_weight
        self.duplicate_penalty = duplicate_penalty
        self.unsafe_penalty = unsafe_penalty
        self.time_cost_weight = time_cost_weight
        self.timeout_penalty_frac = timeout_penalty_frac
        self.clip_range = clip_range
        self.normalize_for_training = normalize_for_training

    def _scale(self, amount_inr: float) -> float:
        return max(amount_inr, 1.0) / 1000.0

    def step_reward(
        self,
        *,
        action: int,
        amount_inr: float,
        contacts_used: int,
        contacts_max: int,
        invalid_action: bool,
        duplicate: bool,
        recovered: bool,
        comm_cost: float,
        step_action_cost: float | None = None,
        is_wait: bool = False,
        episode_timed_out: bool = False,
    ) -> float:
        scale = self._scale(amount_inr)
        r = 0.0

        if recovered:
            r += amount_inr

        action_enum = RecoveryAction(action)
        step_cost = step_action_cost if step_action_cost is not None else ACTION_COST_INR.get(action_enum, 0.0)
        r -= self.comm_weight * step_cost

        if is_wait:
            r -= self.time_cost_weight * amount_inr

        fatigue = contacts_used / max(contacts_max, 1)
        # High-value cases carry higher friction — prevents spam-contact exploit
        r -= self.friction_weight * amount_inr * 0.01 * fatigue

        if duplicate:
            r -= self.duplicate_penalty * amount_inr * 0.5

        if invalid_action:
            r -= self.unsafe_penalty * amount_inr * 0.02

        if episode_timed_out and not recovered:
            r -= self.timeout_penalty_frac * amount_inr

        if self.normalize_for_training:
            r = r / (1000.0 * scale)

        lo, hi = self.clip_range
        if self.normalize_for_training:
            lo, hi = lo / 10.0, hi / 10.0
        return float(np.clip(r, lo, hi))

    def episode_summary(self, collected: float, costs: float, duplicate: bool, amount: float) -> dict:
        preserved = amount if not duplicate else 0.0
        return {
            "confirmed_collected_value": collected,
            "communication_cost": costs,
            "preserved_value": preserved,
            "net_value": collected - costs - (amount * 0.5 if duplicate else 0),
        }
