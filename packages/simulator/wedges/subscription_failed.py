from __future__ import annotations

from packages.simulator.wedges.base import WedgeRecoveryEnv

__all__ = ["SubscriptionFailedEnv"]


class SubscriptionFailedEnv(WedgeRecoveryEnv):
    wedge = "subscription_failed"

    def __init__(self, env_name: str = "train", seed: int | None = None):
        super().__init__("subscription_failed", seed)
