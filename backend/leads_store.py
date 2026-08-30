"""Append-only lead capture for GTM — file-backed, no DB required locally."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
LEADS_PATH = ROOT / "data" / "leads.json"


def _ensure_file() -> None:
    LEADS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not LEADS_PATH.exists():
        LEADS_PATH.write_text("[]")


def list_leads() -> list[dict[str, Any]]:
    _ensure_file()
    raw = LEADS_PATH.read_text().strip()
    if not raw:
        return []
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return []


def append_lead(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure_file()
    rows = list_leads()
    row = {
        "id": payload.get("id") or f"lead_{len(rows) + 1:04d}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        **payload,
    }
    rows.append(row)
    LEADS_PATH.write_text(json.dumps(rows, indent=2))
    return row


def lead_count() -> int:
    return len(list_leads())
