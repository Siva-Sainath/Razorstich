# Judge / Demo Readiness Checklist

**Production frontend:** https://razorstitch.vercel.app

## What is ready now

| Area | Status |
|------|--------|
| Unified SiteNav + dark shell on all pages | Done |
| Glide-style pricing (dark theme) | Done |
| Recovery demo (checkout, cart, subscription, invoice; pitch mode opt-in) | Done |
| Research / training proof | Done |
| Pilot lead capture (`/start`) | Done (needs backend) |
| **Razorpay Test Mode checkout** (pricing modal) | Done — official `checkout.js`, Test Mode keys |

## Razorpay Test Mode (no live PG compliance)

- **Entry:** `/pricing` → Sandbox tier **Try Test checkout**, or `/pricing?try=sandbox`
- **Flow:** Backend `POST /api/razorpay/orders` (server-side `plan_id=sandbox` → ₹1,499) → Razorpay Standard Checkout modal → `POST /api/razorpay/verify` (HMAC signature check) or `POST /api/razorpay/payment/failed`
- **Security:** Amount is never trusted from the client; duplicate verify callbacks are idempotent
- **Test cards:** [Razorpay test card docs](https://razorpay.com/docs/payments/payments/test-card-details/) — e.g. `4239 5360 0631 5640` (Visa), any CVV, future expiry → mock bank page → Success/Failure
- **Keys:** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (Test Mode) in backend `.env`
- Without keys: modal shows setup instructions + test card reference (no fake card form)

## One step for full production E2E

Deploy **backend** to Railway/Render and set on Vercel:

```
REACT_APP_BACKEND_URL=https://your-api.up.railway.app
```

Backend env:

```
CORS_ORIGINS=https://razorstitch.vercel.app
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

## Recommended judge flow (5 min)

1. **Landing** `/` — value prop + pilot CTA
2. **Pricing** `/pricing?try=sandbox` — Razorpay Test Checkout → fail payment → agent recommendation
3. **Demo** `/checkout` — full recovery replay theater
4. **Pricing** `/pricing` — success-fee GTM
5. **Research** `/research` — training benchmarks

## Honest labels

- Demo theater = validation scenarios + trained DQN weights (simulator)
- Sandbox = Razorpay **Test Mode** card simulator (official test numbers)
- Not live merchant traffic until Razorpay webhooks connected
