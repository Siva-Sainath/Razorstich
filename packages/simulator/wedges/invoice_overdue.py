from __future__ import annotations

from packages.simulator.wedges.base import WedgeRecoveryEnv

__all__ = ["InvoiceOverdueEnv"]


class InvoiceOverdueEnv(WedgeRecoveryEnv):
    wedge = "invoice_overdue"

    def __init__(self, env_name: str = "train", seed: int | None = None):
        super().__init__("invoice_overdue", seed)
