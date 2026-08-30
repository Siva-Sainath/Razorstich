# RazorStitch

RazorStitch helps Razorpay merchants recover money when payments fail. A customer tries to pay, checkout fails, and most shops either send too many reminders or stop trying. Both options lose revenue and annoy customers. RazorStitch trains separate recovery agents for each common failure type, tests them in a simulator, and shows exactly what the agent would do next. Merchants pay only when money actually comes back.

**Live demo:** [https://razorstitch.vercel.app/checkout?record=1](https://razorstitch.vercel.app/checkout?record=1)

## The problem

A failed payment is not one decision. Should you wait, send a payment link, text the customer, or stop? That depends on how much is at risk, how long ago it failed, why it failed, and how many times you already contacted them. Simple retry rules cannot learn that timing. Recovery rate alone is also misleading: sending payment links to everyone recovers more payments but wastes money on duplicates and hurts trust.

RazorStitch limits how often you can contact someone (typically three touches per case) and optimizes for **net money in the bank**, not a vanity recovery percentage.

## How it works

```
Payment fails on Razorpay (or a practice scenario in the demo)
        |
        v
Read the situation (amount, time, contacts left, decline reason)
        |
        v
Recovery agent picks the best allowed next step
        |
        v
Action: wait, payment link, SMS, escalate, or stop
        |
        v
Customer pays (or the window closes)
```

### Four recovery scenarios

| Scenario | Time window | What it covers |
|----------|-------------|----------------|
| Checkout failed | 72 hours | Card and UPI declines at checkout |
| Cart abandon | 48 hours | Shoppers who leave without paying |
| Subscription failed | 14 days | Failed subscription renewals |
| Invoice overdue | 30 days | Late B2B invoice collection |

Each scenario has its own trained agent and practice environment. Checkout is the strongest benchmark today: about 61% more net revenue vs basic retry rules in our simulator tests.

### Training and evaluation

- Agents learn offline in a simulator (millions of practice runs, no live customer messages during training).
- Before shipping weights, we run 10 random test batches and compare against a simple retry-rules baseline.
- The demo replays fixed test cases and shows live scores for each possible action.
- Razorpay Test Mode on the pricing page proves checkout and webhooks work. It does not train the agents.

## Repository layout

```
frontend/           Website, interactive demo, pricing, research pages (Vercel)
backend/            API for cases, policy recommendations, Razorpay Test checkout
packages/simulator/ Practice environments and customer behavior models
packages/policy/    Agent training, benchmarks, exported model weights
eval/results/       Training curves and benchmark numbers (committed)
apps/web/           Alternate integration prototype (not the main demo)
docs/               Deploy guides, pitch scripts, research notes
scripts/            Deploy helpers, training scripts, Vercel tunnel helper
```

### Key paths

| Path | Role |
|------|------|
| `frontend/src/components/stage/TheaterStage.jsx` | Main demo replay UI |
| `frontend/src/lib/timelineContext.js` | Loads cases, scrubber, live policy scores |
| `backend/episode_builder.py` | Builds replay timelines and comparison baselines |
| `backend/policy_bridge.py` | Runs the trained model and applies safety rules |
| `packages/policy/train/run.py` | Train and benchmark a scenario agent |
| `packages/policy/weights/*.json` | Model weights used in production inference |
| `docs/pitch/PRESENTATION_PACKAGE.md` | Two-minute demo script |

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

Open [http://localhost:3000/checkout?record=1](http://localhost:3000/checkout?record=1). Press **Space** to play. Press **G** to compare against basic retry rules.

### 3. Train an agent (optional)

```bash
source .venv/bin/activate
pip install -e .
python -m packages.policy.train.run --wedge checkout_failed --train --benchmark --seed 42
```

The `--wedge` flag names the scenario (for example `checkout_failed`). See [`docs/TRAINING.md`](docs/TRAINING.md) and [`notebooks/`](notebooks/) for more.

## Deploy

| Component | Host | Notes |
|-----------|------|-------|
| `frontend/` | Vercel | Set `REACT_APP_BACKEND_URL` to your API URL |
| `backend/` | Render | Use [`render.yaml`](render.yaml) Blueprint |

Full guide: [`docs/DEPLOY.md`](docs/DEPLOY.md)

**Production site:** [https://razorstitch.vercel.app](https://razorstitch.vercel.app)

For demos on Vercel without a hosted API, run `./scripts/run-backend-for-vercel.sh` on your laptop. It starts the API and a temporary public tunnel, then tells you what URL to set in Vercel before redeploying.

```bash
./scripts/deploy-vercel.sh
./scripts/deploy-check.sh https://YOUR-API.onrender.com https://razorstitch.vercel.app
```

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Vercel + Render deployment |
| [`docs/TRAINING.md`](docs/TRAINING.md) | How agents are trained |
| [`docs/pitch/PRESENTATION_PACKAGE.md`](docs/pitch/PRESENTATION_PACKAGE.md) | Demo script and talk track |
| [`docs/JUDGE_READINESS.md`](docs/JUDGE_READINESS.md) | Demo checklist |
| [`docs/research/README.md`](docs/research/README.md) | What we can and cannot claim |

## Pricing

Growth: 2.5% per recovered payment (2.0% on annual billing). Sandbox is free with Razorpay Test checkout on the pricing page. Details in [`frontend/src/config/pricingPlans.js`](frontend/src/config/pricingPlans.js).

## License

See repository license file if present. Razorpay and third-party SDK usage remain subject to their respective terms.
