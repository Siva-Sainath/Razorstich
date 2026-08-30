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
   | `REACT_APP_SMALLEST_AI_AGENT_ID` | Atoms Widget → `assistant-id` from embed snippet |

6. Deploy

`vercel.json` in `frontend/` handles SPA routing (`/research`, `/checkout`, etc.).

**Smallest AI widget:** In Atoms → Widget, set domain allowlist to your Vercel URL + custom domain. Paste `PRICING_AGENT_KNOWLEDGE` from `frontend/src/config/voiceAgent.js` into the agent system prompt.

---

## 3. Smoke test after deploy

- `/` — landing + lead form
- `/pricing` — voice guide widget loads (needs `REACT_APP_SMALLEST_AI_AGENT_ID` + domain allowlist)
- `/start` — pilot form → check backend `data/leads.json` or `GET /api/leads/stats`
- `/checkout` — demo loads (needs backend)
- `/research` — catalog loads from `GET /api/wedges/catalog`

---

## 4. Custom domain (optional)

Vercel → Project → Settings → Domains → add `razorstitch.dev` or similar.

---

## CORS

Backend `server.py` uses `CORS_ORIGINS` env var. Set to your Vercel URL:

```
CORS_ORIGINS=https://your-app.vercel.app,https://razorstitch.dev
```
