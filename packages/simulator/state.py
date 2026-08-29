from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np

from packages.simulator.actions import ACTION_NAMES, NUM_ACTIONS, RecoveryAction


@dataclass
class EpisodeState:
    case_id: str
    amount_inr: float
    method: str  # card, upi
    failure_reason: str
    error_source: str
    is_returning: bool
    hours_since_failure: float = 0.0
    attempt_count: int = 1
    contacts_used: int = 0
    contacts_max: int = 3
    late_auth_risk: bool = False
    prior_action: int = int(RecoveryAction.WAIT)
    prior_outcome: int = 0  # 0 none, 1 success, -1 fail
    recovered: bool = False
    stopped: bool = False
    duplicate_incident: bool = False
    total_comm_cost: float = 0.0
    action_history: list[int] = field(default_factory=list)
    # Extended guardrail state
    customer_opted_out: bool = False
    payment_pending: bool = False
    permanent_failure: bool = False
    webhook_mismatch: bool = False
    subscription_halted: bool = False
    wedge: str = "checkout_failed"

    def to_obs(self) -> np.ndarray:
        reason_oh = _one_hot(self.failure_reason, _REASONS, 6)
        source_oh = _one_hot(self.error_source, _SOURCES, 4)
        method_oh = _one_hot(self.method, ["card", "upi"], 2)
        prior_action_oh = np.zeros(NUM_ACTIONS, dtype=np.float32)
        if 0 <= self.prior_action < NUM_ACTIONS:
            prior_action_oh[self.prior_action] = 1.0
        return np.concatenate(
            [
                np.array(
                    [
                        np.log1p(self.amount_inr) / 10.0,
                        self.hours_since_failure / 72.0,
                        self.attempt_count / 5.0,
                        self.contacts_used / max(self.contacts_max, 1),
                        float(self.is_returning),
                        float(self.late_auth_risk),
                        float(self.prior_outcome),
                        (self.contacts_max - self.contacts_used) / max(self.contacts_max, 1),
                    ],
                    dtype=np.float32,
                ),
                reason_oh,
                source_oh,
                method_oh,
                prior_action_oh,
            ]
        ).astype(np.float32)


_REASONS = [
    "insufficient_funds",
    "payment_cancelled",
    "authentication_failed",
    "gateway_error",
    "upi_timeout",
    "bank_outage",
]
_SOURCES = ["customer", "gateway", "business", "razorpay"]

OBS_DIM = 8 + 6 + 4 + 2 + NUM_ACTIONS


def _one_hot(value: str, vocab: list[str], size: int) -> np.ndarray:
    v = np.zeros(size, dtype=np.float32)
    if value in vocab:
        v[vocab.index(value)] = 1.0
    return v


def _block(mask: np.ndarray, *actions: RecoveryAction) -> None:
    for a in actions:
        mask[int(a)] = False


def action_mask(state: EpisodeState) -> np.ndarray:
    """Deterministic business-logic action mask — never learned by the policy."""
    mask = np.ones(NUM_ACTIONS, dtype=bool)

    if state.recovered:
        mask[:] = False
        mask[int(RecoveryAction.STOP)] = True
        return mask

    if state.stopped:
        mask[:] = False
        mask[int(RecoveryAction.STOP)] = True
        return mask

    # Payment pending / in-flight — block immediate duplicate retry
    if state.payment_pending:
        _block(mask, RecoveryAction.RETRY_CHECKOUT, RecoveryAction.CREATE_PAYMENT_LINK)

    # Customer opted out — block outbound contact
    if state.customer_opted_out:
        _block(
            mask,
            RecoveryAction.NOTIFY_CUSTOMER,
            RecoveryAction.RESEND_LINK,
            RecoveryAction.SUGGEST_ALT_METHOD,
        )

    # Permanent failure — no ordinary retry
    if state.permanent_failure:
        _block(mask, RecoveryAction.RETRY_CHECKOUT, RecoveryAction.CREATE_PAYMENT_LINK)

    # Subscription halted — method update, not checkout retry
    if state.subscription_halted:
        _block(mask, RecoveryAction.RETRY_CHECKOUT)

    # Webhook mismatch — reconcile before contacting customer
    if state.webhook_mismatch:
        _block(
            mask,
            RecoveryAction.NOTIFY_CUSTOMER,
            RecoveryAction.RESEND_LINK,
            RecoveryAction.CREATE_PAYMENT_LINK,
        )

    # Trust budget exhausted
    if state.contacts_used >= state.contacts_max:
        _block(
            mask,
            RecoveryAction.NOTIFY_CUSTOMER,
            RecoveryAction.RESEND_LINK,
            RecoveryAction.SUGGEST_ALT_METHOD,
        )

    # UPI duplicate-risk window
    if state.hours_since_failure < 1 and state.failure_reason == "upi_timeout":
        _block(mask, RecoveryAction.RETRY_CHECKOUT, RecoveryAction.CREATE_PAYMENT_LINK)

    # Horizon / stop conditions
    if state.hours_since_failure >= 72:
        mask[:] = False
        mask[int(RecoveryAction.STOP)] = True
        mask[int(RecoveryAction.ESCALATE_HUMAN)] = True

    return mask


def wedge_action_mask(state: Any) -> np.ndarray:
    from packages.simulator.core.masks import wedge_action_mask as _wedge_mask

    return _wedge_mask(state)
