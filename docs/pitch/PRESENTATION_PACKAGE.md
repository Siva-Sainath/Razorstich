# RazorStitch: Demo Script and Talk Track

**Positioning:** RazorStitch helps Razorpay merchants recover failed payments. Four trained agents cover checkout, cart, subscription, and invoice failures. Each one decides when to wait, nudge, or stop without spamming the customer. Merchants pay 2.5% only on money actually recovered.

---

## Demo URLs (Vercel)

**Start here:** https://razorstitch.vercel.app/checkout?record=1

| Page | URL |
|------|-----|
| Landing | https://razorstitch.vercel.app/ |
| Research | https://razorstitch.vercel.app/research |
| Pricing | https://razorstitch.vercel.app/pricing |
| Cart abandon | https://razorstitch.vercel.app/cart?record=1 |
| Subscription renewal | https://razorstitch.vercel.app/subscription?record=1 |
| Invoice overdue | https://razorstitch.vercel.app/invoice?record=1 |

**API for Vercel demo:** keep `./scripts/run-backend-for-vercel.sh` running on your Mac (backend + Cloudflare tunnel). Without it, the site loads but case data will not fetch.

**Local fallback:** http://localhost:3000/checkout?record=1 with `uvicorn` on port 8000 and `REACT_APP_BACKEND_URL=http://localhost:8000 npm start`

---

## Two-minute script + what to do on screen

Open: https://razorstitch.vercel.app/checkout?record=1  
Keys: **Space** play · **G** ghost paths · **← →** pause

| Time | Say this | On screen |
|------|----------|-----------|
| **0:00** | Every Razorpay merchant hits the same moment: checkout failed, and nobody knows what to do next. Blast SMS or give up. Both leak money and burn trust. | Optional: landing hero, or stay on demo |
| **0:20** | RazorStitch is payment recovery for Razorpay. Four agents: checkout, cart, subscription, invoice. Recovery is not one retry rule. It is a sequence: when to wait, when to send a link, when to stop. | Scenario bar on checkout demo |
| **0:35** | This is a test checkout we never used for training. Almost five thousand rupees, card declined, bank said do not honor. About three days to win it back without spamming the customer. | Case header, failure details |
| **0:50** | Hit play. Watch the brain score every move: wait, text, payment link. Flip ghost paths to see what basic retry rules would do on the same failure. | **Space** → Policy Brain · **G** → recovery paths |
| **1:08** | First move? Payment link. Customer pays. Green badge means money is back. | Intervention text · green scrubber |
| **1:15** | We did not cherry-pick this. Versus dumb retry rules, ten random test runs, about sixty percent more net revenue. That is our latest checkout model. | Proof strip (v2 · +61% · seeds) |
| **1:20** | Each failure type has its own agent. We block dumb moves first: three texts already sent, UPI still pending. Then the model picks. We score net money in the bank, not recovery rate. | Pause · gesture at brain + anatomy |
| **1:40** | We did not ship the first model we trained. We moved to a better network when tests showed higher net recovery and fewer UPI duplicates. v1 was ten thousand practice runs. v2 was twenty thousand with tuning first. Checkout v2 shipped. Cart and subscription got worse, so we rolled back to v1 automatically. | Optional: `/research` Decision Ledger |
| **1:55** | Razorpay merchants with real failed-payment volume. Try the demo, test checkout, pre-book Growth. Two point five percent success fee. Pay only when money comes back. | Proof strip or landing CTA |

**Don't show:** `VAL-SUB-001` · milestone checkpoint scrubber · claiming live SMS fired · invoice v2 as fully shipped  
**If API fails:** narrate the scrubber replay · say "+61% vs rules, 10/10 seeds" · fallback to `/research`

---

## After the demo: how I built it (60s)

1. **Input:** what failed, how much money, decline reason, payment method, time elapsed (from test scenarios in the demo; Razorpay webhooks in production).
2. **State:** about 31 numbers the model reads: amount, time, contacts used, decline type, last action, and so on.
3. **Decision:** trained model scores each allowed action, safety rules remove bad options, then it picks the best one (wait, link, SMS, stop).
4. **Reward:** net money recovered minus contact cost, fatigue, and duplicate penalties. Not gross recovery percentage.
5. **Loop today:** practice in simulator, train, export weights, demo and API use those weights. No live learning from merchant traffic yet.

---

## How the agents learn (v1 to v2)

Recovery is a timing problem. The right move depends on amount, time, and how many times you already contacted someone. Fixed rules cannot learn that. We train in a simulator on **net money recovered** with a **trust budget** (about three contacts max).

| Step | What we did |
|------|-------------|
| Start | Practice offline in a simulator. Razorpay Test Mode proves integration only. |
| Split | Four agents for four failure types. Different time windows (72h checkout vs 30d invoice). |
| Network upgrade | Switched to Dueling Double DQN when benchmarks improved net recovery and cut UPI duplicates. |
| Metric | Net INR primary. Blasting links wins gross % but loses on duplicates. |
| Safety rules | Block illegal contacts in training and in the live API. |
| v1 | 10k practice episodes per scenario. Save best model on validation score. |
| v2 prep | Six tuning pilots per scenario before the full 20k run. |
| v2 ship | Checkout v2 shipped (+61% vs rules in simulator). Cart and subscription rolled back to v1 after regressions. |

**Say carefully:** benchmark lift is on practice scenarios, not live merchant results until pilots confirm. Checkout uses v2 in the demo; cart and subscription still use v1; invoice v2 is under review.

---

## GTM (30s)

**Spoken:** Razorpay merchants in India with failed-payment volume. Try the four-scenario demo, run Razorpay Test checkout on pricing, pre-book Growth with a refundable test payment. Weekly pilot batches. 2.5% on recovered payments only. Later: WhatsApp and email, phone recovery add-on, enterprise plans.

**Pipeline:** merchant → demo link → watch agent decide → test checkout → connect live Razorpay → success-fee Growth → retention via pay-on-recovery + audit trail → more scenarios / voice / enterprise.

---

## Prep checklist

- [ ] Backend running on port 8000, or `./scripts/run-backend-for-vercel.sh` for Vercel
- [ ] Tab ready: checkout demo with `?record=1`, case `VAL-CHK-004`
- [ ] Proof strip loaded (v2 · +61% · seeds)
- [ ] Space and G tested, devtools hidden

---

## Quick answers

| Question | Answer |
|----------|--------|
| Live merchants? | Demo replays test scenarios with trained weights. Test Mode proves webhooks. This UI does not send live SMS. |
| vs Razorpay retries? | Razorpay routes payments. We decide the recovery sequence across channels under a trust budget. |
| Why learning agents vs rules? | Timing matters, rewards are delayed, and there is no single "correct" label to supervise on. |
| Why four agents? | Checkout, cart, subscription, and invoice have different timelines and customer behavior. |
| v1 vs v2? | 10k → 20k practice runs plus tuning. Checkout v2 shipped. Cart and subscription rolled back to v1. |
| Live learning? | No. Train offline, export weights, serve those weights. |
| Net INR vs gross %? | Gross rewards spam. Always sending links recovers more payments but worse net economics. |
| Price? | 2.5% per recovered payment (2.0% annual). Sandbox free + ₹1,499 test checkout. |

---

## Research page (if they ask)

Start with the problem section, then the algorithm (net money, Dueling DDQN, safety masks), then the Decision Ledger for v1 to v2 changes. Link back to the checkout demo. Skip milestone scrubber and reproduce commands in a short pitch.
