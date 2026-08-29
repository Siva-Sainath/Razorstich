"""
Benchmark/ablation stubs for evaluating drafted recovery copy.
This does not call real LLM APIs; it provides mock score ranges based on alignment
between the copy tone and the failure reason.
"""

from __future__ import annotations

# Expected tone suitability scores based on failure reason
TONE_ALIGNMENT_SCORES: dict[str, dict[str, float]] = {
    "insufficient_funds": {
        "patient": 0.95,      # Highly appropriate: gentle, understanding, patient
        "supportive": 0.85,   # Appropriate: helpful
        "reassuring": 0.80,   # Reassuring
        "reminder": 0.60,     # Slightly pushy
        "technical": 0.30,    # Inappropriate: too technical/cold for insufficient funds
        "default": 0.50,
    },
    "gateway_error": {
        "technical": 0.98,    # Highly appropriate: transparent, details the technical failure
        "reassuring": 0.85,   # reassuring that it is not their fault
        "supportive": 0.70,
        "patient": 0.50,      # Out of context: being patient with them when it's our gateway fault
        "reminder": 0.30,     # pushy reminder is very bad for gateway failure
        "default": 0.50,
    },
    "bank_outage": {
        "technical": 0.95,    # Highly appropriate
        "reassuring": 0.85,
        "patient": 0.50,
        "default": 0.50,
    },
    "upi_timeout": {
        "reminder": 0.95,     # High score: active reminder to retry/complete checkout
        "reassuring": 0.80,
        "technical": 0.70,
        "patient": 0.50,
        "default": 0.50,
    },
}


def score_copy(tone: str, failure_reason: str) -> float:
    """
    Mock evaluation function that scores the copy's quality and alignment (0.0 to 1.0)
    given the tone and failure reason.

    In ablation studies, this mimics a judge LLM evaluation that scores if the message
    tone is optimized for the root cause of the payment failure.

    Args:
        tone: The tone of the generated copy (e.g. 'patient', 'technical', 'supportive', etc.)
        failure_reason: The transaction failure reason.

    Returns:
        A score between 0.0 and 1.0.
    """
    tone_clean = str(tone).lower().strip()
    reason_clean = str(failure_reason).lower().strip()

    # Get alignment map for the given failure reason
    alignment = TONE_ALIGNMENT_SCORES.get(reason_clean)
    if not alignment:
        # Generic scoring for unmapped failure reasons
        if tone_clean in ("patient", "supportive", "reassuring"):
            return 0.80
        return 0.50

    # Retrieve score based on tone, fall back to default for the reason
    score = alignment.get(tone_clean, alignment.get("default", 0.50))

    # Add a tiny deterministic variation based on hash of inputs to simulate real score variances
    variance = (hash(f"{tone_clean}-{reason_clean}") % 10) / 200.0 - 0.025  # range [-0.025, 0.025]

    return float(max(0.0, min(1.0, score + variance)))
