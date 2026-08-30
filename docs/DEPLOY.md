# Deploy RazorStitch (Vercel + Render)

## Architecture

| Piece | Host | Why |
|-------|------|-----|
| **frontend/** | **Vercel** | CRA static build + SPA rewrites |
| **backend/** | **Render** | FastAPI + policy API + Razorpay orders |

Deploy **backend first**, copy the public URL, then set `REACT_APP_BACKEND_URL` on Vercel and redeploy frontend.

---

## 1. Backend on Render

### Option A — Blueprint (recommended)

1. Push this repo to GitHub (must include [`render.yaml`](../render.yaml) at repo root).
2. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo.
4. **Blueprint path:** `render.yaml` — or leave blank (defaults to root `render.yaml`).
5. Paste env from [`backend/.env.production.example`](../backend/.env.production.example):
   - `CORS_ORIGINS` — your Vercel URL(s), comma-separated (no spaces)
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Test Mode keys (`rzp_test_*`)

Copy the service URL, e.g. `https://razorstitch-api.onrender.com`.

**Free tier note:** Render free web services cannot attach disks. Pilot leads (`data/leads.json`) and Razorpay order records (`data/payment_orders.json`) are **ephemeral** — they reset on redeploy or instance restart. Policy API, demos, and checkout still work; only stored leads/orders are affected. For persistence, upgrade the service to Starter and add a `disk` block in `render.yaml`.

### Backend smoke test

```bash
./scripts/deploy-check.sh https://YOUR-SERVICE.onrender.com
```

### Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn server:app --host 0.0.0.0 --port $PORT` |

Uses [`backend/Procfile`](backend/Procfile) equivalent.

### Option C — Render CLI

```bash
brew install render
render login
# Then connect repo via dashboard Blueprint, or use render services create
```

There is **no Cursor-native Render MCP** — Blueprint or dashboard is the reliable path.

---

## 2. Frontend on Vercel

```bash
cd frontend
vercel env add REACT_APP_BACKEND_URL production   # paste Render URL, no trailing slash
vercel deploy --prod
```

Or:

```bash
./scripts/deploy-vercel.sh
```

Full-stack check:

```bash
./scripts/deploy-check.sh https://YOUR-SERVICE.onrender.com https://YOUR-APP.vercel.app
```

Or via [vercel.com](https://vercel.com) → Project → Settings → Environment Variables.

| Name | Value |
|------|--------|
| `REACT_APP_BACKEND_URL` | `https://YOUR-SERVICE.onrender.com` |

`vercel.json` in `frontend/` handles SPA routes (`/research`, `/checkout`, etc.).

---

## Pre-deploy checklist

1. `cd frontend && npm run build`
2. Backend `CORS_ORIGINS` includes production Vercel URL
3. Razorpay Test keys on Render for `/pricing?try=sandbox` and `/pricing?plan=growth`
4. `REACT_APP_BACKEND_URL` on Vercel matches live Render URL (rebuild after change)

---

## Post-deploy smoke

- `/` — landing + waitlist
- `/research` — §1–§8 linear essay, catalog from `GET /api/wedges/catalog`
- `/checkout?record=1` — customer screen + RL metrics replay
- `/pricing?plan=growth` — growth pre-book ₹499
- `/start` — pilot lead form

---

## CORS

```
CORS_ORIGINS=https://frontend-nine-teal-86.vercel.app,https://your-custom-domain.com
```

---

## See also

Legacy Vercel-only notes: [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)
