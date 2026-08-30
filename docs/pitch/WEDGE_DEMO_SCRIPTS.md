# Wedge Demo Scripts — Short Video Pack

**Purpose:** Record one ~60–90s clip per recovery wedge for GTM, pilots, and social.  
**Stack:** `uvicorn server:app --reload --port 8000` + `npm start` in `frontend/` with `REACT_APP_BACKEND_URL=http://localhost:8000`

---

## Recording setup (all wedges)

1. Open the wedge URL below in Chrome at **1280×720** or **1920×1080**.
2. In the stage rail (bottom): **Pitch mode ON**, pace **Slow** (0.45× — ~2 min full replay; trim in edit).
3. Confirm the **Pitch script** panel is visible at the top of the stage.
4. Press **Play** (or Space). Pitch mode **auto-pauses** at each step — advance with Space when you finish speaking.
5. Point at: failure anatomy → Policy Brain Q-bars → metrics rail → drafted message → recovered outcome.
6. Hide devtools; crop OBS to the stage if you want a clean embed.

**Keyboard:** Space play/pause · ← → step ticks · `G` toggle ghost baselines

**Honest framing:** These are held-out **validation scenarios** replayed with trained policies — simulator demo, not live merchant traffic.

---

## 1. Checkout failed

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/checkout` |
| **Case** | `VAL-CHK-004` |
| **Amount** | ₹4,999 |
| **Decline** | `DO_NOT_HONOR` (card) |
| **Window** | 72h · 6h ticks |

### Intro (~10s)

> "This is our **checkout recovery agent**. It handles failed card and UPI payments. When Razorpay sends a decline, we open a 72-hour recovery window and decide when to wait, send a payment link, or escalate — without spamming the customer."

**Point at:** Wedge intro strip · case ID in rail

### Beat-by-beat

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "A ₹4,999 card checkout failed — DO NOT HONOR. Same customer, same cart; the clock starts." | Decline code · amount hero |
| **Observe** | "The agent reads context first — failure reason, amount, contacts already sent. No blast yet." | Metrics · contact budget |
| **Policy** | "The model ranks every allowed step — wait, SMS, payment link — and picks the best one." | Policy Brain · Q-bars |
| **Step 1 — payment link** | "First move: a fresh Razorpay payment link — one tap to complete checkout." | Intervention draft · channel |
| **Step 2 — escalate** | "For a high-value checkout, the agent can escalate to human-style support when the model expects lift." | Escalation action · ghost compare (optional `G`) |
| **Outcome** | "Payment recovered. ₹4,999 is back — merchants pay us 2.5% only on success." | Recovered badge · outcome panel |

### Close (~8s)

> "Same theater, trained Dueling DDQN weights — full audit trail of what was tried and when."

**Export as:** `demo-checkout.mp4`

---

## 2. Cart abandon

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/cart` |
| **Case** | `VAL-CART-002` |
| **Amount** | ₹1,899 |
| **Signal** | Cart idle on payment page |
| **Window** | 48h · 2h ticks |

### Intro (~10s)

> "This is our **cart recovery agent**. Shoppers left items behind — we track intent decay and pick the right moment for a reminder or payment link."

**Point at:** Funnel / intent decay if visible · ghost overlay (cart wedge defaults ghost on)

### Beat-by-beat

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "Customer reached payment but didn't complete — ₹1,899 still in cart." | Cart idle state · amount |
| **Observe** | "Intent is cooling. The agent waits until a nudge is worth the trust cost." | Intent decay curve |
| **Policy** | "Policy Brain chooses among wait, SMS, WhatsApp, and payment link." | Q-bars |
| **Step 1 — payment link** | "A payment link goes out — low friction path back to checkout." | Draft message · link action |
| **Outcome** | "Recovered. On Growth you only pay when money actually comes back." | Recovered state |

### Close (~8s)

> "Cart abandon is our highest-volume wedge for D2C — same agent API as checkout, different policy weights."

