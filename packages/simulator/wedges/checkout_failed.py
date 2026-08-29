from __future__ import annotations

from packages.simulator.env import RecoveryEnv

__all__ = ["CheckoutFailedEnv"]


class CheckoutFailedEnv(RecoveryEnv):
    wedge = "checkout_failed"

    def __init__(self, env_name: str = "train", seed: int | None = None, recovery_gamma: float = 0.98):
        super().__init__(env_name=env_name, seed=seed, recovery_gamma=recovery_gamma)
