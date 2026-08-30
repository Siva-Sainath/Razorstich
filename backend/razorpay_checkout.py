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


def keys_configured() -> bool:
    return bool(os.environ.get("RAZORPAY_KEY_ID") and os.environ.get("RAZORPAY_KEY_SECRET"))


def public_key_id() -> str | None:
    return os.environ.get("RAZORPAY_KEY_ID") or os.environ.get("REACT_APP_RAZORPAY_KEY_ID")


def create_checkout_order(*, amount_inr: float, wedge: str = "checkout_failed") -> dict[str, Any]:
    """Create Razorpay order (paise). Falls back to mock order when keys absent."""
    amount_paise = max(100, int(round(amount_inr * 100)))
    receipt = f"rs_{uuid.uuid4().hex[:12]}"

    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        return {
            "mode": "unconfigured",
            "key_id": None,
            "order": {
                "id": f"order_mock_{uuid.uuid4().hex[:10]}",
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
            },
            "wedge": wedge,
            "message": "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env (Test Mode keys).",
        }

    resp = requests.post(
        "https://api.razorpay.com/v1/orders",
        auth=HTTPBasicAuth(key_id, key_secret),
        json={
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": {"wedge": wedge, "source": "razorstitch_pricing_sandbox"},
        },
        timeout=30,
    )
    resp.raise_for_status()
    order = resp.json()
    return {
        "mode": "razorpay",
        "key_id": key_id,
        "order": {
            "id": order["id"],
            "amount": order["amount"],
            "currency": order.get("currency", "INR"),
            "receipt": order.get("receipt", receipt),
        },
        "wedge": wedge,
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


def handle_payment_success(
    *,
    order_id: str,
    payment_id: str,
    signature: str,
    amount_inr: float,
    wedge: str,
) -> dict[str, Any]:
    if not verify_payment_signature(order_id, payment_id, signature):
        raise ValueError("Invalid payment signature")

    from razorpay_test import append_audit

    audit = append_audit(
        {
            "event_type": "payment.captured",
            "case_id": order_id,
            "payment_id": payment_id,
            "amount_inr": amount_inr,
            "wedge": wedge,
            "test_mode": True,
        }
    )
    return {
        "ok": True,
        "status": "captured",
        "recovered": True,
        "order_id": order_id,
        "payment_id": payment_id,
        "message": f"Payment captured — ₹{amount_inr:,.0f} (Razorpay Test Mode)",
        "audit": audit,
    }


def handle_payment_failed(
    *,
    order_id: str,
    payment_id: str | None,
    error_code: str | None,
    error_description: str | None,
    amount_inr: float,
    wedge: str,
) -> dict[str, Any]:
    from razorpay_test import append_audit, map_wedge_default_failure

    reason = _map_razorpay_error(error_code, error_description) or map_wedge_default_failure(wedge)

    from policy_bridge import recommend_live

    policy = recommend_live(
        tick=0,
        contacts_used=0,
        method="card",
        hours_since_failure=0.0,
        wedge=wedge,
        case_id=order_id or f"order_fail_{uuid.uuid4().hex[:8]}",
        amount_inr=amount_inr,
        failure_reason=reason,
    )

    audit = append_audit(
        {
            "event_type": "payment.failed",
            "case_id": order_id,
            "payment_id": payment_id,
            "amount_inr": amount_inr,
            "wedge": wedge,
            "test_mode": True,
            "policy_action": policy.get("selected_action"),
        }
    )

    return {
        "ok": True,
        "status": "failed",
        "recovered": False,
        "order_id": order_id,
        "payment_id": payment_id,
        "failure_reason": reason,
        "policy": policy,
        "audit": audit,
        "message": f"Payment failed ({reason}). Agent recommends: {policy.get('selected_action', '').replace('_', ' ')}",
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
