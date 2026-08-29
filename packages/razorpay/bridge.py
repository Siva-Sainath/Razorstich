"""
Razorpay webhook payload → EpisodeState for replay / calibration.

This is NOT an RL training environment. It converts real Test Mode events into
simulator-compatible state so we can:
  - replay what the policy would have done
  - calibrate CustomerResponseModel params from observed outcomes
  - log confirmed Test Mode recovered value separately from simulator metrics
"""

from __future__ import annotations

from typing import Any

from packages.razorpay.taxonomy import map_payment_method, map_razorpay_error
from packages.simulator.state import EpisodeState
from packages.simulator.actions import RecoveryAction


def webhook_to_episode_state(
    payload: dict[str, Any],
    *,
    contacts_used: int = 0,
    hours_since_failure: float = 0.0,
) -> EpisodeState:
    """Build EpisodeState from Razorpay payment.failed (or similar) webhook body."""
    entity = (
        payload.get("payload", {}).get("payment", {}).get("entity")
        or payload.get("payload", {}).get("payment")
        or payload
    )
    if isinstance(entity, dict) and "entity" in entity:
        entity = entity["entity"]

    amount_paise = int(entity.get("amount") or 0)
    amount_inr = amount_paise / 100.0
    method = map_payment_method(entity.get("method"))
    reason = map_razorpay_error(entity.get("error_code"), entity.get("error_description"))
    case_id = entity.get("order_id") or entity.get("id") or "RZP-UNKNOWN"

    error_source = _reason_to_source(reason)
    status = entity.get("status", "failed")
    recovered = status == "captured"

    return EpisodeState(
        case_id=str(case_id),
        amount_inr=max(amount_inr, 1.0),
        method=method,
        failure_reason=reason,
        error_source=error_source,
        is_returning=False,
        hours_since_failure=hours_since_failure,
        contacts_used=contacts_used,
        contacts_max=3,
        late_auth_risk=method == "upi" and reason == "upi_timeout",
        prior_action=int(RecoveryAction.WAIT),
        recovered=recovered,
    )


def _reason_to_source(reason: str) -> str:
    return {
        "insufficient_funds": "customer",
        "payment_cancelled": "customer",
        "authentication_failed": "customer",
        "gateway_error": "gateway",
        "upi_timeout": "gateway",
        "bank_outage": "razorpay",
    }.get(reason, "gateway")
