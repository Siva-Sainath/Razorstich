# Agent prompt: Research page (Eric Jang / AutoGo style)

Copy everything below the line into a new agent session. **Do not touch demo pages** (`frontend/src/components/stage/`, `WedgeStageLoader`, timeline) — another session owns those.

---

## Task

Rewrite and polish `/research` so it reads like [Eric Jang's AutoGo tutorial](https://evjang.com/2026/04/28/autogo.html#cover): one continuous interactive essay with numbered sections, tight first-person prose, figure captions, and checkpoint scrubbing — not a generic dashboard.

**Repo:** `/Users/siva/Documents/Recovery_agent`  
**Primary files:**
- `frontend/src/components/research/ResearchDashboard.jsx`
- `frontend/src/components/research/InteractiveTrainingWalkthrough.jsx`
- `frontend/src/components/research/ResearchFigure.jsx`
- `frontend/src/components/research/DecisionLedger.jsx`
- `frontend/src/components/research/MethodPipeline.jsx`
- `frontend/src/components/research/MilestoneExplorer.jsx`
- `frontend/src/components/research/HpoSweepPanel.jsx`
- `frontend/src/components/research/RunComparePanel.jsx`
- `frontend/src/components/research/WedgeResearchPanel.jsx`
- `frontend/src/config/trainingNarrative.js`

**Data source:** `GET /api/wedges/catalog` (backend must be running). Artifacts live in `eval/results/`.

---

## What exists today

- `InteractiveTrainingWalkthrough` — §1–§6 beats, episode scrubber on checkout curve
- `ResearchDashboard` — FIG.1–5 blocks, wedge tabs, milestone explorer, decision ledger
- Honest v2 story: checkout_failed v2 shipped (+61% vs rules); cart/sub regressed to v1
- AutoGo link in hero copy

**Problem:** Lower half still feels like a dashboard (tabs, multiple panels). Eric's AutoGo is one scroll, one voice, figures embedded in narrative.

---

## Target experience (Eric Jang style)

1. **Cover** — Title, one paragraph hook, “start here” anchor
2. **§1–§8 linear scroll** — Each section:
   - Numbered label (`§3`, `FIG.2`)
   - 2–4 sentences first-person (“We tried X, then Y happened”)
   - One interactive or visual element inline (not a separate tabbed UI)
   - Short caption under each figure (AutoGo captions are dry and specific)
3. **Checkpoint scrubbing** — User drags episode slider; narrative text updates (“At ep 1200, val_net_inr jumped to ₹X”)
4. **Decision ledger** — Woven as margin notes or collapsible asides, not a standalone admin table
5. **Honest failures** — cart/sub v1 restore, invoice parity hold — stated plainly, not buried
6. **End card** — “Reproduce this run” with CLI commands + link to `/checkout` demo

**Tone:** Curious engineer explaining to a smart friend. No marketing fluff. No fake customer quotes.

**Reference:** https://evjang.com/2026/04/28/autogo.html#cover

---

## Content to include (real numbers only)

From `eval/results/` and training run:

- 20k episodes, seed 42, per-wedge HPO (6 × 1500 ep)
- checkout_failed: v2 mean net INR ~₹516k vs rules ~₹320k (+61%), 10/10 seeds
- checkout v2 vs v1: +1.7%
- cart_abandon, subscription_failed: v2 regressed → v1 restored
- invoice_overdue: trained, parity gate open
- Policy version in demo: `dueling-ddqn-v2-*` for checkout

---

## Constraints

- Keep `SiteNav`, `WedgeNav`, existing API calls — no backend changes unless broken
- Use existing design tokens (`type-hero`, `font-display`, `surface-1`, `ResearchFigure`)
- Mobile-readable
- Do **not** modify: `frontend/src/pages/LandingPage.jsx`, `PricingPage.jsx`, `StartPage.jsx`, stage/demo components
- Do **not** add fake testimonials

---

## Acceptance criteria

- [ ] `/research` reads as one scroll story top-to-bottom (minimize tab switching)
- [ ] § sections numbered; each has caption + at least one real chart/scrubber
- [ ] Eric Jang / AutoGo credited once in intro
- [ ] v2 wins and regressions both visible
- [ ] `npm run build` in `frontend/` passes
- [ ] No new linter errors

---

## Optional nice-to-haves

- Table of contents sticky on left (AutoGo-style section nav)
- URL hash per section (`/research#section-4`)
- Print-friendly CSS for sharing as PDF

---

## Verify

```bash
cd frontend && npm run build
# With backend on :8000:
# Open http://localhost:3000/research
```
