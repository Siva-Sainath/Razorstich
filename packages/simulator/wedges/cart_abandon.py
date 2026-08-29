from __future__ import annotations

from packages.simulator.wedges.base import WedgeRecoveryEnv

__all__ = ["CartAbandonEnv"]


class CartAbandonEnv(WedgeRecoveryEnv):
    wedge = "cart_abandon"

    def __init__(self, env_name: str = "train", seed: int | None = None):
        super().__init__("cart_abandon", seed)
