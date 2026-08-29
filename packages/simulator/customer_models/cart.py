from __future__ import annotations

import numpy as np


class CartCustomerModel:
    def __init__(self, rng: np.random.Generator):
        self.rng = rng

    def action_success_prob(self, action: int, hours: float, contacts: int, amount_inr: float) -> float:
        fatigue = max(0.35, 1 - 0.2 * contacts)
        early_boost = 1.4 if hours < 2 else 1.0 if hours < 24 else 0.45
        table = {0: 0.02, 2: 0.22, 3: 0.32, 5: 0.18, 7: 0.14, 4: 0.12}
        return float(np.clip(table.get(action, 0.05) * early_boost * fatigue, 0, 0.85))
