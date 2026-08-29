"""Hidden customer response model — not visible to the policy."""

from __future__ import annotations

import numpy as np

FAILURE_REASONS = [
    "insufficient_funds",
    "payment_cancelled",
    "authentication_failed",
    "gateway_error",
    "upi_timeout",
    "bank_outage",
]

ERROR_SOURCES = ["customer", "gateway", "business", "razorpay"]


class CustomerResponseModel:
    """Probabilistic recovery dynamics hidden from the agent."""

    def __init__(self, rng: np.random.Generator, env_name: str = "train"):
        self.rng = rng
        self.env_name = env_name
        self._shift = 1.0 if env_name == "shift" else 1.0
        if env_name == "bank_outage":
            self._shift = 0.4
        if env_name == "adversarial":
            self._shift = 0.7

    def spontaneous_recovery_prob(self, reason: str, hours: float) -> float:
        base = {
            "insufficient_funds": 0.02 + 0.08 * min(hours / 72.0, 1.0),
            "payment_cancelled": 0.01,
            "authentication_failed": 0.03,
            "gateway_error": 0.15 * self._shift,
            "upi_timeout": 0.12,
            "bank_outage": 0.05 * self._shift,
        }.get(reason, 0.02)
        return float(np.clip(base, 0, 0.35))

    def action_success_prob(
        self,
        action: int,
        reason: str,
        contacts_used: int,
        hours: float,
        amount_inr: float,
    ) -> float:
        """P(recovery | action) — hidden from policy."""
        fatigue = max(0.35, 1.0 - 0.22 * contacts_used)
        table = {
            0: 0.0,  # wait — handled via spontaneous
            1: {"insufficient_funds": 0.08, "gateway_error": 0.25}.get(reason, 0.12),
            2: 0.18 if reason in ("authentication_failed", "upi_timeout") else 0.10,
            3: 0.22 if amount_inr < 2000 else 0.14,
            4: 0.12,
            5: 0.10 * fatigue,
            6: 0.16 if reason == "insufficient_funds" else 0.08,
            7: 0.08,
            8: 0.30,
            9: 0.05,
            10: 0.0,
        }
        p = table.get(action, 0.05)
        if isinstance(p, dict):
            p = 0.1
        if action == 0:
            p = self.spontaneous_recovery_prob(reason, hours)
        # insufficient funds: better after 24h wait before notify
        if reason == "insufficient_funds" and action == 5 and hours < 12:
            p *= 0.5
        if reason == "insufficient_funds" and action == 0 and hours >= 24:
            p *= 1.8
        return float(np.clip(p * self._shift * fatigue, 0, 0.85))

    def duplicate_payment_risk(self, action: int, reason: str, hours: float) -> float:
        if reason == "upi_timeout" and action in (1, 3) and hours < 1:
            return 0.35
        return 0.02 if action in (1, 3, 4) else 0.0
