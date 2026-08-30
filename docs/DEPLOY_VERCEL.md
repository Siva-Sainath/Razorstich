# Deploy RazorStitch to Vercel

## Architecture

| Piece | Host | Why |
|-------|------|-----|
| **frontend/** (landing, demo, research, pricing) | **Vercel** | CRA static build + SPA rewrites |
| **backend/** (FastAPI, policy, leads API) | **Railway / Render / Fly** | Python server — Vercel can't run this as-is |
| **apps/web/** (optional) | Second Vercel project | Next.js policy API only — skip for now |

The demo and `/research` need the backend. Deploy backend first, then point the frontend at it.

---

## 1. Backend (do this first)

**Railway (fastest):**

```bash
cd backend
# railway login && railway init
# Set start command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

Copy the public URL, e.g. `https://razorstitch-api.up.railway.app`

**Razorpay Test checkout** — set on the backend host:

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CORS_ORIGINS=https://your-app.vercel.app
```

**Leads:** writes to `data/leads.json` on the server filesystem — fine for pilot; move to Supabase later.

---

## 2. Frontend on Vercel

1. Push repo to GitHub
2. [vercel.com/new](https://vercel.com/new) → Import repo
3. **Root Directory:** `frontend`
4. **Framework Preset:** Create React App (auto-detected)
5. **Environment variables:**

   | Name | Value |
   |------|--------|
   | `REACT_APP_BACKEND_URL` | `https://YOUR-BACKEND-URL` (no trailing slash) |
   | `REACT_APP_RAZORPAY_KEY_ID` | Optional — must match backend `RAZORPAY_KEY_ID` if used client-side |

6. Deploy

`vercel.json` in `frontend/` handles SPA routing (`/research`, `/checkout`, etc.).

---

## Pre-deploy checklist

1. `cd frontend && npm run build` — catches JSX errors
2. Click nav loop on localhost: `/` → `/pricing` → `/checkout` → `/research` → `/start`
3. **Same SiteNav** visible on marketing pages AND demo routes
4. **Same dark background** — no white/light theme drift on pricing
5. Demo auto-plays on load; use play rail to scrub steps
6. `REACT_APP_BACKEND_URL` on Vercel matches live backend (rebuild after changing)
7. Backend `CORS_ORIGINS` includes your Vercel URL
8. Backend has Razorpay Test Mode keys for `/pricing?try=sandbox` **and** `/pricing?plan=growth`
9. Submit test lead on `/start` → `GET /api/leads/stats`

**Growth pre-book smoke (local or prod):**

```bash
curl -s -X POST "$BACKEND_URL/api/razorpay/orders" \
  -H 'Content-Type: application/json' \
  -d '{"plan_id":"growth","wedge":"checkout_failed"}' | jq .plan_id,.amount_inr,.mode
```

Expected: `plan_id: "growth"`, `amount_inr: 499`, `mode: "razorpay"` (or `unconfigured` if keys absent — not `Unknown plan_id`).

---

## 3. Smoke test after deploy

- `/` — landing + lead form + SiteNav
- `/pricing?try=sandbox` — click **Open Razorpay Checkout** in modal (Test Mode keys on backend)
- `/pricing?plan=growth` — pre-book Growth ₹499 test checkout (same Razorpay keys)
- `/pricing` — same shell as landing; Glide-style tiers on dark theme
- `/start` — pilot form → check backend `data/leads.json` or `GET /api/leads/stats`
- `/checkout?record=1` — compact chrome; dock scrubber; no SiteNav
- `/subscription?record=1` — customer screen + RL live metrics; policy brain
- `/research` — §1–§8 linear essay; catalog loads from `GET /api/wedges/catalog`

---

## 4. Custom domain (optional)

Vercel → Project → Settings → Domains → add `razorstitch.dev` or similar.

---

## CORS

Backend `server.py` uses `CORS_ORIGINS` env var. Set to your Vercel URL:

```
CORS_ORIGINS=https://your-app.vercel.app,https://razorstitch.dev
```
