from __future__ import annotations

from packages.simulator.actions import ACTION_COST_INR, RecoveryAction


class RewardCalculator:
    """Net-value reward — transparent accounting."""

    def __init__(
        self,
        comm_weight: float = 1.0,
        friction_weight: float = 0.5,
        duplicate_penalty: float = 1.0,
        unsafe_penalty: float = 2.0,
    ):
        self.comm_weight = comm_weight
        self.friction_weight = friction_weight
        self.duplicate_penalty = duplicate_penalty
        self.unsafe_penalty = unsafe_penalty

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
    ) -> float:
        r = 0.0
        if recovered:
            r += amount_inr
        cost = ACTION_COST_INR.get(RecoveryAction(action), 0.0)
        r -= self.comm_weight * cost
        fatigue = contacts_used / max(contacts_max, 1)
        r -= self.friction_weight * amount_inr * 0.01 * fatigue
        if duplicate:
            r -= self.duplicate_penalty * amount_inr * 0.5
        if invalid_action:
            r -= self.unsafe_penalty * amount_inr * 0.02
        return r

    def episode_summary(self, collected: float, costs: float, duplicate: bool, amount: float) -> dict:
        preserved = amount if not duplicate else 0.0
        return {
            "confirmed_collected_value": collected,
            "communication_cost": costs,
            "preserved_value": preserved,
            "net_value": collected - costs - (amount * 0.5 if duplicate else 0),
        }
