# RazorStitch — Demo Script & Talk Track

**Positioning:** Specialized recovery agents for Razorpay merchants — one trained policy per failure mode. They decide when to wait, nudge, or stop under a trust budget. Merchants pay 2.5% only on money actually recovered.

---

## Demo URLs (Vercel)

**Start here:** https://razorstitch.vercel.app/checkout?record=1

| Page | URL |
|------|-----|
| Landing | https://razorstitch.vercel.app/ |
| Research | https://razorstitch.vercel.app/research |
| Pricing | https://razorstitch.vercel.app/pricing |
| Cart | https://razorstitch.vercel.app/cart?record=1 |
| Subscription | https://razorstitch.vercel.app/subscription?record=1 |
| Invoice | https://razorstitch.vercel.app/invoice?record=1 |

**API for Vercel demo:** keep `./scripts/run-backend-for-vercel.sh` running on your Mac (backend + Cloudflare tunnel). Without it, the UI loads but case data won't fetch.

**Local fallback:** http://localhost:3000/checkout?record=1 — `uvicorn` on `:8000` + `REACT_APP_BACKEND_URL=http://localhost:8000 npm start`

---

## Two-minute script + what to do on screen

Open: http://localhost:3000/checkout?record=1 · Keys: **Space** play · **G** ghost paths · **← →** pause

| Time | Say this | On screen |
|------|----------|-----------|
| **0:00** | Every Razorpay merchant hits the same moment: checkout failed, and nobody knows what to do next. Blast SMS or give up — both leak money and burn trust. | Optional: landing hero, or stay on theater |
| **0:20** | RazorStitch is payment recovery for Razorpay. Four agents — checkout, cart, subscription, invoice. Recovery isn't one retry rule. It's a sequence: when to wait, when to send a link, when to stop. | Scenario bar on `/checkout` |
| **0:35** | This is a test checkout we never used for training — almost five thousand rupees, card declined, bank said do not honor. About three days to win it back without spamming the customer. | Case header · Failure anatomy if you want stakes |
| **0:50** | Hit play. Watch the brain — it's scoring every move: wait, text, payment link. Flip ghost paths — that's what basic retry rules would do on the same failure. | **Space** → Policy Brain Q-bars · **G** → recovery paths |
| **1:08** | First move? Payment link. Customer pays. Green badge — money's back. | Intervention composer · green scrubber |
| **1:15** | We didn't cherry-pick this. Versus dumb retry rules, ten random runs, about sixty percent more net revenue. That's checkout v2. | Demo proof strip (v2 · +61% · seeds) |
| **1:20** | Each wedge has its own agent. We block dumb moves first — three texts already, UPI still pending — then the model picks. We score net money in the bank, not recovery rate. Spammy retries look good on a dashboard until duplicates kill you. | Pause · gesture at brain + anatomy |
| **1:40** | We didn't ship the first model. Standard DQN → Dueling Double DQN when benchmarks showed better net recovery and fewer UPI dupes. v1: ten thousand episodes. v2: twenty thousand, hyperparameter sweep first, longer exploration schedule. Checkout v2 shipped. Cart and subscription got worse — we rolled back to v1 automatically. | Optional: `/research` Decision Ledger |
| **1:55** | Razorpay merchants with real failed-payment volume. Demo, test checkout, pre-book Growth. Two point five percent success fee — pay only when money comes back. | Proof strip or landing CTA |

**Don't show:** `VAL-SUB-001` · milestone checkpoint scrubber · claiming live SMS fired · invoice v2 as shipped  
**If API fails:** narrate the scrubber replay · say "+61% vs rules, 10/10 seeds" · fallback video or `/research`

---

## After the demo — how I built it (60s)

1. **Input** — failure context: wedge, amount, decline reason, method, time elapsed (from test scenarios in demo; Razorpay webhooks in production intent).
2. **State** — 31 numbers: amount, time, contacts used, decline type, prior action, etc.
3. **Decision** — Dueling DDQN forward pass → mask illegal moves → pick best allowed action (wait, link, SMS, stop…).
4. **Reward** — net INR recovered minus contact cost, fatigue, duplicate penalties. Not gross recovery %.
5. **Loop (offline today)** — simulate millions of episodes → replay buffer → train → export weights → theater + API use those weights.

