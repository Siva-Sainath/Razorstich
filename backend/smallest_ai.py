"""Smallest AI Atoms — sync pricing voice agent from frontend config."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import requests

logger = logging.getLogger(__name__)

ATOMS_BASE = os.environ.get("SMALLEST_AI_API_BASE", "https://atoms-api.smallest.ai/api/v1")
CONFIG_PATH = Path(__file__).resolve().parent.parent / "frontend/src/config/pricingVoiceAgent.json"

_last_sync: dict[str, Any] | None = None


def _headers() -> dict[str, str]:
    key = os.environ.get("SMALLEST_AI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("SMALLEST_AI_API_KEY is not set")
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def load_voice_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Missing voice config: {CONFIG_PATH}")
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def sync_pricing_voice_agent(
    *,
    prompt: str | None = None,
    first_message: str | None = None,
) -> dict[str, Any]:
    """
    Push prompt + first message to Smallest AI (workflow PATCH + branch draft publish).
    Called from /api/voice/pricing/sync — frontend is source of truth for copy.
    """
    global _last_sync
    cfg = load_voice_config()
    agent_id = cfg["agentId"]
    workflow_id = cfg["workflowId"]
    branch_id = cfg["branchId"]
    prompt_text = (prompt or cfg.get("prompt") or "").strip()
    first_msg = (first_message or cfg.get("firstMessage") or "").strip()

    if not prompt_text:
        raise ValueError("prompt is required")

    headers = _headers()
    session = requests.Session()
    session.headers.update(headers)

    # 1) Workflow prompt (single_prompt)
    wf_resp = session.patch(
        f"{ATOMS_BASE}/workflow/{workflow_id}",
        json={"type": "single_prompt", "singlePromptConfig": {"prompt": prompt_text}},
        timeout=30,
    )
    wf_resp.raise_for_status()
    wf_body = wf_resp.json()
    if not wf_body.get("status"):
        raise RuntimeError(f"Workflow sync failed: {wf_body}")

    # 2) Branch draft — first message + prompt block, then publish
    draft_payload: dict[str, Any] = {
        "firstMessage": first_msg,
        "singlePromptConfig": {"prompt": prompt_text},
    }
    draft_resp = session.put(
        f"{ATOMS_BASE}/agent/{agent_id}/branches/{branch_id}/draft",
        json=draft_payload,
        timeout=30,
    )
    draft_resp.raise_for_status()
    draft_body = draft_resp.json()
    if not draft_body.get("status"):
        raise RuntimeError(f"Draft update failed: {draft_body}")

    pub_resp = session.post(
        f"{ATOMS_BASE}/agent/{agent_id}/branches/{branch_id}/draft/publish",
        json={},
        timeout=30,
    )
    pub_resp.raise_for_status()
    pub_body = pub_resp.json()
    if not pub_body.get("status"):
        raise RuntimeError(f"Draft publish failed: {pub_body}")

    result = {
        "ok": True,
        "agentId": agent_id,
        "workflowId": workflow_id,
        "branchId": branch_id,
        "publishState": pub_body.get("data", {}).get("state"),
        "promptChars": len(prompt_text),
    }
    _last_sync = result
    logger.info("Smallest AI pricing agent synced: %s", agent_id)
    return result


def public_widget_config() -> dict[str, Any]:
    """Safe fields for the browser widget — no API key."""
    cfg = load_voice_config()
    return {
        "agentId": os.environ.get("SMALLEST_AI_AGENT_ID") or cfg["agentId"],
        "widgetName": cfg.get("widgetName", "RazorStitch Pricing"),
        "ctaName": cfg.get("ctaName", "Talk to pricing guide"),
        "startButtonText": cfg.get("startButtonText", "Start voice chat"),
        "endButtonText": cfg.get("endButtonText", "End"),
        "chatPlaceholder": cfg.get("chatPlaceholder", "Ask about pricing…"),
        "widgetScript": "https://unpkg.com/atoms-widget-core@latest/dist/embed/widget.umd.js",
        "lastSync": _last_sync,
        "configured": bool(os.environ.get("SMALLEST_AI_API_KEY")),
    }
