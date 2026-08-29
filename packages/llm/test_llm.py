"""
Tests for LLM prompts and scoring stubs.
"""

from __future__ import annotations

import json
import os
import pytest

from packages.llm import get_recovery_prompt, score_copy, REASON_TONE_MAPPING


def test_reason_tone_mapping() -> None:
    assert REASON_TONE_MAPPING["insufficient_funds"] == "patient"
    assert REASON_TONE_MAPPING["gateway_error"] == "technical"


def test_get_recovery_prompt_notify_customer() -> None:
    # Test insufficient funds (patient tone)
    prompt_funds = get_recovery_prompt(
        action="notify_customer",
        failure_reason="insufficient_funds",
        customer_name="Aarav Sharma",
        amount="INR 1,500.00"
    )
    assert "Aarav Sharma" in prompt_funds
    assert "INR 1,500.00" in prompt_funds
    assert "insufficient funds" in prompt_funds
    assert "Customer Support Team" in prompt_funds

    # Test gateway error (technical tone)
    prompt_gateway = get_recovery_prompt(
        action="notify_customer",
        failure_reason="gateway_error",
        customer_name="Amit Verma",
        amount="INR 2,500.00"
    )
    assert "Amit Verma" in prompt_gateway
    assert "INR 2,500.00" in prompt_gateway
    assert "gateway" in prompt_gateway
    assert "Technical Operations Team" in prompt_gateway


def test_get_recovery_prompt_resend_link() -> None:
    # Test insufficient funds (patient tone)
    prompt_funds = get_recovery_prompt(
        action="resend_link",
        failure_reason="insufficient_funds",
        customer_name="Priya Patel",
        amount="INR 4,500.00",
        payment_link="https://rzp.io/i/rec_xyz123"
    )
    assert "Priya Patel" in prompt_funds
    assert "INR 4,500.00" in prompt_funds
    assert "https://rzp.io/i/rec_xyz123" in prompt_funds

    # Test gateway error (technical tone)
    prompt_gateway = get_recovery_prompt(
        action="resend_link",
        failure_reason="gateway_error",
        customer_name="Neha Gupta",
        amount="INR 12,000.00",
        payment_link="https://rzp.io/i/rec_abc789"
    )
    assert "Neha Gupta" in prompt_gateway
    assert "INR 12,000.00" in prompt_gateway
    assert "https://rzp.io/i/rec_abc789" in prompt_gateway


def test_get_recovery_prompt_fallback() -> None:
    # Test fallback to default template
    prompt_fallback = get_recovery_prompt(
        action="notify_customer",
        failure_reason="unknown_reason_here",
        customer_name="John Doe",
        amount="INR 100.00"
    )
    assert "John Doe" in prompt_fallback
    assert "INR 100.00" in prompt_fallback
    assert "unknown reason here" in prompt_fallback


def test_get_recovery_prompt_invalid_action() -> None:
    with pytest.raises(ValueError):
        get_recovery_prompt("invalid_action_name", "insufficient_funds")


def test_score_copy() -> None:
    # Alignment scoring
    score_funds_patient = score_copy("patient", "insufficient_funds")
    score_funds_technical = score_copy("technical", "insufficient_funds")
    
    assert 0.8 <= score_funds_patient <= 1.0
    assert 0.1 <= score_funds_technical <= 0.4
    assert score_funds_patient > score_funds_technical

    score_gateway_technical = score_copy("technical", "gateway_error")
    score_gateway_patient = score_copy("patient", "gateway_error")
    
    assert 0.8 <= score_gateway_technical <= 1.0
    assert 0.3 <= score_gateway_patient <= 0.6
    assert score_gateway_technical > score_gateway_patient


def test_fixtures_match_templates() -> None:
    # Read fixtures.json
    fixtures_path = os.path.join(os.path.dirname(__file__), "fixtures.json")
    with open(fixtures_path, "r") as f:
        fixtures = json.load(f)

    assert len(fixtures) == 6

    for fixture in fixtures:
        customer_name = fixture["customer_name"]
        amount_inr = fixture["amount_inr"]
        failure_reason = fixture["failure_reason"]
        action = fixture["action"]
        payment_link = fixture["payment_link"]
        expected_copy = fixture["drafted_copy"]

        formatted_amount = f"INR {amount_inr:,.2f}"

        generated_copy = get_recovery_prompt(
            action=action,
            failure_reason=failure_reason,
            customer_name=customer_name,
            amount=formatted_amount,
            payment_link=payment_link
        )

        assert generated_copy == expected_copy, f"Fixture mismatch for {fixture['id']}"
