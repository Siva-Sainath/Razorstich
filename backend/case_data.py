"""Case narrative + policy API — validation scenarios and real DQN rollouts."""

from __future__ import annotations

import logging

from agents_registry import list_agents
from episode_builder import DEFAULT_CASE_ID, build_all_cases
from policy_bridge import recommend_live

logger = logging.getLogger(__name__)

_cases_cache: dict | None = None


def get_all_cases() -> dict:
    global _cases_cache
    if _cases_cache is None:
        logger.info("Building case payloads from validation scenarios + DQN rollouts…")
        _cases_cache = build_all_cases(seed=42)
    return _cases_cache


def get_case(case_id: str) -> dict | None:
    return get_all_cases().get(case_id)


def get_default_case() -> dict:
    cases = get_all_cases()
    try:
        from learning_data import get_featured_case_id

        featured_id = get_featured_case_id("checkout_failed")
    except (RuntimeError, ValueError, KeyError):
        featured_id = DEFAULT_CASE_ID
    payload = cases.get(featured_id) or cases.get(DEFAULT_CASE_ID)
    if payload is None:
        raise RuntimeError(f"default case {featured_id} missing from built cases")
    return payload


CURRENT_CASE_ID = DEFAULT_CASE_ID


def recommend(
    tick: int,
    contacts_used: int,
    method: str,
    hours_since_failure: float,
    *,
    wedge: str = "checkout_failed",
    case_id: str | None = None,
    amount_inr: float | None = None,
    failure_reason: str | None = None,
):
    """Live Dueling DDQN recommendation — no mock fallback."""
    active_id = case_id or CURRENT_CASE_ID
    case_meta = get_case(active_id) or get_default_case()
    meta = case_meta["case"]
    return recommend_live(
        tick,
        contacts_used,
        method or meta["method"],
        hours_since_failure,
        wedge=wedge or meta.get("wedge", "checkout_failed"),
        case_id=active_id,
        amount_inr=amount_inr or meta["amount"],
        failure_reason=failure_reason or meta["failureReason"],
    )


def build_queue(current_id: str = CURRENT_CASE_ID) -> list[dict]:
    rows = []
    for case_id, payload in get_all_cases().items():
        c = payload["case"]
        final_prob = payload["recoveryCurve"][-1]["p"] if payload.get("recoveryCurve") else 0.3
        rows.append(
            {
                "id": case_id,
                "customer": c["customer"],
                "merchant": c["merchant"],
                "amount": c["amount"],
                "method": c["method"],
                "failureReason": c["failureReason"],
                "status": c["status"],
                "wedge": c["wedge"],
                "agentId": c["agentId"],
                "agentName": c["agentName"],
                "windowHours": c.get("windowHours"),
                "tickHours": c.get("tickHours"),
                "odds": final_prob if case_id != current_id else None,
                "tick": None,
                "isCurrent": case_id == current_id,
            }
        )
    rows.sort(key=lambda r: (not r["isCurrent"], r["id"]))
    return rows


AMBIENT_EVENTS = [
    {"type": "agent", "severity": "info", "summary": "Checkout Failed Agent · dueling-ddqn-v2 serving"},
    {"type": "agent", "severity": "info", "summary": "Cart Abandon Agent · 2h decision ticks active"},
    {"type": "agent", "severity": "info", "summary": "Subscription Failed Agent · renewal lane armed"},
    {"type": "agent", "severity": "info", "summary": "Invoice Overdue Agent · B2B dunning online"},
    {"type": "route", "severity": "ok", "summary": "NPCI UPI rail latency 142ms · healthy"},
    {"type": "cohort", "severity": "ok", "summary": "Validation scenarios · packages/simulator/tasks/val_scenarios.json"},
    {"type": "model", "severity": "info", "summary": "Four wedge policies · packages/policy/weights/"},
    {"type": "webhook", "severity": "info", "summary": "Episode builder · DQN rollout narratives for theater UI"},
    {"type": "budget", "severity": "warn", "summary": "Trust budget enforced · 3 contacts max per episode"},
    {"type": "risk", "severity": "info", "summary": "Guardrail masks applied before argmax Q selection"},
]

RECOVERY_AGENTS = list_agents()
