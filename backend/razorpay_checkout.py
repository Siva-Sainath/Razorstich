"""
Razorpay Standard Checkout — Orders API + signature verify (Test Mode).

Docs: https://razorpay.com/docs/payments/payment-gateway/quick-integration/
"""

from __future__ import annotations

import hashlib
import hmac
import os
import uuid
from typing import Any

import requests
from requests.auth import HTTPBasicAuth

from payment_store import (
    DEFAULT_WEDGE,
    create_order_record,
    get_order,
    mark_cancelled,
    mark_failed,
    mark_paid,
    mark_pending,
    resolve_plan_amount,
)


def keys_configured() -> bool:
    return bool(os.environ.get("RAZORPAY_KEY_ID") and os.environ.get("RAZORPAY_KEY_SECRET"))


def public_key_id() -> str | None:
    return os.environ.get("RAZORPAY_KEY_ID") or os.environ.get("REACT_APP_RAZORPAY_KEY_ID")


def _assert_test_key(key_id: str | None) -> None:
    if key_id and not key_id.startswith("rzp_test_"):
        raise ValueError("Only Razorpay Test Mode keys (rzp_test_*) are allowed")


def create_checkout_order(*, plan_id: str | None = None, wedge: str = DEFAULT_WEDGE) -> dict[str, Any]:
    """Create Razorpay order (paise). Amount is resolved server-side from plan_id."""
    resolved_plan, amount_inr = resolve_plan_amount(plan_id)
    amount_paise = max(100, int(round(amount_inr * 100)))
    receipt = f"rs_{uuid.uuid4().hex[:12]}"

    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        mock_id = f"order_mock_{uuid.uuid4().hex[:10]}"
        record = create_order_record(
            order_id=mock_id,
            plan_id=resolved_plan,
            amount_inr=amount_inr,
            amount_paise=amount_paise,
            wedge=wedge,
            receipt=receipt,
            razorpay_mode="unconfigured",
        )
        return {
            "mode": "unconfigured",
            "key_id": None,
            "order": {
                "id": mock_id,
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
            },
            "plan_id": resolved_plan,
            "amount_inr": amount_inr,
            "wedge": wedge,
            "status": record["status"],
            "message": "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env (Test Mode keys).",
        }

    _assert_test_key(key_id)

    resp = requests.post(
        "https://api.razorpay.com/v1/orders",
        auth=HTTPBasicAuth(key_id, key_secret),
        json={
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "wedge": wedge,
                "plan_id": resolved_plan,
                "source": "razorstitch_pricing_sandbox",
            },
        },
        timeout=30,
    )
    resp.raise_for_status()
    order = resp.json()
    order_id = order["id"]
    record = create_order_record(
        order_id=order_id,
        plan_id=resolved_plan,
        amount_inr=amount_inr,
        amount_paise=amount_paise,
        wedge=wedge,
        receipt=order.get("receipt", receipt),
        razorpay_mode="razorpay",
    )
    return {
        "mode": "razorpay",
        "key_id": key_id,
        "order": {
            "id": order_id,
            "amount": order["amount"],
            "currency": order.get("currency", "INR"),
            "receipt": order.get("receipt", receipt),
        },
        "plan_id": resolved_plan,
        "amount_inr": amount_inr,
        "wedge": wedge,
        "status": record["status"],
    }


def verify_payment_signature(
    order_id: str,
    payment_id: str,
    signature: str,
) -> bool:
    secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not secret:
        return False
    body = f"{order_id}|{payment_id}"
    expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def handle_checkout_opened(order_id: str) -> dict[str, Any]:
    record = mark_pending(order_id)
    return {"ok": True, "order_id": order_id, "status": record["status"]}


def handle_checkout_cancelled(order_id: str) -> dict[str, Any]:
    record = mark_cancelled(order_id)
    return {
        "ok": True,
        "order_id": order_id,
        "status": record["status"],
        "message": "Checkout cancelled. You can try again anytime.",
    }


