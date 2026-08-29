from __future__ import annotations

import numpy as np

from packages.simulator.actions import NUM_ACTIONS, RecoveryAction
from packages.simulator.env import RecoveryEnv


class BaselinePolicy:
    name = "baseline"

    def select_action(self, obs: np.ndarray, mask: np.ndarray, info: dict) -> int:
        valid = np.where(mask)[0]
        return int(valid[0]) if len(valid) else 0


class NoOpPolicy(BaselinePolicy):
    name = "noop"


class AlwaysWaitPolicy(BaselinePolicy):
    name = "wait"

    def select_action(self, obs: np.ndarray, mask: np.ndarray, info: dict) -> int:
        if mask[int(RecoveryAction.WAIT)]:
            return int(RecoveryAction.WAIT)
        return super().select_action(obs, mask, info)


class ImmediateRetryPolicy(BaselinePolicy):
    name = "immediate_retry"

    def select_action(self, obs: np.ndarray, mask: np.ndarray, info: dict) -> int:
        for a in (RecoveryAction.RETRY_CHECKOUT, RecoveryAction.CREATE_PAYMENT_LINK):
            if mask[int(a)]:
                return int(a)
        return int(RecoveryAction.WAIT)


class ExponentialBackoffPolicy(BaselinePolicy):
    name = "exponential_backoff"

    def __init__(self):
        self._episode_hours = 0

    def select_action(self, obs: np.ndarray, mask: np.ndarray, info: dict) -> int:
        hours = info.get("q_context", {}).get("hours", 0)
        if hours < 6:
            return int(RecoveryAction.WAIT) if mask[int(RecoveryAction.WAIT)] else 0
        if hours < 24:
            return int(RecoveryAction.RETRY_CHECKOUT) if mask[int(RecoveryAction.RETRY_CHECKOUT)] else 0
        return int(RecoveryAction.CREATE_PAYMENT_LINK) if mask[int(RecoveryAction.CREATE_PAYMENT_LINK)] else 0


class FailureRulesPolicy(BaselinePolicy):
    name = "failure_rules"

    def select_action(self, obs: np.ndarray, mask: np.ndarray, info: dict) -> int:
        reason = info.get("q_context", {}).get("reason", "")
        if reason == "insufficient_funds":
            a = RecoveryAction.WAIT if info.get("q_context", {}).get("hours", 0) < 24 else RecoveryAction.NOTIFY_CUSTOMER
        elif reason in ("gateway_error", "bank_outage"):
            a = RecoveryAction.RETRY_CHECKOUT
        elif reason == "upi_timeout":
            a = RecoveryAction.WAIT if info.get("q_context", {}).get("hours", 0) < 1 else RecoveryAction.CREATE_PAYMENT_LINK
        elif reason == "authentication_failed":
            a = RecoveryAction.SUGGEST_ALT_METHOD
        else:
            a = RecoveryAction.NOTIFY_CUSTOMER
        return int(a) if mask[int(a)] else int(RecoveryAction.WAIT)


class AlwaysPaymentLinkPolicy(BaselinePolicy):
    name = "always_payment_link"

    def select_action(self, obs: np.ndarray, mask: np.ndarray, info: dict) -> int:
        if mask[int(RecoveryAction.CREATE_PAYMENT_LINK)]:
            return int(RecoveryAction.CREATE_PAYMENT_LINK)
        return int(RecoveryAction.WAIT)


BASELINES = [
    NoOpPolicy(),
    AlwaysWaitPolicy(),
    ImmediateRetryPolicy(),
    ExponentialBackoffPolicy(),
    FailureRulesPolicy(),
    AlwaysPaymentLinkPolicy(),
]


def evaluate_policy(policy, env_name: str, episodes: int, seed: int) -> dict:
    env = RecoveryEnv(env_name=env_name, seed=seed)
    rng = np.random.default_rng(seed)
    recovered_value = 0.0
    recovered_count = 0
    duplicates = 0
    total_amount_at_risk = 0.0
    communication_cost = 0.0
    duplicate_penalty = 0.0
    contacts_used = 0

    for ep in range(episodes):
        env.rng = np.random.default_rng(seed + ep)
        env.customer.rng = env.rng
        obs, info = env.reset()
        while True:
            mask = info["action_mask"]
            if hasattr(policy, "select_action") and policy.__class__.__name__ == "DQNAgent":
                action = policy.select_action(obs, mask, explore=False)
            else:
                action = policy.select_action(obs, mask, info)
            obs, _, term, trunc, info = env.step(action)
            if term or trunc:
                break
        assert env.state is not None
        total_amount_at_risk += env.state.amount_inr
        communication_cost += env.state.total_comm_cost
        contacts_used += env.state.contacts_used
        if env.state.recovered:
            recovered_count += 1
            recovered_value += env.state.amount_inr
        if env.state.duplicate_incident:
            duplicates += 1
            duplicate_penalty += env.state.amount_inr * 0.5

    rate = recovered_count / max(episodes, 1)
    return {
        "policy": getattr(policy, "name", "dqn"),
        "episodes": episodes,
        "recovery_rate": rate,
        "gross_recovered_value_inr": recovered_value,
        "communication_cost_inr": communication_cost,
        "duplicate_penalty_inr": duplicate_penalty,
        "net_recovered_value_inr": recovered_value - communication_cost - duplicate_penalty,
        "recovered_per_1000": rate * 1000,
        "duplicate_incidents": duplicates,
        "avg_contacts_used": contacts_used / max(episodes, 1),
        "avg_case_inr": total_amount_at_risk / max(episodes, 1),
    }