**Works today:** simulator training, benchmark gate, JSON inference, theater replay with live Q-bars.  
**Not yet:** online learning from live traffic; execute/send in the main demo UI (read-only replay).

---

## RL — why it fits + v1 → v2 iteration

Recovery is sequential and delayed: the right move depends on amount, time, and how many times you've already contacted someone. Rules can't learn that. RL trains in a simulator on **net money recovered** under a **trust budget** (max ~3 contacts).

**Algorithm:** Dueling Double DQN — network learns how good the situation is (V) and how much each action beats average (A). Double DQN stops the network from overestimating the next step. Exploration: random valid moves early, greedy later. Training: prioritized replay, Huber loss, target network synced slowly.

| Step | What we did |
|------|-------------|
| Start | Offline simulator gym — Razorpay Test Mode proves integration, doesn't train the policy |
| Split | Four wedges, four agents — different windows (72h checkout vs 30d invoice) |
| ~ep 2000 | Standard DQN → Dueling Double DQN — better net INR, fewer UPI duplicates |
| Metric | Net INR primary — blasting links wins gross % but loses on duplicates |
| Masks | Illegal contacts blocked in training and at inference |
| v1 | 10k episodes · val gate every 500 ep · best checkpoint by val net INR |
| v2 prep | 6 HPO pilots × 1,500 ep per wedge (lr, batch, γ, warmup, replay settings) |
| v2 train | 20k episodes · scaled ε-decay and cosine LR with longer run |
| v2 gate | 10 seeds × 200 episodes vs failure-rules · must beat baseline ~10%+ |
| Shipped | **checkout v2** — +1.7% vs v1, +61% vs rules (simulator benchmark) |
| Rolled back | **cart + subscription** regressed after v2 → auto-restored v1 weights |

**Technical snapshot:** 31-dim state · 11 discrete actions · Dueling net 256×256 · γ=0.98 · PER replay · exported JSON weights for inference (not PyTorch at request time).

**Say carefully:** benchmark lift is on held-out simulator scenarios, not live merchant uplift until pilots confirm. Checkout = v2 in demo; cart/sub = v1; invoice v2 = parity review, not shipped.

---

## GTM (30s + detail)

**Spoken:** Razorpay merchants in India with failed-payment volume. Try the four-wedge demo → Razorpay Test checkout on pricing → pre-book Growth (₹499 refundable test pay). Weekly pilot batches. 2.5% on recovered payments only. Expand to WhatsApp/email, phone add-on, enterprise playbooks.

**Pipeline:** merchant → demo link → watch agent decide → test checkout → connect live Razorpay → success-fee Growth → retention via pay-on-recovery + audit trail → more wedges / voice / enterprise.

---

## Prep checklist

- [ ] Backend: `uvicorn server:app --reload --port 8000` (from `backend/`)
- [ ] Frontend: `REACT_APP_BACKEND_URL=http://localhost:8000 npm start` (from `frontend/`)
- [ ] Warm: `curl http://localhost:8000/api/case/VAL-CHK-004`
- [ ] Tab ready: http://localhost:3000/checkout?record=1 · case `VAL-CHK-004`
- [ ] Proof strip loaded (v2 · +61% · seeds)
- [ ] Space / G tested · devtools hidden · backup video ready

---

## Quick answers

| Question | Answer |
|----------|--------|
| Live merchants? | Demo replays test scenarios with trained weights. Test Mode proves webhooks. Sends aren't fired in this UI. |
| vs Razorpay retries? | They route payments. We sequence recovery across channels under a trust budget, optimizing net INR. |
| Why RL? | Sequential, delayed reward, constraints — no labeled "right" actions to supervise on. |
| Why four agents? | Different failure windows and dynamics. |
| v1 vs v2? | 10k → 20k ep + HPO. Checkout v2 shipped. Cart/sub rolled back to v1. |
| Live learning? | No. Offline train → export weights → serve. |
| Net INR vs gross %? | Gross rewards spam; `AlwaysPaymentLink` hits 88% gross but worse net. |
| Price? | 2.5% per recovered payment (2.0% annual). Sandbox free + ₹1,499 test checkout. |

---

## `/research` page (if they ask)

Point at §1 problem → §2 algorithm (net INR, Dueling DDQN, masks) → Decision Ledger for v1→v2 pivots → link back to checkout demo. Skip milestone explorer and reproduce CLI in a short demo.
