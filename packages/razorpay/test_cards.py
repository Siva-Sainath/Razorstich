"""Razorpay Test Mode scenarios for demo scripts — verify numbers against official docs."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TestScenario:
    name: str
    failure_reason: str
    method: str
    notes: str
    razorpay_doc: str = "https://razorpay.com/docs/payments/payments/test-card-details/"


# Card numbers change in Razorpay docs — use dashboard doc as source of truth.
# These scenarios describe WHAT to demo, not hardcoded PANs.
DEMO_SCENARIOS: list[TestScenario] = [
    TestScenario(
        name="insufficient_funds_card",
        failure_reason="insufficient_funds",
        method="card",
        notes="Use Razorpay 'payment failed' test card from docs. Expect payment.failed webhook.",
    ),
    TestScenario(
        name="auth_failure_3ds",
        failure_reason="authentication_failed",
        method="card",
        notes="Fail 3DS / OTP step in test checkout.",
    ),
    TestScenario(
        name="upi_timeout",
        failure_reason="upi_timeout",
        method="upi",
        notes="Use test VPA from Razorpay UPI docs; may get failed then captured on retry.",
    ),
    TestScenario(
        name="success_recovery",
        failure_reason="insufficient_funds",
        method="card",
        notes="Fail first, policy recommends wait/link, customer pays with success test card 4111…",
    ),
    TestScenario(
        name="gateway_error",
        failure_reason="gateway_error",
        method="card",
        notes="Use gateway failure scenario from Razorpay test documentation.",
    ),
]
