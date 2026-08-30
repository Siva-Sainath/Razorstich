# Judge / Demo Readiness Checklist

**Production frontend:** https://frontend-nine-teal-86.vercel.app

## What is ready now

| Area | Status |
|------|--------|
| Unified SiteNav + dark shell on all pages | Done |
| Glide-style pricing (dark theme) | Done |
| Recovery demo (4 wedges, pitch mode opt-in) | Done |
| Research / training proof | Done |
| Pilot lead capture (`/start`) | Done (needs backend) |
| **Razorpay Test Mode sandbox** (`/sandbox`) | Done — official test cards, no live PG |

## Razorpay Test Mode (no compliance required)

- **Route:** `/sandbox`
- **API:** `POST /api/razorpay/test/pay` with test card numbers
- **Success card:** `4111 1111 1111 1111`
- **Failure card:** `4012 0010 3714 1112` → triggers DQN policy recommend
- No Razorpay API keys required for judges

## One step for full production E2E

Deploy **backend** to Railway/Render and set on Vercel:

```
REACT_APP_BACKEND_URL=https://your-api.up.railway.app
```

Backend env:

```
CORS_ORIGINS=https://frontend-nine-teal-86.vercel.app
```

Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

## Recommended judge flow (5 min)

1. **Landing** `/` — value prop + pilot CTA
2. **Sandbox** `/sandbox` — fail a test payment → see agent recommendation
3. **Demo** `/checkout` — full recovery replay theater
4. **Pricing** `/pricing` — success-fee GTM
5. **Research** `/research` — training benchmarks

## Honest labels

- Demo theater = validation scenarios + trained DQN weights (simulator)
- Sandbox = Razorpay **Test Mode** card simulator (official test numbers)
- Not live merchant traffic until Razorpay webhooks connected
