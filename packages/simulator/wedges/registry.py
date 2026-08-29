from __future__ import annotations

from packages.simulator.wedges.cart_abandon import CartAbandonEnv
from packages.simulator.wedges.checkout_failed import CheckoutFailedEnv
from packages.simulator.wedges.invoice_overdue import InvoiceOverdueEnv
from packages.simulator.wedges.subscription_failed import SubscriptionFailedEnv

WEDGE_ENV_REGISTRY = {
    "checkout_failed": CheckoutFailedEnv,
    "cart_abandon": CartAbandonEnv,
    "subscription_failed": SubscriptionFailedEnv,
    "invoice_overdue": InvoiceOverdueEnv,
}


def make_env(wedge: str, seed: int | None = None, env_name: str = "train"):
    if wedge not in WEDGE_ENV_REGISTRY:
        raise ValueError(f"unknown wedge: {wedge}")
    if wedge == "checkout_failed":
        return WEDGE_ENV_REGISTRY[wedge](env_name=env_name, seed=seed)
    return WEDGE_ENV_REGISTRY[wedge](seed=seed)
