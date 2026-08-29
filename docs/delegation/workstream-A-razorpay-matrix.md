# Workstream A — Razorpay Capability Matrix

You are working in RazorStitch (payment recovery for Razorpay buildathon).

## Task
Create `docs/research/razorpay-capability-matrix.md` mapping Razorpay Test Mode capabilities to our recovery actions.

## Must cover
- Standard Checkout + test cards / test UPI (`success@razorpay`, `failure@razorpay`)
- Webhooks: `payment.failed`, `payment.captured`, `payment.authorized`
- Payment Links API as recovery action
- What Razorpay does NOT provide (multi-day recovery MDP, customer fatigue model)
- Table: failure type → Razorpay signal → our `failure_reason` → policy action

## Constraints
- Test Mode only; no live mode
- Cite Razorpay docs URLs where possible
- Keep under 200 lines

Write the file only. Do not modify other packages.
