# RazorStitch Theater Demo Script

**Format:** Hybrid — one flagship replay + quick montage  
**Default case:** `VAL-CHK-002` (insufficient funds · 9 steps · recovered)  
**Run locally:** `uvicorn server:app --reload --port 8000` + `yarn start` with `REACT_APP_BACKEND_URL=http://localhost:8000`

---

## Act 0 — Learning Lab (60s)

**Screen:** Open `/learn` and leave the checkpoint replay running at 10×.  
**Say:** "Before we watch one recovery, here is how the policy improved. These are real saved Dueling DDQN checkpoints from the same training run. Each checkpoint is replayed on the same held-out validation case, so the comparison is controlled: same scenario, different policy maturity."

**Point at:** Validation learning arc · policy versus failure-rules benchmark · checkpoint actions · epsilon decreasing.  
**Say:** "The learning curve is aggregate validation net value across the fixed validation set. The checkpoint panel is a single scenario replay. This is a simulator demonstration, not live merchant traffic."

**Handoff:** Click **Open Theater** to watch the final policy handle the featured validation case.

---

## Act 1 — Problem & agents (30s)

**Screen:** Agents strip at top  
**Say:** "Merchants lose revenue on four failure wedges — checkout failed, cart abandon, subscription failed, invoice overdue. We trained one Dueling DDQN per wedge; each agent decides *when* and *how* to nudge without burning trust."

**Point at:** Four agent cards · weights path · tick/window metadata  
**Avoid:** Generic dashboard talk; tie each card to a real wedge policy.

---

## Act 2 — Flagship replay (90s)

**Screen:** Let auto-play run on **`VAL-CHK-002`** (loads by default)  
**Say:** "This is a real validation scenario — insufficient funds on a card checkout. Watch the Policy Brain: live Q-values from our trained weights, guardrails masking illegal actions, then the intervention the agent would send."

**Beats to narrate:**

1. **Failure anatomy** — decline code, method, amount at stake  
2. **Policy Brain** — tick advances, Q-bars update, chosen action + note  
3. **Recovery window** — odds curve climbing  
4. **Agent recommendation** — drafted SMS/WhatsApp copy (approve is toast-only for demo)  
5. **Ghost runs** — counterfactual baselines vs DQN  
6. **Dock** — scrub or let replay finish to **Recovered**

**Keyboard:** Space play/pause · ← → step ticks

---

## Act 3 — Montage (45s)

**Screen:** Recovery queue (right column)  
**Click in order:**

| Case | Agent | Note |
|------|-------|------|
| `VAL-CART-003` | Cart Abandon | One Policy Brain tick — show different wedge |
| `VAL-SUB-003` | Subscription Failed | Renewal lane |
| `VAL-INV-001` | Invoice Overdue | B2B dunning |

**Say:** "Same theater, four policies — queue loads real scenario payloads; Policy Brain routes to the correct weights file."

**Never demo:** `VAL-SUB-001` (episode does not recover).

---

## Act 4 — Benchmark (30s)

**Screen:** Slide or terminal — `eval/results/benchmark_*_stats.json`  
**Say:** "DQN beats rule baselines on recovery rate while respecting contact budgets — trained in our simulator, evaluated on held-out validation scenarios."

---

## Stretch (optional)

Full replay for `VAL-CART-003` and/or `VAL-INV-001` if judges want depth.

---

## Honest data sources (if asked)

| UI element | Source |
|------------|--------|
| Q-values / chosen action | Live forward pass — `packages/policy/weights/*.json` |
| Timeline, curves, ghost runs | DQN rollouts from `packages/simulator/tasks/val_scenarios.json` |
| System activity ticker | Backend SSE ambient ops messages (not live Razorpay webhooks) |
| Approve button | UI toast only — no payment execution in theater |

---

## Pre-demo checklist

- [ ] Backend up; first `/api/case/current` completes (~10s cold build)  
- [ ] Frontend `.env` points to backend  
- [ ] Default case shows `VAL-CHK-002` in header  
- [ ] Policy Brain shows `dueling_dqn_forward_pass` (not loading forever)  
- [ ] Queue lists 14 cases; montage IDs load without error  
- [ ] No console `ReferenceError` or failed API calls
