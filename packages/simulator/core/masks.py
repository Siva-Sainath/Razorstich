from __future__ import annotations

from typing import Any

import numpy as np

from packages.simulator.actions import NUM_ACTIONS, RecoveryAction
from packages.simulator.state import EpisodeState, action_mask


def _block(mask: np.ndarray, *actions: RecoveryAction) -> None:
    for a in actions:
        mask[int(a)] = False


def _wedge_max_steps(wedge: str) -> int:
    return {
        "checkout_failed": 12,
        "cart_abandon": 24,
        "subscription_failed": 28,
        "invoice_overdue": 30,
    }.get(wedge, 12)


def wedge_action_mask(state: Any) -> np.ndarray:
    """Deterministic mask for WedgeState objects."""
    wedge = getattr(state, "wedge", "checkout_failed")
    ep = EpisodeState(
        case_id=getattr(state, "case_id", "SIM-0"),
        amount_inr=float(getattr(state, "amount_inr", 0)),
        method=str(getattr(state, "method", "card")),
        failure_reason=str(getattr(state, "reason", "gateway_error")),
        error_source="gateway",
        is_returning=False,
        hours_since_failure=float(getattr(state, "hours", 0)),
        attempt_count=int(getattr(state, "attempts", 0)),
        contacts_used=int(getattr(state, "contacts", 0)),
        contacts_max=int(getattr(state, "contacts_max", 3)),
        recovered=bool(getattr(state, "recovered", False)),
        stopped=bool(getattr(state, "stopped", False)),
        wedge=wedge,
        customer_opted_out=bool(getattr(state, "customer_opted_out", False)),
        payment_pending=bool(getattr(state, "payment_pending", False)),
        permanent_failure=bool(getattr(state, "permanent_failure", False)),
        webhook_mismatch=bool(getattr(state, "webhook_mismatch", False)),
        subscription_halted=wedge == "subscription_failed"
        and getattr(state, "reason", "") in ("cancelled", "halted"),
    )

    mask = action_mask(ep)

    if wedge == "cart_abandon":
        _block(mask, RecoveryAction.RETRY_CHECKOUT)
    if wedge == "invoice_overdue":
        _block(mask, RecoveryAction.RETRY_CHECKOUT, RecoveryAction.CREATE_PAYMENT_LINK)
    if wedge == "subscription_failed" and ep.hours_since_failure < 6:
        _block(mask, RecoveryAction.RETRY_CHECKOUT)
    if wedge == "checkout_failed" and ep.failure_reason == "upi_timeout" and ep.hours_since_failure < 1:
        _block(mask, RecoveryAction.RETRY_CHECKOUT, RecoveryAction.CREATE_PAYMENT_LINK)

    steps = int(getattr(state, "steps", 0))
    if ep.recovered or ep.stopped or steps >= _wedge_max_steps(wedge):
        mask[:] = False
        mask[int(RecoveryAction.STOP)] = True

    return mask
