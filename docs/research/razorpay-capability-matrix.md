# Razorpay Capability Matrix (Test Mode)

This document maps Razorpay's Test Mode capabilities to RazorStitch's payment recovery actions and policies.

## 1. Test Environments & Triggers

Razorpay provides specific test credentials and handles to simulate various payment scenarios. 

*   **Test Cards & UPI:** Using test cards provided in the Razorpay documentation, or specific UPI handles (e.g., `success@razorpay`, `failure@razorpay`).
    *   *Reference:* [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
*   **Standard Checkout:** We can trigger the checkout flow using the test API keys. The user selects a test method, which generates predictable outcomes.

## 2. Webhooks for State Changes

RazorStitch relies on webhooks to trigger recovery workflows. In Test Mode, we listen to the following critical webhooks:

*   **`payment.failed`**: Triggered when a payment attempt fails (e.g., using `failure@razorpay`). This is the primary trigger for our recovery engine.
*   **`payment.authorized`**: Triggered when a payment is authorized but not yet captured. 
*   **`payment.captured`**: Triggered when a payment is successfully completed. If this occurs after a failure, it signals a successful recovery.
    *   *Reference:* [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)

## 3. Recovery Actions: Payment Links API

Upon receiving a `payment.failed` webhook, RazorStitch utilizes the Razorpay Payment Links API to send recovery prompts to the customer.

*   **Action:** Generate a localized, context-aware payment link.
*   **Delivery:** Send via SMS, Email, or WhatsApp (simulated in test mode).
*   **Advantage:** Allows the customer to retry the payment without re-entering the checkout flow from scratch.
    *   *Reference:* [Payment Links API](https://razorpay.com/docs/api/payment-links/)

## 4. Capability Gaps (What Razorpay Does NOT Provide)

Razorpay is a payment gateway, not a comprehensive recovery platform. RazorStitch builds on top of Razorpay by addressing these gaps:

*   **Multi-Day Recovery MDP (Markov Decision Process):** Razorpay does not orchestrate complex, stateful, multi-day recovery strategies based on customer behavior and context.
*   **Customer Fatigue Model:** Razorpay does not limit the number of recovery attempts or throttle communication to prevent customer annoyance (fatigue).
*   **Intelligent Routing/Timing:** Razorpay does not determine the optimal time of day or channel (SMS vs. Email) to send a recovery link based on past interactions.

## 5. Failure Mapping & Policy Actions

This table maps raw Razorpay failure signals to RazorStitch's internal categorization and the resulting recovery policy.

| Failure Type | Razorpay Signal | RazorStitch `failure_reason` | Policy Action |
| :--- | :--- | :--- | :--- |
| Insufficient Funds | `payment.failed` (Code: `BAD_REQUEST_ERROR`, Reason: `insufficient_funds`) | `INSUFFICIENT_FUNDS` | Delay 24h, send Payment Link via SMS. |
| Bank Downtime | `payment.failed` (Code: `GATEWAY_ERROR`, Reason: `bank_downtime`) | `BANK_DOWNTIME` | Retry immediately or after 2h depending on historical uptime. |
| Invalid Card | `payment.failed` (Code: `BAD_REQUEST_ERROR`, Reason: `invalid_card`) | `INVALID_PAYMENT_METHOD`| Notify immediately to update payment method. |
| Customer Cancelled | `payment.failed` (Code: `BAD_REQUEST_ERROR`, Reason: `payment_cancelled`)| `USER_ABORTED` | Wait 1h, send gentle email reminder with Payment Link. |
| UPI Intent Failed | `payment.failed` (using `failure@razorpay` in test) | `UPI_APP_FAILURE` | Send Payment Link asking to try an alternative UPI app. |
