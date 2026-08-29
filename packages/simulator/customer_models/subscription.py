from __future__ import annotations

import numpy as np


class SubscriptionCustomerModel:
    def __init__(self, rng: np.random.Generator):
        self.rng = rng

    def action_success_prob(self, action: int, reason: str, hours: float, contacts: int) -> float:
        fatigue = max(0.35, 1 - 0.18 * contacts)
        if reason == "card_expired" and action == 6:
            base = 0.45
        elif reason == "insufficient_funds" and action == 0 and hours >= 24:
            base = 0.12
        else:
            base = {0: 0.04, 3: 0.16, 5: 0.20, 6: 0.14, 8: 0.28}.get(action, 0.06)
        return float(np.clip(base * fatigue, 0, 0.85))
