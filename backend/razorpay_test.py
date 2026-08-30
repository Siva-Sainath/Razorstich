"""
Razorpay Test Mode simulator — official test card numbers, no live PG compliance.

Uses Razorpay-documented test cards to emit payment.failed / payment.captured
payloads and drive policy recommend. No Razorpay API keys required for demo.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any

# Official Razorpay test cards (see docs/RAZORPAY_TEST_MODE.md)
TEST_CARDS = [
    {
        "id": "success_visa",
        "label": "Payment success",
        "brand": "Visa",
        "number": "4111111111111111",
        "display": "4111 1111 1111 1111",
        "cvv": "any",
        "expiry": "any future",
        "outcome": "captured",
        "failure_reason": None,
        "decline_code": None,
        "description": "Standard Razorpay success test card",
    },
    {
        "id": "success_mastercard",
        "label": "Payment success (Mastercard)",
        "brand": "Mastercard",
        "number": "5104060000000008",
        "display": "5104 0600 0000 0008",
        "cvv": "any",
        "expiry": "any future",
        "outcome": "captured",
        "failure_reason": None,
        "decline_code": None,
        "description": "Mastercard success test card",
    },
    {
        "id": "insufficient_funds",
        "label": "Insufficient funds",
        "brand": "Visa",
        "number": "4012001037141112",
        "display": "4012 0010 3714 1112",
        "cvv": "any",
        "expiry": "any future",
        "outcome": "failed",
        "failure_reason": "insufficient_funds",
        "decline_code": "51",
        "description": "Maps to insufficient_funds in recovery taxonomy",
    },
    {
        "id": "auth_failed",
        "label": "Authentication failed",
        "brand": "Visa",
        "number": "4012001037167778",
        "display": "4012 0010 3716 7778",
        "cvv": "any",
        "expiry": "any future",
        "outcome": "failed",
        "failure_reason": "authentication_failed",
        "decline_code": "05",
        "description": "3DS / auth failure scenario",
    },
    {
        "id": "gateway_error",
        "label": "Gateway error",
        "brand": "Visa",
        "number": "4012001037183331",
        "display": "4012 0010 3718 3331",
        "cvv": "any",
        "expiry": "any future",
        "outcome": "failed",
        "failure_reason": "gateway_error",
        "decline_code": "96",
        "description": "Transient gateway failure",
    },
]

_CARDS_BY_NUMBER = {c["number"]: c for c in TEST_CARDS}

# In-memory audit for demo (no Supabase required)
_audit_log: list[dict[str, Any]] = []


def list_test_cards() -> list[dict[str, Any]]:
    return [
        {k: v for k, v in card.items() if k != "number"}
        | {"number_masked": f"···· {card['display'][-4:]}"}
        for card in TEST_CARDS
    ]


def _normalize_card(number: str) -> str:
    return "".join(ch for ch in (number or "") if ch.isdigit())


def resolve_test_card(card_number: str) -> dict[str, Any] | None:
    digits = _normalize_card(card_number)
    if digits in _CARDS_BY_NUMBER:
        return _CARDS_BY_NUMBER[digits]
    # Default unknown cards to gateway error (safe demo behaviour)
    if len(digits) >= 13:
        return {
            "id": "unknown",
            "label": "Unknown test card",
            "outcome": "failed",
            "failure_reason": "gateway_error",
            "decline_code": "96",
            "display": card_number,
        }
    return None


def map_wedge_default_failure(wedge: str) -> str:
    return {
        "checkout_failed": "insufficient_funds",
        "cart_abandon": "payment_page",
        "subscription_failed": "card_expired",
        "invoice_overdue": "smb",
    }.get(wedge, "gateway_error")


def build_webhook_event(
    *,
    wedge: str,
    amount_inr: float,
    method: str,
    card: dict[str, Any],
    order_id: str,
    payment_id: str,
) -> dict[str, Any]:
    captured = card.get("outcome") == "captured"
    event_name = "payment.captured" if captured else "payment.failed"
    amount_paise = int(round(amount_inr * 100))

    payment_entity: dict[str, Any] = {
        "id": payment_id,
        "order_id": order_id,
        "amount": amount_paise,
        "currency": "INR",
        "method": method,
        "status": "captured" if captured else "failed",
        "card": {"last4": card.get("display", "····")[-4:]},
    }
    if not captured:
        payment_entity["error_code"] = card.get("decline_code") or "BAD_REQUEST_ERROR"
        payment_entity["error_description"] = card.get("failure_reason", "payment_failed")

    return {
        "event": event_name,
        "event_id": f"evt_test_{uuid.uuid4().hex[:12]}",
        "created_at": int(datetime.now(timezone.utc).timestamp()),
        "payload": {
            "payment": {"entity": payment_entity},
            "order": {"entity": {"id": order_id, "amount": amount_paise, "currency": "INR"}},
        },
        "meta": {
            "wedge": wedge,
            "test_mode": True,
            "card_id": card.get("id"),
            "failure_reason": card.get("failure_reason"),
        },
    }


def append_audit(entry: dict[str, Any]) -> dict[str, Any]:
    prev = _audit_log[-1]["hash"] if _audit_log else None
    payload = {**entry, "prev_hash": prev}
    payload["hash"] = hashlib.sha256(
        f"{payload.get('event_type')}|{payload.get('case_id')}|{prev}".encode()
    ).hexdigest()[:16]
    payload["created_at"] = datetime.now(timezone.utc).isoformat()
    _audit_log.append(payload)
    if len(_audit_log) > 200:
        _audit_log.pop(0)
    return payload


def get_audit_log(limit: int = 20) -> list[dict[str, Any]]:
    return list(reversed(_audit_log[-limit:]))


def simulate_test_payment(
    *,
    card_number: str,
    amount_inr: float,
    wedge: str = "checkout_failed",
    method: str = "card",
) -> dict[str, Any]:
    card = resolve_test_card(card_number)
    if not card:
        raise ValueError("Invalid card number — use Razorpay test cards from the picker")

    order_id = f"order_test_{uuid.uuid4().hex[:10]}"
    payment_id = f"pay_test_{uuid.uuid4().hex[:10]}"
    event = build_webhook_event(
        wedge=wedge,
        amount_inr=amount_inr,
        method=method,
        card=card,
        order_id=order_id,
        payment_id=payment_id,
    )

    captured = card.get("outcome") == "captured"
    failure_reason = card.get("failure_reason") or (
        None if captured else map_wedge_default_failure(wedge)
    )

    policy = None
    if not captured and failure_reason:
        from policy_bridge import recommend_live

        policy = recommend_live(
            tick=0,
            contacts_used=0,
            method=method,
            hours_since_failure=0.0,
            wedge=wedge,
            case_id=order_id,
            amount_inr=amount_inr,
            failure_reason=failure_reason,
        )

    audit = append_audit(
        {
            "event_type": event["event"],
            "case_id": order_id,
            "payment_id": payment_id,
            "amount_inr": amount_inr,
            "wedge": wedge,
            "test_mode": True,
            "policy_action": policy.get("selected_action") if policy else None,
        }
    )

    return {
        "ok": True,
        "test_mode": True,
        "order_id": order_id,
        "payment_id": payment_id,
        "status": "captured" if captured else "failed",
        "recovered": captured,
        "amount_inr": amount_inr,
        "wedge": wedge,
        "failure_reason": failure_reason,
        "decline_code": card.get("decline_code"),
        "card_label": card.get("label"),
        "webhook_event": event,
        "policy": policy,
        "audit": audit,
        "message": (
            f"Payment captured — ₹{amount_inr:,.0f} (Razorpay Test Mode)"
            if captured
            else f"Payment failed — {failure_reason}. Agent recommends: {policy.get('selected_action') if policy else 'n/a'}"
        ),
    }
