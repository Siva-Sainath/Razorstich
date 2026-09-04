"""Build theater case payloads from validation scenarios + real DQN rollouts."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agents_registry import get_agent
from packages.policy.baselines import (
    AlwaysPaymentLinkPolicy,
    AlwaysWaitPolicy,
    FailureRulesPolicy,
    ImmediateRetryPolicy,
)
from packages.policy.verify_inference import ts_forward_from_weights
from packages.simulator.actions import ACTION_NAMES, RecoveryAction
from packages.simulator.tasks.scenarios import load_val_scenarios
from packages.simulator.wedges.registry import make_env
from eval_stats import load_shipped_benchmark, shipped_model

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

DECLINE_LABELS = {
    "insufficient_funds": ("51", "INSUFFICIENT_FUNDS"),
    "authentication_failed": ("05", "DO_NOT_HONOR"),
    "gateway_error": ("91", "GATEWAY_TIMEOUT"),
    "upi_timeout": ("UPI", "COLLECT_EXPIRED"),
    "bank_outage": ("91", "BANK_UNAVAILABLE"),
    "payment_page": ("—", "CART_IDLE"),
    "browsing": ("—", "CART_IDLE"),
    "shipping": ("—", "SHIPPING_DROP"),
    "card_expired": ("54", "EXPIRED_CARD"),
    "smb": ("—", "INVOICE_OVERDUE"),
    "enterprise": ("—", "INVOICE_OVERDUE"),
}

_weights_cache: dict[str, dict] = {}


def _load_weights(wedge: str) -> dict:
    if wedge not in _weights_cache:
        path = get_agent(wedge)["weights_path"]
        _weights_cache[wedge] = json.loads(path.read_text())
    return _weights_cache[wedge]


def _reason_to_source(reason: str) -> str:
    return REASON_TO_SOURCE.get(reason, "gateway")


def _rl_action_to_ui(rl_action: int, method: str) -> str:
    name = ACTION_NAMES[rl_action]
    mapping = {
        "wait": "wait",
        "retry_checkout": "retry_upi" if method == "upi" else "retry_same_method",
        "suggest_alt_method": "request_new_method",
        "create_payment_link": "create_payment_link",
        "resend_link": "notify_sms",
        "notify_customer": "notify_whatsapp",
        "request_method_update": "request_new_method",
        "offer_partial": "offer_incentive",
        "escalate_human": "escalate_support",
        "reconcile": "wait",
        "stop": "stop",
    }
    return mapping.get(name, "wait")


def _channel_for_ui_action(ui_action: str) -> str:
    return {
        "notify_whatsapp": "WhatsApp",
        "notify_sms": "SMS",
        "notify_email": "Email",
        "create_payment_link": "SMS",
        "offer_incentive": "SMS",
        "retry_upi": "UPI",
        "retry_same_method": "Card",
        "escalate_support": "Support",
        "request_new_method": "Email",
        "wait": "Internal",
        "stop": "Internal",
    }.get(ui_action, "Internal")


def _rl_to_draft_action(rl_action: int) -> str:
    name = ACTION_NAMES[rl_action]
    if name in ("notify_customer", "resend_link"):
        return name
    if name == "create_payment_link":
        return "resend_link"
    return "notify_customer"


def _select_from_weights(weights: dict, obs: np.ndarray, mask: np.ndarray) -> tuple[int, dict[str, float]]:
    _, _, q = ts_forward_from_weights(weights, obs)
    q = q.astype(np.float64)
    masked = q.copy()
    masked[~mask] = -1e9
    action = int(np.argmax(masked))
    rl_q = {ACTION_NAMES[i]: float(q[i]) for i in range(len(ACTION_NAMES))}
    return action, rl_q


def _init_checkout_env(env, scenario: dict, seed: int):
    env.rng = np.random.default_rng(seed)
    env.customer.rng = env.rng
    env.reset(seed=seed)
    assert env.state is not None
    reason = scenario.get("reason", "gateway_error")
    env.state.case_id = scenario.get("case_id", env.state.case_id)
    env.state.amount_inr = float(scenario.get("amount_inr", env.state.amount_inr))
    env.state.method = str(scenario.get("method", env.state.method))
    env.state.failure_reason = reason
    env.state.error_source = _reason_to_source(reason)
    env.state.hours_since_failure = float(scenario.get("hours", 0))
    env.state.is_returning = bool(scenario.get("is_returning", True))
    env.state.late_auth_risk = env.state.method == "upi"
    return env.state.to_obs(), env._info()


def _init_wedge_env(env, scenario: dict, seed: int):
    if hasattr(env, "rng"):
        env.rng = np.random.default_rng(seed)
    return env.reset(seed=seed, scenario=scenario)


def _belief_p(env, wedge: str, action: int, recovered: bool) -> float:
    """Hidden-model recovery belief after an action — from simulator dynamics, not UI decoration."""
    if recovered:
        return 1.0
    if wedge == "checkout_failed":
        s = env.state
        if action == int(RecoveryAction.WAIT):
            return env.customer.spontaneous_recovery_prob(s.failure_reason, s.hours_since_failure)
        return env.customer.action_success_prob(
            action,
            s.failure_reason,
            s.contacts_used,
            s.hours_since_failure,
            s.amount_inr,
        )
    if hasattr(env, "_success_probability"):
        return float(env._success_probability(action))
    return 0.08


def _rollout_policy(wedge: str, scenario: dict, seed: int, policy) -> dict:
    env = make_env(wedge, seed=seed, env_name="val")
    if wedge == "checkout_failed":
        obs, info = _init_checkout_env(env, scenario, seed)
    else:
        obs, info = _init_wedge_env(env, scenario, seed)

    steps = []
    curve = []
    contacts = 0
    agent_meta = get_agent(wedge)
    max_steps = agent_meta["max_steps"]
    window_hours = agent_meta["window_hours"]

    if wedge == "checkout_failed":
        start_prob = env.customer.spontaneous_recovery_prob(
            env.state.failure_reason, env.state.hours_since_failure
        )
    elif hasattr(env, "_success_probability"):
        start_prob = float(env._success_probability(int(RecoveryAction.WAIT)))
    else:
        start_prob = 0.08

    curve.append({"t": 0.0, "p": round(start_prob, 3)})

    step_idx = 0
    last_action = int(RecoveryAction.WAIT)
    while step_idx < max_steps:
        mask = info["action_mask"]
        q_values = None
        legal_actions = [ACTION_NAMES[i] for i, ok in enumerate(mask) if ok]
        if policy != "dqn":
            action = policy.select_action(obs, mask, info)
        else:
            weights = _load_weights(wedge)
            action, q_values = _select_from_weights(weights, obs, mask)

        obs, _, done, trunc, info = env.step(action)
        step_idx += 1
        last_action = action

        if wedge == "checkout_failed":
            state = env.state
            hours = state.hours_since_failure
            method = state.method
            contacts = state.contacts_used
            recovered = state.recovered
        else:
            state = env.state
            hours = state.hours
            method = state.method
            contacts = state.contacts
            recovered = state.recovered

        t_norm = min(1.0, hours / window_hours)
        if recovered:
            p_belief = 1.0
        else:
            p_belief = _belief_p(env, wedge, last_action, False)
        curve.append({"t": round(t_norm, 4), "p": round(p_belief, 3)})

        ui_action = _rl_action_to_ui(action, method)
        step_row = {
            "step": step_idx,
            "rl_action": ACTION_NAMES[action],
            "ui_action": ui_action,
            "hours": hours,
            "t": t_norm,
            "contacts": contacts,
            "recovered": recovered,
            "belief_p": round(p_belief, 3),
            "legal_actions": legal_actions,
        }
        if q_values is not None:
            step_row["q_values"] = {k: round(v, 4) for k, v in q_values.items()}
        steps.append(step_row)
        if done or trunc:
            break

    recovered = bool(getattr(env.state, "recovered", False))
    final_t = min(1.0, steps[-1]["t"] if steps else 0.0)
    final_p = 1.0 if recovered else (steps[-1]["belief_p"] if steps else start_prob)
    if recovered:
        curve.append({"t": round(final_t, 4), "p": 1.0})
    curve.append({"t": 1.0, "p": round(final_p, 3)})

    return {
        "steps": steps,
        "curve": curve,
        "recovered": recovered,
        "final_prob": round(final_p, 3),
        "contacts": contacts,
    }


def _ghost_reason(policy_name: str, recovered: bool, chosen: bool, contacts: int, steps: int) -> str:
    outcome = "Recovered in simulator" if recovered else "Did not recover in simulator"
    if chosen:
        return f"{outcome} — shipped DQN on this validation seed · {steps} ticks · {contacts} contacts."
    return f"{outcome} — same seed as DQN · {policy_name} · {steps} ticks · {contacts} contacts."


def _build_ghost_runs(
    wedge: str,
    scenario: dict,
    seed: int,
    chosen_rollout: dict,
) -> list[dict]:
    baselines = [
        ("gr-dqn", "Shipped DQN", True, None),
        ("gr-retry", "Immediate retry baseline", False, ImmediateRetryPolicy()),
        ("gr-wait", "Wait-only baseline", False, AlwaysWaitPolicy()),
        ("gr-rules", "Failure-rules heuristic", False, FailureRulesPolicy()),
        ("gr-link", "Always payment link", False, AlwaysPaymentLinkPolicy()),
    ]
    runs = []
    for run_id, label, is_chosen, policy in baselines:
        if is_chosen:
            result = chosen_rollout
            policy_name = "dqn"
        else:
            result = _rollout_policy(wedge, scenario, seed, policy)
            policy_name = policy.name
        recovered = bool(result["recovered"])
        runs.append(
            {
                "id": run_id,
                "label": label,
                "prob": round(float(result["final_prob"]), 3),
                "recovered": recovered,
                "contacts": int(result.get("contacts") or 0),
                "steps": len(result.get("steps") or []),
                "chosen": is_chosen,
                "reason": _ghost_reason(
                    policy_name,
                    recovered,
                    is_chosen,
                    int(result.get("contacts") or 0),
                    len(result.get("steps") or []),
                ),
                "points": result["curve"],
            }
        )
    return runs


def _build_events(wedge: str, scenario: dict, rollout: dict) -> list[dict]:
    agent = get_agent(wedge)
    reason = scenario.get("reason", "gateway_error")
    amount = float(scenario.get("amount_inr", 1500))
    method = scenario.get("method", "card")
    case_id = scenario.get("case_id", "CASE-0000")
    _, decline = DECLINE_LABELS.get(reason, ("—", reason.upper()))
    events = [
        {
            "t": 0.0,
            "type": "failure",
            "severity": "fail",
            "label": f"payment.failed · {method} · {decline}",
            "detail": f"error_source: {_reason_to_source(reason)} · wedge: {wedge}.",
        },
        {
            "t": 0.03,
            "type": "observe",
            "severity": "info",
            "label": f"{agent['name']} ingested signals · episode opened ({agent['window_hours']}h)",
            "detail": f"Policy {agent['id']} · validation scenario {case_id}.",
        },
    ]

    for step in rollout["steps"]:
        ui = step["ui_action"]
        tick = step["step"]
        t = step["t"]
        events.append(
            {
                "t": round(t * 0.95, 4),
                "type": "policy_eval",
                "severity": "info",
                "label": f"Tick {tick} · DQN chose {ui}",
                "detail": (
                    f"RL action {step['rl_action']} · T+{int(step['hours'])}h"
                    + (
                        f" · Q({step['rl_action']})={step['q_values'][step['rl_action']]:.2f}"
                        if step.get("q_values") and step["rl_action"] in step["q_values"]
                        else ""
                    )
                    + "."
                ),
            }
        )
        if ui not in ("wait", "stop"):
            events.append(
                {
                    "t": round(min(0.99, t * 0.95 + 0.012), 4),
                    "type": "intervention",
                    "severity": "info",
                    "label": f"{_channel_for_ui_action(ui)} outreach · contact {step['contacts']} of 3",
                    "detail": f"Executed {ui} via {_channel_for_ui_action(ui)}.",
                }
            )
        if step["recovered"]:
            events.append(
                {
                    "t": round(min(0.99, t), 4),
                    "type": "captured",
                    "severity": "ok",
                    "label": f"Payment captured · ₹{amount:,.0f} recovered",
                    "detail": f"Episode closed as RECOVERED by {agent['name']}.",
                }
            )
            break

    if not rollout["recovered"]:
        events.append(
            {
                "t": 0.99,
                "type": "observe",
                "severity": "warn",
                "label": "Window elapsed without capture",
                "detail": "Episode timed out — policy chose stop or max steps reached.",
            }
        )
    return sorted(events, key=lambda e: e["t"])


def _build_stages(rollout: dict) -> list[dict]:
    stages = [{"from": 0.0, "key": "triage", "label": "Failure triage"}]
    for i, step in enumerate(rollout["steps"]):
        key = f"step_{i}"
        label = step["ui_action"].replace("_", " ")
        stages.append({"from": round(step["t"] * 0.9, 4), "key": key, "label": label})
    if rollout["recovered"]:
        stages.append({"from": rollout["steps"][-1]["t"], "key": "capture", "label": "Recovered"})
    return stages


def _build_interventions(wedge: str, scenario: dict, rollout: dict) -> dict:
    amount = float(scenario.get("amount_inr", 1500))
    reason = scenario.get("reason", "gateway_error")
    case_id = str(scenario.get("case_id", "VAL-000"))
    amount_str = f"₹{amount:,.0f}"
    agent_name = get_agent(wedge)["name"]
    out = {
        "triage": {
            "action": "wait",
            "channel": "Internal",
            "timing": "Tick 0",
            "message": f"{agent_name} opened {case_id} · {reason.replace('_', ' ')} · {amount_str} · no contact yet.",
            "incentive": None,
            "confidence": rollout["steps"][0]["belief_p"] if rollout["steps"] else 0.08,
        }
    }
    for i, step in enumerate(rollout["steps"]):
        key = f"step_{i}" if i > 0 or step["ui_action"] != "wait" else "triage"
        ui = step["ui_action"]
        rl = step["rl_action"]
        msg = (
            f"{case_id} · tick {step['step']} · policy {rl} → {ui} · "
            f"T+{int(step['hours'])}h · {reason.replace('_', ' ')} · {amount_str}"
        )
        incentive = None
        if ui == "offer_incentive":
            incentive = f"₹{max(20, int(amount * 0.02))} sim incentive"

        out[key] = {
            "action": ui,
            "channel": _channel_for_ui_action(ui),
            "timing": f"Tick {step['step']} · T+{int(step['hours'])}h",
            "message": msg[:420],
            "incentive": incentive,
            "confidence": min(0.98, float(step.get("belief_p", 0.5))),
        }
    if rollout["recovered"]:
        out["capture"] = {
            "action": "stop",
            "channel": "Internal",
            "timing": "Episode closed",
            "message": f"{case_id} recovered in simulator · net logged to reward.",
            "incentive": None,
            "confidence": 1.0,
        }
    return out


def _build_trust_ledger(rollout: dict) -> list[dict]:
    ledger = []
    for step in rollout["steps"]:
        if step["ui_action"] in ("wait", "stop", "retry_same_method", "retry_upi"):
            continue
        ledger.append(
            {
                "t": round(step["t"] * 0.95, 4),
                "delta": -1,
                "reason": step["ui_action"].replace("_", " "),
            }
        )
    return ledger


def _network_path(reason: str, method: str, wedge: str, error_source: str) -> list[dict]:
    code, decline = DECLINE_LABELS.get(reason, ("—", reason.upper().replace("_", " ")))
    if wedge == "cart_abandon":
        return [
            {"node": "Session", "status": "ok", "meta": f"{method} · cart lane"},
            {"node": "Abandon signal", "status": "fail", "meta": reason.replace("_", " ")},
            {"node": "Error source", "status": "warn", "meta": error_source},
        ]
    if wedge == "invoice_overdue":
        return [
            {"node": "Invoice state", "status": "fail", "meta": reason.replace("_", " ")},
            {"node": "Dunning MDP", "status": "ok", "meta": f"{wedge} agent"},
            {"node": "Amount at risk", "status": "warn", "meta": method},
        ]
    if wedge == "subscription_failed":
        return [
            {"node": "Renewal", "status": "fail", "meta": reason.replace("_", " ")},
            {"node": "Payment method", "status": "ok", "meta": method},
            {"node": "Decline code", "status": "fail", "meta": f"{code} {decline}"},
        ]
    return [
        {"node": "Payment method", "status": "ok", "meta": method},
        {"node": "Failure reason", "status": "fail", "meta": reason.replace("_", " ")},
        {"node": "Error source", "status": "warn", "meta": error_source},
        {"node": "Decline signal", "status": "fail", "meta": f"{code} {decline}"},
    ]


def build_case_payload(wedge: str, scenario: dict, seed: int = 42) -> dict:
    agent = get_agent(wedge)
    rollout = _rollout_policy(wedge, scenario, seed, policy="dqn")
    reason = scenario.get("reason", "gateway_error")
    amount = float(scenario.get("amount_inr", 1500))
    method = str(scenario.get("method", "card"))
    case_id = str(scenario.get("case_id", f"{wedge[:3].upper()}-001"))
    code, decline = DECLINE_LABELS.get(reason, ("—", reason.upper()))
    error_source = _reason_to_source(reason)
    failed_at = datetime.now(timezone.utc) - timedelta(hours=float(scenario.get("hours", 0)))

    weights = _load_weights(wedge)
    recovered_at = None
    if rollout["recovered"] and rollout["steps"]:
        recovered_at = rollout["steps"][-1]["t"]

    return {
        "case": {
            "id": case_id,
            "paymentId": f"pay_{case_id.replace('-', '').lower()[:14]}",
            "orderId": f"order_{case_id.replace('-', '').lower()[:10]}",
            "merchant": agent["name"],
            "amount": amount,
            "currency": "INR",
            "customer": case_id,
            "method": method,
            "failedAt": failed_at.astimezone(timezone(timedelta(hours=5, minutes=30))).isoformat(),
            "windowHours": agent["window_hours"],
            "tickHours": agent["tick_hours"],
            "maxSteps": agent["max_steps"],
            "declineCode": code,
            "declineReason": decline,
            "failureReason": reason,
            "errorSource": error_source,
            "status": "recovered" if rollout["recovered"] else "recovering",
            "maxContacts": 3,
            "wedge": wedge,
            "agentId": wedge,
            "agentName": agent["name"],
            "policyVersion": weights.get("policy_version"),
            "modelGen": shipped_model(wedge)["gen"],
            "modelShipped": shipped_model(wedge)["shipped"],
            "recoveredAt": recovered_at,
            "scenarioSeed": seed,
        },
        "events": _build_events(wedge, scenario, rollout),
        "recoveryCurve": rollout["curve"],
        "ghostRuns": _build_ghost_runs(wedge, scenario, seed, rollout),
        "benchmark": load_shipped_benchmark(wedge),
        "model": shipped_model(wedge),
        "stages": _build_stages(rollout),
        "interventions": _build_interventions(wedge, scenario, rollout),
        "trustLedger": _build_trust_ledger(rollout),
        "riskSignals": [
            {"k": "wedge", "v": wedge, "tone": "ok"},
            {"k": "failure_reason", "v": reason, "tone": "warn"},
            {"k": "policy_version", "v": weights.get("policy_version", "—"), "tone": "ok"},
            {"k": "method", "v": method, "tone": "ok"},
            {"k": "amount_inr", "v": f"{amount:,.0f}", "tone": "ok"},
            {"k": "sim_recovered", "v": str(rollout["recovered"]), "tone": "ok" if rollout["recovered"] else "warn"},
        ],
        "networkPath": _network_path(reason, method, wedge, error_source),
        "rollout": rollout["steps"],
    }


def build_all_cases(seed: int = 42) -> dict[str, dict]:
    scenarios = load_val_scenarios()
    cases = {}
    for wedge, rows in scenarios.items():
        for i, scenario in enumerate(rows):
            case_id = scenario["case_id"]
            cases[case_id] = build_case_payload(wedge, scenario, seed=seed + i * 13)
    return cases


DEFAULT_CASE_ID = "VAL-CHK-004"