**Export as:** `demo-cart.mp4`

---

## 3. Subscription failed

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/subscription` |
| **Case** | `VAL-SUB-003` |
| **Amount** | ₹499 / renewal |
| **Decline** | Card renewal failure |
| **Window** | 14d · 12h ticks |

**Note:** This case has **14 steps**. For a short clip, narrate **steps 1–4** (wait → update card → wait → payment link) then jump to the **recovered** outcome, or record at Slow pace and cut in post.

### Intro (~10s)

> "This is our **subscription recovery agent**. Failed renewals are churn in disguise — we help subscribers update cards or pay before they drop off."

**Point at:** Renewal ring · churn meter

### Beat-by-beat (recommended clip: first 4 steps + outcome)

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "Renewal failed on a ₹499 subscription — card declined." | Renewal fail chapter |
| **Observe** | "Agent watches the 14-day window — renewal day is fragile." | Churn meter |
| **Step 1 — wait** | "First it waits — the customer may fix the card on their own." | Wait action |
| **Step 2 — update method** | "Then it asks for a new payment method — critical after expiry." | Request new method draft |
| **Step 4 — payment link** | "When ready, a fresh payment link closes the renewal." | Payment link step |
| **Outcome** | "Subscriber retained. ₹499 recovered — 2.5% on success only." | Recovered · retain chapter |

### Close (~8s)

> "Subscription policies are trained separately — different action mask, same RazorStitch integration."

**Export as:** `demo-subscription.mp4`

---

## 4. Invoice overdue

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3000/invoice` |
| **Case** | `VAL-INV-002` |
| **Amount** | ₹45,000 |
| **Signal** | B2B invoice overdue |
| **Window** | 30d · 24h ticks |

### Intro (~10s)

> "This is our **invoice recovery agent**. Overdue B2B invoices need polite dunning — reminders, partial paths, and escalation when AR teams need help."

**Point at:** Dunning ladder · AR timeline · amount hero

### Beat-by-beat

| Beat | Say | Point at |
|------|-----|----------|
| **Failure** | "₹45,000 invoice is overdue — net terms, enterprise buyer." | Invoice context |
| **Observe** | "The agent sequences email-first outreach — fits AR workflows." | Dunning ladder position |
| **Policy** | "Large amounts unlock escalate and partial-offer actions under guardrails." | Policy Brain |
| **Step 1 — escalate** | "For this case the model escalates — high-value B2B often needs a human touch, or voice in production." | Escalate support draft |
| **Outcome** | "Invoice paid. Full audit trail for finance — what was sent and when." | Recovered |

### Close (~8s)

> "Invoice wedge uses the same recommend API — `wedge: invoice_overdue` on your Razorpay webhooks."

**Export as:** `demo-invoice.mp4`

---

## Share links (with referral)

Append `?ref=YOUR_CODE` for pilot queue tracking (see landing share panel).

| Wedge | Path |
|-------|------|
| Checkout | `/checkout` |
| Cart | `/cart` |
| Subscription | `/subscription` |
| Invoice | `/invoice` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot reach backend" | Start `uvicorn` in `backend/`; set `REACT_APP_BACKEND_URL` |
| Pitch script missing | Toggle Pitch mode on in stage rail |
| Voice guide on pricing | Needs `SMALLEST_AI_API_KEY` in `backend/.env` + agent allowlist for localhost |
| Lead form fails | Requires `company` + `email` — use `/start` form |
| Stale theater doc | Use this file; `THEATER_DEMO_SCRIPT.md` is legacy montage format |

---

## Related config (source of truth)

- Flagship case IDs: `frontend/src/config/wedges.js`
- On-screen narration: `frontend/src/config/pitchNarrative.js` + `PitchNarrator.jsx`
- Pitch timing: `frontend/src/lib/timelineContext.js` (`PITCH_SPEED_PRESETS`)
