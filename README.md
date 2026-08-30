# RazorStitch

RazorStitch is payment recovery software for Razorpay merchants in India. When checkout, cart, subscription renewal, or invoice collection fails, merchants often retry blindly or give up. Both paths leak revenue and erode customer trust. RazorStitch trains specialized recovery agents offline in a simulator, evaluates them on held-out scenarios, and serves recommendations through a demo theater and policy API. Merchants pay a success fee only on money actually recovered.

**Live demo:** [https://razorstitch.vercel.app/checkout?record=1](https://razorstitch.vercel.app/checkout?record=1)

## The problem

Failed payments are not a single decision. The right follow-up depends on amount at risk, time since failure, decline reason, payment method, and how many times the customer was already contacted. Fixed retry rules cannot learn timing across those constraints. Gross recovery rate also rewards spam: blasting payment links recovers volume but increases duplicates, communication cost, and churn.

RazorStitch treats recovery as a sequential decision problem under a trust budget (typically three contacts per case). Policies are trained to maximize net INR recovered, not headline recovery percentage.

## How it works

```
Razorpay failure context (webhook or validation scenario)
        |
        v
State encoder (31-dim observation: amount, time, contacts, decline type, prior action)
        |
        v
Dueling Double DQN (per wedge) + hard action masks
        |
        v
Recovery action (wait, payment link, notify, escalate, stop)
        |
        v
Simulator reward (net INR) or live merchant outcome
```

### Four recovery wedges

| Wedge | Window | Agent |
|-------|--------|-------|
| Checkout failed | 72 hours | Card and UPI decline recovery |
| Cart abandon | 48 hours | Idle cart and payment-page recovery |
| Subscription failed | 14 days | Renewal failure recovery |
| Invoice overdue | 30 days | B2B dunning recovery |

Each wedge uses its own simulator horizon, tick size, and exported policy weights. Checkout v2 is the primary benchmark wedge (+61% mean net INR vs failure-rules baseline on held-out simulator seeds).

### Training and evaluation

- Offline training in `packages/simulator` with Dueling Double DQN, prioritized replay, and validation gates every 500 episodes.
- Multi-seed benchmark (10 seeds x 200 episodes) against a heuristic failure-rules baseline before weights ship.
- Theater replay on fixed validation cases (`val_scenarios.json`) with live Q-value bars from `/api/policy/recommend`.
- Razorpay Test Mode proves checkout and webhook integration; it is not the RL training environment.

## Repository layout

```
frontend/           React demo theater, landing, pricing, research pages (Vercel)
backend/            FastAPI policy API, episode builder, Razorpay Test checkout
packages/simulator/ Recovery MDPs and customer response models
packages/policy/    Dueling DDQN training, benchmarks, JSON weight export
eval/results/       Committed training curves and benchmark statistics
apps/web/           Alternate Next.js integration prototype (not primary demo)
docs/               Deployment, training, pitch scripts, research notes
scripts/            Deploy helpers, wedge training orchestration, Vercel tunnel script
```

### Key paths

| Path | Role |
|------|------|
| `frontend/src/components/stage/TheaterStage.jsx` | Operating theater shell and replay UI |
| `frontend/src/lib/timelineContext.js` | Case load, scrubber, live policy API fusion |
| `backend/episode_builder.py` | Precomputed rollouts and ghost baselines |
| `backend/policy_bridge.py` | JSON weight inference and guardrails |
| `packages/policy/train/run.py` | Canonical wedge training and benchmark CLI |
| `packages/policy/weights/*.json` | Production inference weights (committed) |
| `docs/pitch/PRESENTATION_PACKAGE.md` | Two-minute demo script and talk track |

## Run locally

### 1. Backend (port 8000)

```bash
cd backend
python3 -m venv ../.venv && source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Warm the case cache once before a demo:

```bash
curl http://localhost:8000/api/case/VAL-CHK-004
```

### 2. Frontend (port 3000)

```bash
cd frontend
cp .env.example .env
# REACT_APP_BACKEND_URL=http://localhost:8000
npm install
npm start
```

Open [http://localhost:3000/checkout?record=1](http://localhost:3000/checkout?record=1). Use **Space** to play, **G** to toggle ghost baselines.

### 3. Train a wedge (optional)

```bash
source .venv/bin/activate
pip install -e .
python -m packages.policy.train.run --wedge checkout_failed --train --benchmark --seed 42
```

See [`docs/TRAINING.md`](docs/TRAINING.md) for Mac vs Colab guidance and [`notebooks/`](notebooks/) for interactive runs.

## Deploy

| Component | Host | Notes |
|-----------|------|-------|
| `frontend/` | Vercel | Set `REACT_APP_BACKEND_URL` to your API origin |
| `backend/` | Render | Blueprint via [`render.yaml`](render.yaml) |

Full guide: [`docs/DEPLOY.md`](docs/DEPLOY.md)

**Production frontend:** [https://razorstitch.vercel.app](https://razorstitch.vercel.app)

For Vercel demos without a permanent API host, run `./scripts/run-backend-for-vercel.sh` on your machine. It starts the FastAPI server and a Cloudflare quick tunnel, then prints the URL to set as `REACT_APP_BACKEND_URL` before redeploying.

```bash
./scripts/deploy-vercel.sh
./scripts/deploy-check.sh https://YOUR-API.onrender.com https://razorstitch.vercel.app
```

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Vercel + Render deployment |
| [`docs/TRAINING.md`](docs/TRAINING.md) | RL training workflow |
| [`docs/pitch/PRESENTATION_PACKAGE.md`](docs/pitch/PRESENTATION_PACKAGE.md) | Demo script and GTM talk track |
| [`docs/JUDGE_READINESS.md`](docs/JUDGE_READINESS.md) | Demo checklist and judge flow |
| [`docs/research/README.md`](docs/research/README.md) | Evidence tags and claim boundaries |

## Pricing model

Growth tier: 2.5% per recovered payment (2.0% on annual billing). Sandbox tier is free with Razorpay Test checkout on the pricing page. See [`frontend/src/config/pricingPlans.js`](frontend/src/config/pricingPlans.js).

## License

See repository license file if present. Razorpay and third-party SDK usage remain subject to their respective terms.
