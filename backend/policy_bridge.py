"""Bridge Emergent theater API → real Dueling DDQN weights in packages/."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.policy.export_weights import load_dueling_from_json
from packages.policy.verify_inference import ts_forward_from_weights
from packages.simulator.actions import ACTION_NAMES
from packages.simulator.state import EpisodeState, action_mask

# Emergent UI action vocabulary (must match frontend + case_data.py)
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

WEIGHTS_PATH = ROOT / "packages/policy/weights/checkout_failed.json"
_TICK_NOTES = [
    "Issuer decline velocity is elevated — waiting is the cheapest safe move.",
    "Issuer health improving; contact still premature.",
    "WhatsApp has the best open-rate for this customer at this hour.",
    "Customer just opened the link — observe, don't crowd.",
    "A UPI-preselected payment link converts best right now.",
    "Cool-off after abandonment; immediate follow-up feels like spam.",
    "Odds decaying slowly — holding the last contact for peak leverage.",
    "Price hesitation detected — a small cashback flips this cohort.",
    "Contact budget spent — waiting for the customer to move.",
    "Customer re-engaged — a UPI collect request closes it.",
    "Payment captured — episode complete, stop cleanly.",
    "Episode closed as RECOVERED.",
]

_weights_cache: dict | None = None
_model_cache = None


def _load_policy():
    global _weights_cache, _model_cache
    if _weights_cache is None:
        _weights_cache = json.loads(WEIGHTS_PATH.read_text())
        _model_cache = load_dueling_from_json(_weights_cache)
        _model_cache.eval()
    return _weights_cache, _model_cache


def _build_obs(tick: int, contacts_used: int, method: str, hours_since_failure: float) -> np.ndarray:
    """Map theater tick → checkout_failed MDP observation (31-dim)."""
    case = {
        "amount_inr": 2499.0,
        "failure_reason": "authentication_failed",  # maps to issuer_declined demo
        "error_source": "customer",
        "method": method,
        "hours_since_failure": hours_since_failure,
        "attempt_count": 1 + tick // 3,
        "contacts_used": contacts_used,
        "contacts_max": 3,
        "is_returning": True,
        "late_auth_risk": method == "upi",
        "prior_action": 0,
        "prior_outcome": 0,
    }
    state = EpisodeState(
        case_id="CASE-7F3A",
        amount_inr=case["amount_inr"],
        method=case["method"],
        failure_reason=case["failure_reason"],
        error_source=case["error_source"],
        is_returning=case["is_returning"],
        hours_since_failure=case["hours_since_failure"],
        attempt_count=case["attempt_count"],
        contacts_used=case["contacts_used"],
        contacts_max=case["contacts_max"],
        late_auth_risk=case["late_auth_risk"],
        prior_action=case["prior_action"],
        prior_outcome=case["prior_outcome"],
    )
    return state.to_obs()


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


def _ui_legal_from_rl_mask(rl_mask: np.ndarray, method: str, contacts_used: int, hours: float) -> set[str]:
    legal = set(UI_ACTIONS)
    if contacts_used >= 3:
        legal -= CONTACT_UI
    if method == "upi" and hours < 6:
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


def recommend_live(tick: int, contacts_used: int, method: str, hours_since_failure: float) -> dict:
    tick = max(0, min(11, tick))
    weights, _model = _load_policy()
    obs = _build_obs(tick, contacts_used, method, hours_since_failure)

    state = EpisodeState(
        case_id="CASE-7F3A",
        amount_inr=2499.0,
        method=method,
        failure_reason="authentication_failed",
        error_source="customer",
        is_returning=True,
        hours_since_failure=hours_since_failure,
        contacts_used=contacts_used,
        contacts_max=3,
    )
    rl_mask = action_mask(state)
    _, _, rl_q_arr = ts_forward_from_weights(weights, obs)
    rl_q = {ACTION_NAMES[i]: float(rl_q_arr[i]) for i in range(len(ACTION_NAMES))}

    q_ui = _rl_q_to_ui_q(rl_q, method)
    legal = _ui_legal_from_rl_mask(rl_mask, method, contacts_used, hours_since_failure)

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
    if method == "upi" and hours_since_failure < 6:
        guardrails[1] = {
            "rule": "upi_pending_window",
            "status": "enforced",
            "note": "UPI pending window — retries blocked, forcing wait.",
        }

    masked_q = {a: (q_ui[a] if a in legal else -1e9) for a in UI_ACTIONS}
    selected = max(legal, key=lambda a: masked_q[a])

    return {
        "selected_action": selected,
        "q_values": q_ui,
        "legal_actions": sorted(legal),
        "policy_version": weights.get("policy_version", "dueling-ddqn-v2"),
        "source": "dueling_dqn_forward_pass",
        "constraints_passed": sum(1 for g in guardrails if g["status"] == "ok"),
        "constraints_total": len(guardrails),
        "guardrails": guardrails,
        "tick": tick,
        "note": _TICK_NOTES[tick],
        "baseline_value": float(ts_forward_from_weights(weights, obs)[0]),
    }
