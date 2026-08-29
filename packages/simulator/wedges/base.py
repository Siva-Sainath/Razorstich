from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from packages.simulator.actions import ACTION_COST_INR, ACTION_NAMES, RecoveryAction
from packages.simulator.core.masks import wedge_action_mask
from packages.simulator.state import OBS_DIM

WEDGE_NAMES = ("checkout_failed", "cart_abandon", "subscription_failed", "invoice_overdue")


@dataclass
class WedgeState:
    case_id: str
    wedge: str
    amount_inr: float
    reason: str
    method: str
    hours: float = 0.0
    contacts: int = 0
    contacts_max: int = 3
    attempts: int = 0
    recovered: bool = False
    stopped: bool = False
    duplicate: bool = False
    total_cost: float = 0.0
    prior_action: int = 0
    prior_outcome: int = 0
    steps: int = 0


class WedgeRecoveryEnv:
    """Small deterministic-friendly MDP used by all four recovery lanes."""

    def __init__(self, wedge: str, seed: int | None = None):
        if wedge not in WEDGE_NAMES:
            raise ValueError(f"unknown wedge: {wedge}")
        self.wedge = wedge
        self.rng = np.random.default_rng(seed)
        self.state: WedgeState | None = None
        self.step_hours = {"checkout_failed": 6, "cart_abandon": 2, "subscription_failed": 12, "invoice_overdue": 24}[wedge]
        self.max_steps = {"checkout_failed": 12, "cart_abandon": 24, "subscription_failed": 28, "invoice_overdue": 30}[wedge]

    def reset(self, *, seed: int | None = None, scenario: dict | None = None):
        if seed is not None:
            self.rng = np.random.default_rng(seed)
        s = scenario or {}
        defaults = {
            "checkout_failed": "gateway_error",
            "cart_abandon": "payment_page",
            "subscription_failed": "card_expired",
            "invoice_overdue": "smb",
        }
        self.state = WedgeState(
            case_id=str(s.get("case_id", f"{self.wedge[:3].upper()}-{self.rng.integers(10000, 99999)}")),
            wedge=self.wedge,
            amount_inr=float(s.get("amount_inr", self.rng.uniform(499, 4999))),
            reason=str(s.get("reason", defaults[self.wedge])),
            method=str(s.get("method", "card")),
            hours=float(s.get("hours", 0)),
            contacts=int(s.get("contacts", 0)),
        )
        return self._obs(), self._info()

    def _obs(self) -> np.ndarray:
        assert self.state
        s = self.state
        # Keep the deployed 31-dimensional contract, with wedge encoded in reason slots.
        vec = np.zeros(OBS_DIM, dtype=np.float32)
        vec[:8] = [
            np.log1p(s.amount_inr) / 10,
            min(s.hours / (self.step_hours * self.max_steps), 1),
            s.attempts / 5,
            s.contacts / max(s.contacts_max, 1),
            float(s.wedge == "subscription_failed"),
            float(s.wedge == "invoice_overdue"),
            float(s.prior_outcome),
            (s.contacts_max - s.contacts) / max(s.contacts_max, 1),
        ]
        reason_index = {
            "insufficient_funds": 0, "payment_cancelled": 1, "authentication_failed": 2,
            "gateway_error": 3, "upi_timeout": 4, "bank_outage": 5,
            "payment_page": 0, "browsing": 1, "shipping": 2, "card_expired": 2,
            "smb": 0, "enterprise": 1,
        }.get(s.reason, 0)
        vec[8 + reason_index] = 1
        vec[14 + (1 if s.method == "upi" else 0)] = 1
        if 0 <= s.prior_action < 11:
            vec[16 + s.prior_action] = 1
        return vec

    def _mask(self) -> np.ndarray:
        assert self.state
        return wedge_action_mask(self.state)

    def _success_probability(self, action: int) -> float:
        assert self.state
        s = self.state
        fatigue = max(0.35, 1 - 0.2 * s.contacts)
        if self.wedge == "cart_abandon":
            base = {2: .25, 3: .30, 5: .18, 7: .12, 0: .02}.get(action, .04)
            return base * max(.2, 1 - s.hours / 48) * fatigue
        if self.wedge == "subscription_failed":
            base = {6: .42 if s.reason == "card_expired" else .12, 5: .20, 3: .16, 0: .03}.get(action, .05)
            return base * fatigue
        if self.wedge == "invoice_overdue":
            base = {7: .28, 5: .16, 8: .22, 3: .12, 0: .02}.get(action, .04)
            return base * fatigue
        base = {0: .06, 1: .20, 2: .18, 3: .24, 5: .10, 8: .30}.get(action, .05)
        if s.reason == "insufficient_funds" and s.hours < 12 and action == 5:
            base *= .4
        return base * fatigue

    def step(self, action: int):
        assert self.state
        s = self.state
        valid = self._mask()
        invalid = not valid[action]
        if invalid:
            action = int(RecoveryAction.WAIT)

        from packages.policy.reward import RewardCalculator

        calc = RewardCalculator(normalize_for_training=True)
        cost = ACTION_COST_INR.get(RecoveryAction(action), 0.0)
        s.total_cost += cost
        if action in (2, 4, 5, 6):
            s.contacts += 1
        s.prior_action = action
        s.attempts += int(action not in (0, 10))
        reward = calc.step_reward(
            action=action,
            amount_inr=s.amount_inr,
            contacts_used=s.contacts,
            contacts_max=s.contacts_max,
            invalid_action=invalid,
            duplicate=s.duplicate,
            recovered=False,
            comm_cost=s.total_cost,
            is_wait=action == int(RecoveryAction.WAIT),
        )
        if action == int(RecoveryAction.STOP):
            s.stopped = True
        elif self.rng.random() < self._success_probability(action):
            s.recovered = True
            reward += s.amount_inr * (.98 ** s.steps)
            s.prior_outcome = 1
        else:
            s.prior_outcome = -1
        if self.wedge == "checkout_failed" and s.method == "upi" and action in (1, 3) and s.hours < 1 and self.rng.random() < .35:
            s.duplicate = True
            reward -= s.amount_inr * .5
        s.hours += self.step_hours
        s.steps += 1
        done = s.recovered or s.stopped or s.steps >= self.max_steps
        if s.steps >= self.max_steps and not s.recovered:
            reward += calc.step_reward(
                action=int(RecoveryAction.WAIT),
                amount_inr=s.amount_inr,
                contacts_used=s.contacts,
                contacts_max=s.contacts_max,
                invalid_action=False,
                duplicate=s.duplicate,
                recovered=False,
                comm_cost=0.0,
                episode_timed_out=True,
            )
        return self._obs(), reward, done, False, self._info()

    def _info(self) -> dict:
        assert self.state
        return {"wedge": self.wedge, "action_mask": self._mask(), "q_context": {"reason": self.state.reason, "hours": self.state.hours}}
