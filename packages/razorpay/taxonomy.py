"""Map Razorpay payment errors to canonical failure_reason (shared with simulator)."""

from __future__ import annotations

# Canonical reasons — must match packages/simulator/customer_model.FAILURE_REASONS
CANONICAL_REASONS = frozenset(
    {
        "insufficient_funds",
        "payment_cancelled",
        "authentication_failed",
        "gateway_error",
        "upi_timeout",
        "bank_outage",
    }
)


def map_razorpay_error(error_code: str | None = None, description: str | None = None) -> str:
    """Normalise Razorpay error fields → simulator failure_reason."""
    text = f"{error_code or ''} {description or ''}".lower()

    if any(k in text for k in ("insufficient", "declined", "not sufficient", "low balance")):
        return "insufficient_funds"
    if any(k in text for k in ("cancel", "abandon", "user")):
        return "payment_cancelled"
    if any(k in text for k in ("auth", "3ds", "otp", "authentication")):
        return "authentication_failed"
    if any(k in text for k in ("timeout", "timed out", "upi", "vpa")):
        return "upi_timeout"
    if any(k in text for k in ("bank", "issuer", "npci")):
        return "bank_outage"
    if any(k in text for k in ("gateway", "network", "server", "technical")):
        return "gateway_error"

    return "gateway_error"


def map_payment_method(method: str | None) -> str:
    m = (method or "card").lower()
    if "upi" in m:
        return "upi"
    return "card"
