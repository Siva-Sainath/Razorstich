# Razorpay Test Mode Setup — RazorStitch

Razorpay Test Mode is for **validation and demo**, not RL training loops. Use it to prove 3–5 real recovery stories on video.

## 1. Create Test Mode account

1. Sign up at [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Stay in **Test Mode** (toggle top-left — never switch to Live for buildathon)
3. **Settings → API Keys** → generate Key ID + Key Secret
4. Add to `apps/web/.env.local`:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...   # from webhook setup below
```

## 2. Standard Checkout (failed payment demo)

Use Razorpay Standard Checkout in your Emergent UI or a minimal test page.

Docs: [https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)

## 3. Official test cards → our failure reasons

Razorpay docs: [Test card details](https://razorpay.com/docs/payments/payments/test-card-details/)

| Demo scenario | Test card / behaviour | Maps to `failure_reason` |
|---|---|---|
| Hard decline / insufficient funds | Cards listed under "Payment failed" in Razorpay test docs | `insufficient_funds` |
| User closes 3DS / auth fails | Authentication failure test flow | `authentication_failed` |
| Generic gateway failure | Gateway error test scenarios | `gateway_error` |
| UPI timeout / pending | Test VPAs (see Razorpay UPI test docs) | `upi_timeout` |
| Success after retry | Same card, retry after wait — `payment.failed` then `payment.captured` | validates wait policy |

Our webhook mapper (`apps/web/src/lib/razorpay.ts` + `packages/razorpay/taxonomy.py`) normalises Razorpay `error_code` / `error_description` into the 6 simulator failure reasons.

### Example test card (verify against current Razorpay docs)

Razorpay publishes specific numbers — always check their docs for the latest. Typical pattern:

```
Card number: 4111 1111 1111 1111  (success)
Card number: <failure card from docs>
CVV: any 3 digits
Expiry: any future date
```

For **failure** demos, use the card Razorpay labels for "payment failed" / insufficient funds — not the success card.

## 4. Webhook setup

1. **Dashboard → Webhooks → Add New Webhook**
2. URL: `https://<your-vercel-app>.vercel.app/api/webhooks/razorpay`
   - Local dev: use [ngrok](https://ngrok.com) or Vercel preview URL
3. Events (minimum):
   - `payment.failed`
   - `payment.captured`
   - `payment.authorized` (optional, for late-auth UPI demo)
4. Copy **Webhook Secret** → `RAZORPAY_WEBHOOK_SECRET`

## 5. Payment Links (recovery action)

After policy recommends `create_payment_link`:

1. Server calls [Payment Links API](https://razorpay.com/docs/api/payments/payment-links/create-standard/) with Test Mode keys
2. Send link to customer (demo: show link in UI)
3. Customer pays with success test card → `payment.captured`

## 6. What gets logged

| Event | Supabase table | Metric label |
|---|---|---|
| `payment.failed` | `recovery_cases` + `policy_decisions` | case opened |
| Policy recommendation | `policy_decisions` | action + Q-values |
| `payment.captured` | `recovery_cases.recovered_at` | **confirmed Test Mode recovered value** |
| All events | `audit_entries` (hash chain) | audit trail |

## 7. Calibration workflow (optional, post-demo)

After collecting real Test Mode outcomes:

1. Export webhook payloads from `audit_entries`
2. Run `packages/razorpay/calibrate.py` (fits simulator params to observed recovery rates)
3. Retrain DQN on updated simulator — **still offline**, now better aligned with Razorpay

This is **not** online RL on Razorpay. It is offline retraining after calibration.

## 8. Demo checklist

- [ ] Test Mode keys in Vercel env
- [ ] Webhook receiving `payment.failed` (check Supabase `audit_entries`)
- [ ] Policy returns action for mapped failure reason
- [ ] At least one `payment.failed` → wait/link → `payment.captured` story on video
- [ ] UI labels simulator metrics vs Test Mode metrics separately
