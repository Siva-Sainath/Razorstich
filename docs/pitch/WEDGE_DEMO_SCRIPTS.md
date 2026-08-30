# Wedge Demo Scripts — Short Video Pack

**Purpose:** Record one ~60–90s clip per recovery wedge for GTM, pilots, and social.  
**Stack:** `uvicorn server:app --reload --port 8000` + `npm start` in `frontend/` with `REACT_APP_BACKEND_URL=http://localhost:8000`

---

## Recording setup (all wedges)

1. Open the wedge URL with **`?record=1`** in Chrome at **1280×720** or **1920×1080** (hides SiteNav, compact scenario bar, 0.65× playback).
2. Press **Play** in the dock scrubber (bottom) or **Space**. Advance moments with **← →** when you want to pause on a beat.
3. Narrate one card per scroll region (top → bottom):
   - **Case header** — what failed and stake
   - **Failure anatomy** — decline context + trust budget
   - **Policy brain** — Q-bars + pipeline
   - **Demo proof strip** — model version, lift, seeds
   - **Recovery paths** — ghost vs chosen path + timing window
   - **Scenario feature** — wedge-specific hook (expand “Show customer screen” briefly for SMS/link UX)
   - **Intervention composer** — drafted message + confidence
4. Hide devtools; crop OBS to the stage if you want a clean embed.

**Keyboard:** Space play/pause · ← → moments · `G` toggle ghost baselines

**Honest framing:** These are held-out **validation scenarios** replayed with trained policies — simulator demo, not live merchant traffic.

---

## 1. Checkout failed

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/checkout?record=1` |
| **Case** | `VAL-CHK-004` |
| **Amount** | ₹4,999 |
| **Decline** | `DO_NOT_HONOR` (card) |
| **Window** | 72h · 6h ticks |

### Intro (~10s)

> "This is our **checkout recovery agent**. It handles failed card and UPI payments. When Razorpay sends a decline, we open a 72-hour recovery window and decide when to wait, send a payment link, or escalate — without spamming the customer."

**Point at:** Compact scenario bar · case ID

### Beat-by-beat

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "A ₹4,999 card checkout failed — DO NOT HONOR. Same customer, same cart; the clock starts." | Case header · decline code |
| **Observe** | "The agent reads context first — failure reason, amount, contacts left in the trust budget." | Failure anatomy |
| **Policy** | "The model ranks every allowed step — wait, SMS, payment link — and picks the best one." | Policy brain · Q-bars |
| **Proof** | "This is v2 weights — +61% lift on held-out seeds vs rules baseline." | Demo proof strip |
| **Paths** | "Ghost paths show what a rules engine would do; the agent chose a smarter sequence." | Recovery paths panel (`G` for ghosts) |
| **Step 1 — payment link** | "First move: a fresh Razorpay payment link — one tap to complete checkout." | Intervention draft |
| **Outcome** | "Payment recovered. ₹4,999 is back — merchants pay us 2.5% only on success." | Recovered badge in scrubber |

### Close (~8s)

> "Same theater, trained Dueling DDQN weights — full audit trail on /research."

**Export as:** `demo-checkout.mp4`

---

## 2. Cart abandon

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/cart?record=1` |
| **Case** | `VAL-CART-002` |
| **Amount** | ₹1,899 |
| **Signal** | Cart idle on payment page |
| **Window** | 48h · 2h ticks |

### Intro (~10s)

> "This is our **cart recovery agent**. Shoppers left items behind — we track intent decay and pick the right moment for a reminder or payment link."

**Point at:** Scenario feature card · intent decay

### Beat-by-beat

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "Customer reached payment but didn't complete — ₹1,899 still in cart." | Case header |
| **Observe** | "Intent is cooling. The agent waits until a nudge is worth the trust cost." | Failure anatomy · feature card |
| **Policy** | "Policy brain chooses among wait, SMS, WhatsApp, and payment link." | Q-bars |
| **Step 1 — payment link** | "A payment link goes out — low friction path back to checkout." | Intervention draft |
| **Outcome** | "Recovered. On Growth you only pay when money actually comes back." | Dock scrubber outcome |

### Close (~8s)

> "Cart abandon is our highest-volume wedge for D2C — same agent API as checkout, different policy weights."

**Export as:** `demo-cart.mp4`

---

## 3. Subscription failed

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/subscription?record=1` |
| **Case** | `VAL-SUB-003` |
| **Amount** | ₹499 / renewal |
| **Decline** | Card renewal failure |
| **Window** | 14d · 12h ticks |

**Note:** This case has **14 steps**. For a short clip, narrate **steps 1–4** then scrub to **recovered**, or record at 0.65× and cut in post.

### Intro (~10s)

> "This is our **subscription recovery agent**. Failed renewals are churn in disguise — we help subscribers update cards or pay before they drop off."

**Point at:** Renewal ring · churn meter in feature card

### Beat-by-beat (recommended clip: first 4 steps + outcome)

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "Renewal failed on a ₹499 subscription — card declined." | Case header |
| **Observe** | "Agent watches the 14-day window — renewal day is fragile." | Feature card |
| **Step 1 — wait** | "First it waits — the customer may fix the card on their own." | Recovery paths |
| **Step 2 — update method** | "Then it asks for a new payment method — critical after expiry." | Intervention draft |
| **Outcome** | "Subscriber retained. ₹499 recovered — 2.5% on success only." | Recovered in scrubber |

### Close (~8s)

> "Subscription policies are trained separately — different action mask, same RazorStitch integration."

**Export as:** `demo-subscription.mp4`

---

## 4. Invoice overdue

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/invoice?record=1` |
| **Case** | `VAL-INV-002` |
| **Amount** | ₹45,000 |
| **Signal** | B2B invoice overdue |
| **Window** | 30d · 24h ticks |

### Intro (~10s)

> "This is our **invoice recovery agent**. Overdue B2B invoices need polite dunning — reminders, partial paths, and escalation when AR teams need help."

**Point at:** Dunning ladder in feature card

### Beat-by-beat

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "₹45,000 invoice is overdue — net terms, enterprise buyer." | Case header |
| **Observe** | "The agent sequences email-first outreach — fits AR workflows." | Failure anatomy |
| **Policy** | "Large amounts unlock escalate and partial-offer actions under guardrails." | Policy brain |
| **Step 1 — escalate** | "For this case the model escalates — high-value B2B often needs a human touch." | Intervention draft |
| **Outcome** | "Invoice paid. Full audit trail for finance — what was sent and when." | Recovered |

### Close (~8s)

> "Invoice wedge uses the same recommend API — `wedge: invoice_overdue` on your Razorpay webhooks."

**Export as:** `demo-invoice.mp4`

---

## Share links (with referral)

Append `?ref=YOUR_CODE` for pilot queue tracking. Add `&record=1` for clean capture.

| Wedge | Path |
|-------|------|
| Checkout | `/checkout?record=1` |
| Cart | `/cart?record=1` |
| Subscription | `/subscription?record=1` |
| Invoice | `/invoice?record=1` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot reach backend" | Start `uvicorn` in `backend/`; set `REACT_APP_BACKEND_URL` |
| Nav chrome in recording | Add `?record=1` to the demo URL |
| Playback too fast | `?record=1` defaults to 0.65×; scrub with dock rail |
| Growth pre-book fails | Restart backend; set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in `backend/.env` |
| Lead form fails | Requires `company` + `email` — use `/start` form |

---

## Related config (source of truth)

- Flagship case IDs: `frontend/src/config/recoveryScenarios.js`
- Record mode: `frontend/src/lib/recordMode.js`
- Playback speed: `frontend/src/lib/timelineContext.js`
