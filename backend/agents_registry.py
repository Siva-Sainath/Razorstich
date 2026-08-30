"""RazorStitch recovery agents — four trained Dueling DDQN policies (one per wedge)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

RECOVERY_AGENTS = {
    "checkout_failed": {
        "id": "checkout_failed",
        "name": "Checkout Failed Agent",
        "short_label": "Checkout",
        "description": "Failed checkout — UPI timeouts, issuer declines, gateway errors.",
        "weights_path": ROOT / "packages/policy/weights/checkout_failed.json",
        "window_hours": 72,
        "tick_hours": 6,
        "max_steps": 12,
        "failure_reasons": [
            "insufficient_funds",
            "authentication_failed",
            "gateway_error",
            "upi_timeout",
            "bank_outage",
        ],
        "env_class": "CheckoutFailedEnv",
    },
    "cart_abandon": {
        "id": "cart_abandon",
        "name": "Cart Abandon Agent",
        "short_label": "Cart",
        "description": "Abandoned cart — idle on payment page, browsing, shipping step drop-off.",
        "weights_path": ROOT / "packages/policy/weights/cart_abandon.json",
        "window_hours": 48,
        "tick_hours": 2,
        "max_steps": 24,
        "failure_reasons": ["payment_page", "browsing", "shipping"],
        "env_class": "CartAbandonEnv",
    },
    "subscription_failed": {
        "id": "subscription_failed",
        "name": "Subscription Failed Agent",
        "short_label": "Subscription",
        "description": "Recurring billing failure — expired cards, insufficient funds on renewal.",
        "weights_path": ROOT / "packages/policy/weights/subscription_failed.json",
        "window_hours": 336,
        "tick_hours": 12,
        "max_steps": 28,
        "failure_reasons": ["card_expired", "insufficient_funds", "authentication_failed"],
        "env_class": "SubscriptionFailedEnv",
    },
    "invoice_overdue": {
        "id": "invoice_overdue",
        "name": "Invoice Overdue Agent",
        "short_label": "Invoice",
        "description": "B2B invoice dunning — SMB and enterprise overdue balances.",
        "weights_path": ROOT / "packages/policy/weights/invoice_overdue.json",
        "window_hours": 720,
        "tick_hours": 24,
        "max_steps": 30,
        "failure_reasons": ["smb", "enterprise"],
        "env_class": "InvoiceOverdueEnv",
    },
}


def get_agent(wedge: str) -> dict:
    if wedge not in RECOVERY_AGENTS:
        raise ValueError(f"unknown wedge: {wedge}")
    return RECOVERY_AGENTS[wedge]


def list_agents() -> list[dict]:
    out = []
    for wedge, meta in RECOVERY_AGENTS.items():
        weights = meta["weights_path"]
        policy_version = None
        if weights.exists():
            import json

            policy_version = json.loads(weights.read_text()).get("policy_version")
        out.append(
            {
                "id": wedge,
                "name": meta["name"],
                "short_label": meta["short_label"],
                "description": meta["description"],
                "window_hours": meta["window_hours"],
                "tick_hours": meta["tick_hours"],
                "max_steps": meta["max_steps"],
                "policy_version": policy_version,
                "weights_loaded": weights.exists(),
            }
        )
    return out
