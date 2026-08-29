from __future__ import annotations

from typing import Any


def order_to_cart_case(payload: dict[str, Any]) -> dict:
    entity = payload.get("payload", {}).get("order", {}).get("entity", {})
    amount_paise = int(entity.get("amount") or 0)
    return {
        "wedge": "cart_abandon",
        "case_id": entity.get("id", "ORDER-UNKNOWN"),
        "amount_inr": amount_paise / 100,
        "reason": "payment_page",
        "method": "card",
        "hours": 0.33,
        "wedge_metadata": {"order_status": entity.get("status"), "receipt": entity.get("receipt")},
    }
