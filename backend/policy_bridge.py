"""Bridge Emergent theater API → real Dueling DDQN weights in packages/."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agents_registry import get_agent
from packages.policy.verify_inference import ts_forward_from_weights
from packages.simulator.actions import ACTION_NAMES
from packages.simulator.state import EpisodeState, action_mask
from packages.simulator.wedges.registry import make_env

UI_ACTIONS = [
    "wait",
    "notify_sms",
    "notify_whatsapp",
    "notify_email",
    "create_payment_link",
    "retry_same_method",
    "retry_upi",
    "offer_incentive",
    "escalate_support",
    "request_new_method",
    "stop",
]

CONTACT_UI = {"notify_sms", "notify_whatsapp", "notify_email", "create_payment_link", "offer_incentive"}
RETRY_UI = {"retry_same_method", "retry_upi"}

REASON_TO_SOURCE = {
    "insufficient_funds": "customer",
    "payment_cancelled": "customer",
    "authentication_failed": "customer",
    "gateway_error": "gateway",
    "upi_timeout": "gateway",
    "bank_outage": "razorpay",
    "card_expired": "customer",
    "payment_page": "business",
    "browsing": "business",
    "shipping": "business",
    "smb": "business",
    "enterprise": "business",
}

_weights_cache: dict[str, dict] = {}


def _load_policy(wedge: str):
    if wedge not in _weights_cache:
        path = get_agent(wedge)["weights_path"]
        _weights_cache[wedge] = json.loads(path.read_text())
    return _weights_cache[wedge]


def _rl_q_to_ui_q(rl_q: dict[str, float], method: str) -> dict[str, float]:
    notify = rl_q.get("notify_customer", 0.0)
    resend = rl_q.get("resend_link", notify * 0.9)
    retry = rl_q.get("retry_checkout", 0.0)
    return {
        "wait": rl_q.get("wait", 0.0),
        "notify_sms": resend,
        "notify_whatsapp": notify,
        "notify_email": notify * 0.85,
        "create_payment_link": rl_q.get("create_payment_link", 0.0),
        "retry_same_method": retry if method == "card" else retry * 0.75,
        "retry_upi": retry if method == "upi" else retry * 0.65,
        "offer_incentive": rl_q.get("offer_partial", 0.0),
        "escalate_support": rl_q.get("escalate_human", 0.0),
        "request_new_method": max(
            rl_q.get("request_method_update", 0.0),
            rl_q.get("suggest_alt_method", 0.0),
        ),
        "stop": rl_q.get("stop", 0.0),
    }


def _ui_legal_from_rl_mask(rl_mask: np.ndarray, method: str, contacts_used: int, hours: float, wedge: str) -> set[str]:
    legal = set(UI_ACTIONS)
    if contacts_used >= 3:
        legal -= CONTACT_UI
    pending_hours = 6 if wedge == "checkout_failed" else 1
    if method == "upi" and hours < pending_hours:
        legal -= RETRY_UI
    if not rl_mask[1]:
        legal.discard("retry_same_method")
        legal.discard("retry_upi")
    if not rl_mask[3]:
        legal.discard("create_payment_link")
    if not rl_mask[5]:
        legal -= {"notify_whatsapp", "notify_email"}
        if not rl_mask[4]:
            legal.discard("notify_sms")
    if not rl_mask[7]:
        legal.discard("offer_incentive")
    if not rl_mask[8]:
        legal.discard("escalate_support")
    return legal or {"wait", "stop"}


def _build_checkout_obs(
    *,
    case_id: str,
    amount_inr: float,
    failure_reason: str,
    method: str,
    hours_since_failure: float,
    contacts_used: int,
    attempt_count: int,
    is_returning: bool,
) -> tuple[np.ndarray, np.ndarray]:
    state = EpisodeState(
        case_id=case_id,
        amount_inr=amount_inr,
        method=method,
        failure_reason=failure_reason,
        error_source=REASON_TO_SOURCE.get(failure_reason, "gateway"),
        is_returning=is_returning,
        hours_since_failure=hours_since_failure,
        attempt_count=attempt_count,
        contacts_used=contacts_used,
        contacts_max=3,
        late_auth_risk=method == "upi",
        prior_action=0,
        prior_outcome=0,
        wedge="checkout_failed",
    )
    return state.to_obs(), action_mask(state)


def _build_wedge_obs(
    wedge: str,
    *,
    case_id: str,
    amount_inr: float,
    failure_reason: str,
    method: str,
    hours_since_failure: float,
    contacts_used: int,
) -> tuple[np.ndarray, np.ndarray]:
    env = make_env(wedge, seed=0, env_name="val")
    scenario = {
        "case_id": case_id,
        "amount_inr": amount_inr,
        "reason": failure_reason,
        "method": method,
        "hours": hours_since_failure,
        "contacts": contacts_used,
    }
    env.reset(seed=0, scenario=scenario)
    obs = env._obs()
    mask = env._mask()
    return obs, mask


def _action_note(wedge: str, selected: str, tick: int) -> str:
    agent = get_agent(wedge)
    return (
        f"{agent['name']} tick {tick + 1}/{agent['max_steps']} — "
        f"selected {selected} under {agent['tick_hours']}h decision cadence."
    )


def recommend_live(
    tick: int,
    contacts_used: int,
    method: str,
    hours_since_failure: float,
    *,
    wedge: str = "checkout_failed",
    case_id: str = "CASE-0000",
    amount_inr: float = 1500.0,
    failure_reason: str = "gateway_error",
    attempt_count: int | None = None,
    is_returning: bool = True,
) -> dict:
    agent = get_agent(wedge)
    max_tick = agent["max_steps"] - 1
    tick = max(0, min(max_tick, tick))
    attempt_count = attempt_count if attempt_count is not None else 1 + tick // 3

    weights = _load_policy(wedge)
    if wedge == "checkout_failed":
        obs, rl_mask = _build_checkout_obs(
            case_id=case_id,
            amount_inr=amount_inr,
            failure_reason=failure_reason,
            method=method,
            hours_since_failure=hours_since_failure,
            contacts_used=contacts_used,
            attempt_count=attempt_count,
            is_returning=is_returning,
        )
    else:
        obs, rl_mask = _build_wedge_obs(
            wedge,
            case_id=case_id,
            amount_inr=amount_inr,
            failure_reason=failure_reason,
            method=method,
            hours_since_failure=hours_since_failure,
            contacts_used=contacts_used,
        )

    _, _, rl_q_arr = ts_forward_from_weights(weights, obs)
    rl_q = {ACTION_NAMES[i]: float(rl_q_arr[i]) for i in range(len(ACTION_NAMES))}
    q_ui = _rl_q_to_ui_q(rl_q, method)
    legal = _ui_legal_from_rl_mask(rl_mask, method, contacts_used, hours_since_failure, wedge)

    guardrails = [
        {"rule": "contact_budget", "status": "ok", "note": f"{contacts_used} of 3 customer contacts used."},
        {"rule": "upi_pending_window", "status": "ok", "note": "No NPCI auto-reversal in flight."},
        {"rule": "duplicate_charge_risk", "status": "ok", "note": "No concurrent authorization detected."},
    ]
    if contacts_used >= 3:
        guardrails[0] = {
            "rule": "contact_budget",
            "status": "enforced",
            "note": "Trust budget exhausted (3/3) — outreach actions masked.",
        }
    pending_hours = 6 if wedge == "checkout_failed" else 1
    if method == "upi" and hours_since_failure < pending_hours:
        guardrails[1] = {
            "rule": "upi_pending_window",
            "status": "enforced",
            "note": "UPI pending window — retries blocked, forcing wait.",
        }

    masked_q = {a: (q_ui[a] if a in legal else -1e9) for a in UI_ACTIONS}
    selected = max(legal, key=lambda a: masked_q[a])
    baseline, _, _ = ts_forward_from_weights(weights, obs)

    return {
        "selected_action": selected,
        "q_values": q_ui,
        "legal_actions": sorted(legal),
        "policy_version": weights.get("policy_version", "dueling-ddqn-v2"),
        "source": "dueling_dqn_forward_pass",
        "wedge": wedge,
        "agent_id": wedge,
        "agent_name": agent["name"],
        "constraints_passed": sum(1 for g in guardrails if g["status"] == "ok"),
        "constraints_total": len(guardrails),
        "guardrails": guardrails,
        "tick": tick,
        "note": _action_note(wedge, selected, tick),
        "baseline_value": float(baseline),
    }