def handle_payment_success(
    *,
    order_id: str,
    payment_id: str,
    signature: str,
) -> dict[str, Any]:
    record = get_order(order_id)
    if not record:
        raise ValueError("Unknown order")

    if record.get("status") == "paid" and record.get("payment_id") == payment_id:
        return _success_payload(record, duplicate=True)

    if not verify_payment_signature(order_id, payment_id, signature):
        raise ValueError("Invalid payment signature")

    updated, duplicate = mark_paid(order_id, payment_id=payment_id)
    if duplicate:
        return _success_payload(updated, duplicate=True)

    from razorpay_test import append_audit

    amount_inr = float(updated["amount_inr"])
    wedge = updated.get("wedge", DEFAULT_WEDGE)
    append_audit(
        {
            "event_type": "payment.captured",
            "case_id": order_id,
            "payment_id": payment_id,
            "amount_inr": amount_inr,
            "wedge": wedge,
            "plan_id": updated.get("plan_id"),
            "test_mode": True,
        }
    )
    return _success_payload(updated, duplicate=False)


def _success_payload(record: dict[str, Any], *, duplicate: bool) -> dict[str, Any]:
    amount_inr = float(record["amount_inr"])
    return {
        "ok": True,
        "status": "paid",
        "payment_status": record["status"],
        "recovered": True,
        "duplicate": duplicate,
        "order_id": record["order_id"],
        "payment_id": record.get("payment_id"),
        "plan_id": record.get("plan_id"),
        "amount_inr": amount_inr,
        "message": (
            f"Payment already recorded — ₹{amount_inr:,.0f} (Test Mode)"
            if duplicate
            else f"Payment captured — ₹{amount_inr:,.0f} (Razorpay Test Mode)"
        ),
    }


def handle_payment_failed(
    *,
    order_id: str,
    payment_id: str | None,
    error_code: str | None,
    error_description: str | None,
) -> dict[str, Any]:
    record = get_order(order_id)
    if not record:
        raise ValueError("Unknown order")

    if record.get("status") == "paid":
        return {
            "ok": False,
            "status": "paid",
            "message": "This order was already paid.",
            "order_id": order_id,
        }

    amount_inr = float(record["amount_inr"])
    wedge = record.get("wedge", DEFAULT_WEDGE)
    reason = _map_razorpay_error(error_code, error_description)

    from razorpay_test import append_audit, map_wedge_default_failure

    failure_reason = reason or map_wedge_default_failure(wedge)
    updated = mark_failed(order_id, payment_id=payment_id, failure_reason=failure_reason)

    from policy_bridge import recommend_live

    policy = recommend_live(
        tick=0,
        contacts_used=0,
        method="card",
        hours_since_failure=0.0,
        wedge=wedge,
        case_id=order_id,
        amount_inr=amount_inr,
        failure_reason=failure_reason,
    )

    append_audit(
        {
            "event_type": "payment.failed",
            "case_id": order_id,
            "payment_id": payment_id,
            "amount_inr": amount_inr,
            "wedge": wedge,
            "plan_id": record.get("plan_id"),
            "test_mode": True,
            "policy_action": policy.get("selected_action"),
        }
    )

    return {
        "ok": True,
        "status": "failed",
        "payment_status": updated["status"],
        "recovered": False,
        "duplicate": updated.get("status") == "failed" and updated.get("payment_id") == payment_id,
        "order_id": order_id,
        "payment_id": payment_id,
        "failure_reason": failure_reason,
        "policy": policy,
        "amount_inr": amount_inr,
        "message": (
            f"Payment failed ({failure_reason}). "
            f"Agent recommends: {policy.get('selected_action', '').replace('_', ' ')}"
        ),
    }


def _map_razorpay_error(code: str | None, description: str | None) -> str | None:
    text = f"{code or ''} {description or ''}".lower()
    if "insufficient" in text:
        return "insufficient_funds"
    if "auth" in text or "cancel" in text:
        return "authentication_failed"
    if "upi" in text or "timeout" in text:
        return "upi_timeout"
    if "bank" in text:
        return "bank_outage"
    if text.strip():
        return "gateway_error"
    return None
