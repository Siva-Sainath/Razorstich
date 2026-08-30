# RazorStitch

Adaptive payment recovery for Razorpay — simulator-trained DQN policy + Test Mode webhooks.

## Deploy in 5 minutes (Vercel + Render)

| Step | Action |
|------|--------|
| 1 | Push this repo to GitHub |
| 2 | [Render Blueprint](https://dashboard.render.com) → **New → Blueprint** → your repo → **Blueprint path:** `render.yaml` (or leave blank) |
| 3 | Paste env from [`backend/.env.production.example`](backend/.env.production.example) (`CORS_ORIGINS`, `RAZORPAY_*`) |
| 4 | Copy Render URL → set `REACT_APP_BACKEND_URL` on Vercel ([`frontend/.env.production.example`](frontend/.env.production.example)) |
| 5 | `cd frontend && vercel deploy --prod` or `./scripts/deploy-vercel.sh` |
| 6 | `./scripts/deploy-check.sh https://YOUR-API.onrender.com https://YOUR-APP.vercel.app` |

Full guide: [`docs/DEPLOY.md`](docs/DEPLOY.md)

**Production URLs (update CORS if yours differ):**  
Frontend `https://frontend-nine-teal-86.vercel.app` · Backend `https://razorstitch-api.onrender.com` (after Blueprint)

## Quick start (RL on MacBook)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
python -m packages.policy.train --train --eval --seed 42
```

Or open [`notebooks/01_train_dqn.ipynb`](notebooks/01_train_dqn.ipynb) then [`notebooks/02_eval_benchmark.ipynb`](notebooks/02_eval_benchmark.ipynb).

See [`docs/TRAINING.md`](docs/TRAINING.md) for Mac vs Colab guidance.

## Layout

```
packages/simulator/   # Recovery MDP + hidden customer model
packages/policy/      # DQN, baselines, train CLI, export_rules
notebooks/            # Training + eval + export
apps/web/             # Next.js API (webhooks, policy recommend)
supabase/migrations/  # Postgres schema
contracts/            # JSON schemas for events & policy decisions
eval/                 # checkpoints + benchmark results (gitignored)
```

## Export for Vercel

```bash
python -m packages.policy.export_rules eval/checkpoints/dqn_train_seed42.pt eval/checkpoints/policy_rules.json
```
