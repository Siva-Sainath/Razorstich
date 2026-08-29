# RazorStitch RL Architecture — Read This Before Training

## The one sentence version

**We train the DQN in a fast offline simulator; Razorpay Test Mode proves the policy on real checkout failures — it is not the training gym.**

---

## Why not train inside Razorpay sandbox?

| If we trained on live Razorpay API | What happens |
|---|---|
| 1,500 RL episodes × ~5 steps | **7,500+ checkout API calls** — rate limits, manual test-card entry, hours of wall time |
| Stochastic real failures | Non-reproducible benchmarks — judges can't verify "same seed, same result" |
| Customer fatigue / duplicates | Real money risk even in test mode; duplicate UPI charges are a product incident |
| Hidden state | Razorpay doesn't expose "customer annoyance" or "will retry spontaneously" — we'd still need a model |

**Design choice (locked):** Simulator = gym. Razorpay = validation + demo + calibration.

```
┌─────────────────────────────────────────────────────────────────┐
│  OFFLINE TRAINING (MacBook, minutes)                            │
│  RecoveryEnv → DQN → eval/checkpoints/dqn_*.pt                  │
│  Hidden CustomerResponseModel encodes research-backed dynamics  │
└────────────────────────────┬────────────────────────────────────┘
                             │ export policy_rules.json
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ONLINE INFERENCE (Vercel + Supabase)                           │
│  Webhook payment.failed → map error → recommend action          │
│  Guardrails: action masks + Trust Budget + UPI wait rules       │
└────────────────────────────┬────────────────────────────────────┘
                             │ human triggers recovery action
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  RAZORPAY TEST MODE (proof, not training)                       │
│  Test cards → real payment.failed / payment.captured webhooks   │
│  Label: confirmed Test Mode recovered value (separate metric)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## What the agent is learning

Each **episode** = one failed payment case over up to **72 hours** (12 steps × 6h).

1. **Reset** — sample amount, method (card/UPI), failure reason, error source
2. **Observe** — 37-dim vector (amount, time, reason one-hot, contacts left, prior action, …)
3. **Act** — one of 11 recovery actions (masked if unsafe)
4. **Transition** — hidden customer model rolls P(recovery), P(duplicate), contact fatigue
5. **Reward** — net value (collected − comm cost − friction − duplicate penalty)
6. **Terminate** — recovered, stopped, or horizon hit

The agent is **not** learning to call Razorpay APIs directly. It learns **when** to wait, notify, retry, send a payment link, escalate, or stop — conditioned on failure anatomy.

---

## Research → simulator mapping

| Research / Razorpay docs insight | Where it lives in code |
|---|---|
| `insufficient_funds` → wait 24–72h before aggressive nudge | `CustomerResponseModel`: low notify success if `hours < 12`; spontaneous recovery rises after 24h wait |
| UPI duplicate risk if retry too soon | `duplicate_payment_risk()` + `action_mask()` blocks retry/link in first hour on `upi_timeout` |
| Contact fatigue / trust erosion | `fatigue = 1 - 0.22 * contacts_used`; notify success scales down |
| Gateway errors → retry sooner | Higher `action_success_prob` for `retry_checkout` on `gateway_error` |
| Auth failures → suggest alt method | Failure-rules baseline + higher success for `suggest_alt_method` |
| Net value > gross recovery | `RewardCalculator` subtracts comm cost, friction, duplicate penalty |
| Trust Budget (3 contacts / 7 days) | `EpisodeState.contacts_max=3`; mask blocks notify/resend when exhausted |
| Segment: invoice dunning ≠ one-time checkout | Failure-rules baseline encodes per-reason defaults; DQN learns timing within segment |

---

## Policy training vs reward training

| Term | What it means here |
|---|---|
| **Policy training** | DQN updates Q-network weights to maximize **discounted sum of step rewards** over episodes (`packages/policy/dqn.py`) |
| **Reward design / shaping** | `RewardCalculator` defines what "good" means — tunable weights without changing network architecture |
| **Constraint layer** | `action_mask()` + API guardrails — hard rules the policy cannot violate at inference |

You can retrain policy (change DQN) or retune reward weights (change `RewardCalculator` coefficients) independently. For the demo, **policy training** is the headline; reward coefficients are fixed from research defaults.

---

## Guardrails against reward hacking

| Exploit | Guardrail |
|---|---|
| Spam `create_payment_link` for high gross recovery | Comm cost per action + contact fatigue lowers hidden success prob |
| Retry UPI immediately → duplicate charge | 35% duplicate risk in first hour; −50% amount penalty; action masked |
| Burn contact budget on low-value cases | Friction term scales with `contacts_used / contacts_max` |
| Pick invalid/masked actions | Forced to `wait` + `unsafe_penalty` on reward |
| Over-use human escalate (₹5 cost) | `ESCALATE_HUMAN` cost in `ACTION_COST_INR` |
| Train on simulator, fail in production | Dual metrics: `simulated recovered value` vs `confirmed Test Mode recovered value` |
| Policy bypass at API | `apps/web/src/lib/policy.ts` re-applies Trust Budget + UPI wait after DQN export |

---

## Key files

| File | Role |
|---|---|
| `packages/simulator/env.py` | MDP — reset, step, reward |
| `packages/simulator/customer_model.py` | Hidden dynamics (policy cannot see these tables) |
| `packages/simulator/state.py` | Obs vector + action masks |
| `packages/simulator/actions.py` | Action enum + INR costs |
| `packages/policy/reward.py` | Net-value reward |
| `packages/policy/dqn.py` | DQN agent + replay + training loop |
| `packages/policy/baselines.py` | failure_rules, backoff, etc. |
| `packages/razorpay/bridge.py` | Razorpay webhook → simulator state (calibration, not training) |
| `apps/web/src/app/api/webhooks/razorpay/route.ts` | Real Test Mode events |

---

## Razorpay's role in the loop (demo script)

1. Merchant checkout fails with a **test card** (e.g. insufficient funds)
2. `payment.failed` webhook hits `/api/webhooks/razorpay`
3. Error mapped → `failure_reason` → policy recommends action
4. Merchant UI shows "Operating Theater" decision + Q-values
5. Human (or automated test script) executes recovery (Payment Link, wait, notify)
6. `payment.captured` webhook → **confirmed Test Mode recovered value** logged

See [`RAZORPAY_TEST_MODE.md`](./RAZORPAY_TEST_MODE.md) for card setup.
