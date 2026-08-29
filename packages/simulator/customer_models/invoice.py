from __future__ import annotations

import numpy as np


class InvoiceCustomerModel:
    def __init__(self, rng: np.random.Generator):
        self.rng = rng

    def action_success_prob(self, action: int, segment: str, days_overdue: float, contacts: int) -> float:
        fatigue = max(0.4, 1 - 0.15 * contacts)
        enterprise_penalty = 0.75 if segment == "enterprise" else 1.0
        urgency = min(1.2, 0.8 + days_overdue / 30)
        base = {0: 0.02, 5: 0.14, 7: 0.26, 8: 0.22, 9: 0.08}.get(action, 0.05)
        return float(np.clip(base * fatigue * enterprise_penalty * urgency, 0, 0.80))
