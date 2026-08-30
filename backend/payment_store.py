"""Sandbox payment orders — file-backed state for Razorpay Test Mode checkout."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

PaymentStatus = Literal["created", "pending", "paid", "failed", "cancelled"]

ROOT = Path(__file__).resolve().parents[1]
ORDERS_PATH = ROOT / "data" / "payment_orders.json"

# Server-authoritative plan → price (INR). Client amounts are ignored.
PLAN_PRICES_INR: dict[str, float] = {
    "sandbox": 1499.0,
    "growth": 499.0,  # Pre-book deposit (Test Mode — no live charge)
}

DEFAULT_PLAN_ID = "sandbox"
DEFAULT_WEDGE = "checkout_failed"


def resolve_plan_amount(plan_id: str | None) -> tuple[str, float]:
    pid = (plan_id or DEFAULT_PLAN_ID).strip().lower()
    if pid not in PLAN_PRICES_INR:
        raise ValueError(f"Unknown plan_id: {plan_id}")
    return pid, PLAN_PRICES_INR[pid]


def _ensure_file() -> None:
    ORDERS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not ORDERS_PATH.exists():
        ORDERS_PATH.write_text("{}")


def _load_orders() -> dict[str, dict[str, Any]]:
    _ensure_file()
    raw = ORDERS_PATH.read_text().strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _save_orders(orders: dict[str, dict[str, Any]]) -> None:
    _ensure_file()
    ORDERS_PATH.write_text(json.dumps(orders, indent=2))


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_order(order_id: str) -> dict[str, Any] | None:
    return _load_orders().get(order_id)


def create_order_record(
    *,
    order_id: str,
    plan_id: str,
    amount_inr: float,
    amount_paise: int,
    wedge: str,
    receipt: str,
    razorpay_mode: str,
) -> dict[str, Any]:
    orders = _load_orders()
    if order_id in orders:
        existing = orders[order_id]
        if existing.get("status") not in ("created", "pending"):
            return existing
    record = {
        "order_id": order_id,
        "plan_id": plan_id,
        "amount_inr": amount_inr,
        "amount_paise": amount_paise,
        "wedge": wedge,
        "receipt": receipt,
        "razorpay_mode": razorpay_mode,
        "status": "created",
        "payment_id": None,
        "failure_reason": None,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    orders[order_id] = record
    _save_orders(orders)
    return record


def mark_pending(order_id: str) -> dict[str, Any]:
    return _transition(order_id, "pending", allowed_from={"created", "pending"})


def mark_cancelled(order_id: str) -> dict[str, Any]:
    return _transition(order_id, "cancelled", allowed_from={"created", "pending"})


def mark_failed(
    order_id: str,
    *,
    payment_id: str | None = None,
    failure_reason: str | None = None,
) -> dict[str, Any]:
    orders = _load_orders()
    record = orders.get(order_id)
    if not record:
        raise KeyError(f"Unknown order: {order_id}")
    if record.get("status") == "paid":
        return record
    record["status"] = "failed"
    record["payment_id"] = payment_id
    record["failure_reason"] = failure_reason
    record["updated_at"] = _now_iso()
    orders[order_id] = record
    _save_orders(orders)
    return record


def mark_paid(
    order_id: str,
    *,
    payment_id: str,
) -> tuple[dict[str, Any], bool]:
    """Mark order paid. Returns (record, is_duplicate)."""
    orders = _load_orders()
    record = orders.get(order_id)
    if not record:
        raise KeyError(f"Unknown order: {order_id}")

    for other in orders.values():
        if other.get("payment_id") == payment_id and other.get("order_id") != order_id:
            raise ValueError("payment_id already used for another order")

    if record.get("status") == "paid" and record.get("payment_id") == payment_id:
        return record, True

    if record.get("status") == "paid":
        raise ValueError("Order already paid with a different payment")

    record["status"] = "paid"
    record["payment_id"] = payment_id
    record["updated_at"] = _now_iso()
    orders[order_id] = record
    _save_orders(orders)
    return record, False


def _transition(
    order_id: str,
    status: PaymentStatus,
    *,
    allowed_from: set[str],
) -> dict[str, Any]:
    orders = _load_orders()
    record = orders.get(order_id)
    if not record:
        raise KeyError(f"Unknown order: {order_id}")
    if record.get("status") in ("paid", "failed"):
        return record
    if record.get("status") not in allowed_from:
        return record
    record["status"] = status
    record["updated_at"] = _now_iso()
    orders[order_id] = record
    _save_orders(orders)
    return record


def reset_store_for_tests() -> None:
    """Clear in-memory file — test helper only."""
    if ORDERS_PATH.exists():
        ORDERS_PATH.unlink()
    _ensure_file()
