# Emergent M.O.T. + RazorStitch RL

This repo combines:

| Layer | Path | Role |
|-------|------|------|
| **Emergent UI** | `frontend/` | M.O.T. Payment Resuscitation Console (CRA + Tailwind) |
| **Theater API** | `backend/` | FastAPI — case narrative, SSE ticker, **real DQN policy** |
| **RL training** | `packages/` | Simulators, 10k-episode Dueling DDQN, exported weights |
| **Next.js (legacy)** | `apps/web/` | Original wedge demo + Razorpay webhooks |

## Run locally (Emergent UI + real policy)

```bash
# Terminal 1 — API (uses trained weights in packages/policy/weights/)
cd backend
cp .env.example .env
pip install -r requirements.txt   # or use repo .venv
uvicorn server:app --reload --port 8000

# Terminal 2 — Theater UI
cd frontend
cp .env.example .env
yarn install
yarn start   # http://localhost:3000
```

Policy Brain calls `POST /api/policy/recommend` → `backend/policy_bridge.py` → real Dueling DDQN v2 weights (not the mock Q-table).

Case timeline + SSE ticker remain demo narrative until wired to Razorpay/Supabase.

## Git branches

| Branch | Contents |
|--------|----------|
| `main` | Full monorepo: RL + Emergent frontend + Next.js |
| `conflict_300826_0250` | Emergent-only export (upstream) |

## Next: real data

1. Replace `CASE_PAYLOAD` in `backend/case_data.py` with Razorpay webhook → case mapper
2. Point `policy_bridge` wedge routing at `cart_abandon`, `subscription_failed`, etc.
3. Calibrate simulator from merchant CSV / Kaggle (`packages/data/` — planned)
