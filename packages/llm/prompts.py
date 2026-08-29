"""
Templates and prompt builder for empathetic recovery message drafting.
DQN chooses the action, LLM drafts the copy. The LLM never overrides policy actions.
"""

from __future__ import annotations


# Map failure_reason to the corresponding tone category
REASON_TONE_MAPPING: dict[str, str] = {
    "insufficient_funds": "patient",
    "gateway_error": "technical",
    "payment_cancelled": "supportive",
    "authentication_failed": "reassuring",
    "upi_timeout": "reminder",
    "bank_outage": "technical",
}

# The prompt templates structured by action and tone/failure_reason.
# Direct lookup by failure_reason is attempted first, followed by tone, and finally default.
TEMPLATES: dict[str, dict[str, str]] = {
    "notify_customer": {
        "patient": (
            "Hi {customer_name},\n\n"
            "We noticed that your recent payment of {amount} did not go through because of "
            "insufficient funds. No worries at all! Sometimes these things happen.\n\n"
            "We'll try to process this transaction again in a little while, or you can complete "
            "it at your convenience. Let us know if you need any assistance or if you would like to "
            "use a different payment method.\n\n"
            "Best regards,\n"
            "Customer Support Team"
        ),
        "technical": (
            "Hi {customer_name},\n\n"
            "Your recent payment of {amount} could not be processed due to a temporary "
            "network or gateway communication issue. This is a technical issue on the processor's end "
            "and your funds have not been debited. If they were, they will be automatically refunded.\n\n"
            "We recommend waiting a few minutes and trying again. If you continue to see this error, "
            "please let us know.\n\n"
            "Sincerely,\n"
            "Technical Operations Team"
        ),
        "reminder": (
            "Hi {customer_name},\n\n"
            "We noticed your payment of {amount} timed out on the UPI application. This usually happens if "
            "the notification was missed or if there was a slight delay.\n\n"
            "Please check your UPI app for any pending requests or try the payment again.\n\n"
            "Best regards,\n"
            "Support Team"
        ),
        "supportive": (
            "Hi {customer_name},\n\n"
            "We noticed your payment of {amount} was cancelled. If you encountered any difficulties "
            "during checkout or would like to use a different payment method, please let us know how we can help.\n\n"
            "Best regards,\n"
            "Support Team"
        ),
        "reassuring": (
            "Hi {customer_name},\n\n"
            "Your recent payment of {amount} could not be completed because authentication failed. "
            "Please ensure your card/credentials are correct and that the one-time passcode (OTP) was entered "
            "correctly, then try again.\n\n"
            "If you continue to experience problems, we're here to help.\n\n"
            "Best regards,\n"
            "Support Team"
        ),
        "default": (
            "Hi {customer_name},\n\n"
            "We wanted to let you know that your recent payment of {amount} was unsuccessful due to "
            "a standard checkout issue ({failure_reason}).\n\n"
            "Please try completing the payment again when you have a moment. Let us know if we can help you "
            "resolve this.\n\n"
            "Best regards,\n"
            "Support Team"
        ),
    },
    "resend_link": {
        "patient": (
            "Hi {customer_name},\n\n"
            "We hope you are having a good day. We noticed that your payment of {amount} was not fully "
            "completed (insufficient funds). There is absolutely no rush, but if you're ready to try again, "
            "you can complete the transaction securely using this direct link:\n"
            "{payment_link}\n\n"
            "If you need to use a different payment method or have questions, please reach out.\n\n"
            "Warmly,\n"
            "Customer Support Team"
        ),
        "technical": (
            "Hi {customer_name},\n\n"
            "A technical gateway issue interrupted your payment of {amount}. The connection has now "
            "stabilized, and you can securely complete your checkout using the following direct recovery link:\n"
            "{payment_link}\n\n"
            "We apologize for the technical inconvenience.\n\n"
            "Sincerely,\n"
            "Support Team"
        ),
        "reminder": (
            "Hi {customer_name},\n\n"
            "Your UPI transaction of {amount} timed out. We have generated a direct recovery link "
            "so you can complete your payment when you are ready:\n"
            "{payment_link}\n\n"
            "Please let us know if we can help you with this payment.\n\n"
            "Best regards,\n"
            "Support Team"
        ),
        "bank_outage": (
            "Hi {customer_name},\n\n"
            "Your transaction of {amount} could not be processed due to a temporary bank system outage. "
            "Since the bank network is back up, you can now complete your checkout using this direct recovery link:\n"
            "{payment_link}\n\n"
            "Thank you for your patience.\n\n"
            "Sincerely,\n"
            "Support Team"
        ),
        "default": (
            "Hi {customer_name},\n\n"
            "We've generated a new payment recovery link to help you complete your transaction of {amount} "
            "which was interrupted due to: {failure_reason}.\n\n"
            "You can complete the checkout here:\n"
            "{payment_link}\n\n"
            "If you continue to experience issues, please let us know.\n\n"
            "Best regards,\n"
            "Support Team"
        ),
    },
}


def get_recovery_prompt(
    action: str,
    failure_reason: str,
    customer_name: str = "valued customer",
    amount: str = "your transaction",
    payment_link: str = "",
) -> str:
    """
    Retrieves and formats a recovery message copy stub.

    Args:
        action: The recovery action chosen by the policy ('notify_customer' or 'resend_link').
        failure_reason: The failure reason (e.g. 'insufficient_funds', 'gateway_error').
        customer_name: The customer's name (defaults to 'valued customer').
        amount: The formatted currency amount (defaults to 'your transaction').
        payment_link: The payment link URL (only for 'resend_link').

    Returns:
        The drafted copy string.
    """
    # Clean action name (supports case-insensitive check and underscore replacement)
    action_clean = str(action).lower().strip().replace("-", "_")

    if action_clean not in TEMPLATES:
        raise ValueError(
            f"Action '{action}' is not supported for message drafting. "
            f"Supported actions: {list(TEMPLATES.keys())}"
        )

    action_templates = TEMPLATES[action_clean]

    # 1. Attempt direct lookup by failure_reason
    if failure_reason in action_templates:
        template = action_templates[failure_reason]
    else:
        # 2. Fallback to mapped tone
        tone = REASON_TONE_MAPPING.get(failure_reason, "default")
        template = action_templates.get(tone, action_templates["default"])

    # Render template with variables
    return template.format(
        customer_name=customer_name or "valued customer",
        amount=amount,
        payment_link=payment_link or "[Payment Link Placeholder]",
        failure_reason=failure_reason.replace("_", " "),
    )
