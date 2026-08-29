from __future__ import annotations

from typing import Any


def subscription_to_case(payload: dict[str, Any]) -> dict:
    entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
    return {
        "wedge": "subscription_failed",
        "case_id": entity.get("id", "SUB-UNKNOWN"),
        "amount_inr": float(entity.get("plan_amount", 89900)) / 100,
        "reason": "card_expired",
        "method": "card",
        "hours": 0,
        "wedge_metadata": {"status": entity.get("status"), "plan_id": entity.get("plan_id")},
    }
