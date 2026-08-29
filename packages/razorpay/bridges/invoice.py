from __future__ import annotations

from typing import Any


def invoice_to_case(payload: dict[str, Any]) -> dict:
    entity = payload.get("payload", {}).get("invoice", {}).get("entity", {})
    amount_paise = int(entity.get("amount") or 0)
    return {
        "wedge": "invoice_overdue",
        "case_id": entity.get("id", "INV-UNKNOWN"),
        "amount_inr": amount_paise / 100,
        "reason": "smb",
        "method": "card",
        "hours": 168,
        "wedge_metadata": {"status": entity.get("status"), "due_date": entity.get("expire_by")},
    }
