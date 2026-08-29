# plan.md — RazorStitch Recovery Operating Theater (React SPA + FastAPI)

## 1) Objectives
- **Functional goal (COMPLETED):** Deliver a fully working, cinematic single‑case recovery console that makes the RL/DQN recovery loop legible (diagnose → decide → intervene → recover) across a full episode.
- **Synchronization goal (COMPLETED):** Ensure one global `timelineT (0..1)` drives *all* dependent UI (policy recommendation, recovery curve playhead, ghost runs, customer plane, interventions, trust budget, live ticker highlight, dock).
- **Backend mocking goal (COMPLETED):** Provide a believable mocked backend:
  - `GET /api/case/current` → 72h episode narrative
  - `POST /api/policy/recommend` → DQN export with 11 actions + Q-values + guardrails
  - `GET /api/events/stream` → SSE telemetry
- **Design/brand goal (COMPLETED):** Ship a **RazorSense-consistent** premium UI (not a generic admin dashboard / not “vibe coded”), with calm information hierarchy, high usability and accessibility, and a coherent design system applied across the entire experience.
- **MDP legibility goal (COMPLETED):** Make the MDP explicit in microcopy: **72‑hour episode**, **6‑hour decision ticks**, **≤12 steps**, **trust budget 3 contacts**, and visually show policy decisions changing over ticks.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): “Timeline ↔ SSE ↔ Derived State” (COMPLETED)
**Goal:** Prove the hardest system: synchronized global time + derived state + continuous SSE stream.

**User stories**
1. As a judge, I can press Play and watch the case progress through clear stages ending in “Recovered”.
2. As a judge, I can scrub the timeline and every panel updates in lockstep.
3. As a judge, I see new live events stream in (SSE) without freezing or duplication.
4. As a judge, I can pause and inspect past events, then resume.
5. As a judge, I can snap the scrubber to key events (markers) to understand the narrative.

**Backend (FastAPI) POC**
- Implemented `GET /api/case/current` returning one mock case payload.
- Implemented `GET /api/events/stream` SSE (text/event-stream) streaming ambient ops events.

**Frontend POC**
- Implemented `TimelineProvider` (context) with:
  - `t`, `playing`, rAF play loop
  - derived selectors (activeEventIndex, stage, recoveryProb, intervention)
- Implemented a working scrubber + play/pause + SSE ticker integration.

**POC acceptance**
- Achieved: timeline scrub updates derived values; SSE connects; app remains responsive.

---

### Phase 2 — V1 App Development (MVP Theater Screen) (COMPLETED)
**Goal:** Build the full cinematic single-screen theater and wire every panel to `timelineT`.

**User stories**
1. As a judge, I instantly understand the case (amount, merchant, decline reason, status) from the hero.
2. As a judge, I can scrub the recovery curve playhead to inspect any moment.
3. As a judge, I can compare chosen vs alternate paths (ghost runs).
4. As a judge, I can watch the checkout preview morph as interventions change.

**Core panels delivered (all driven by provider selectors)**
- CaseHeader (hero)
- FailureAnatomy
- RecoveryWindow (custom SVG + draggable playhead)
- CounterfactualGhostRuns (custom SVG)
- CustomerPlane (mock checkout morph)
- InterventionComposer
- TrustBudget
- LiveEventTicker (SSE)
- AuditTrailScrubber (global slider + markers + controls)

**Phase 2 checkpoint: Testing agent**
- COMPLETED: initial test run passed **29/29** (100%).

---

### Phase 3 — Brand Identity Elevation (Surgical Productization) (COMPLETED)
**Goal:** Upgrade from “cool demo dashboard” → a distinct product identity, without breaking logic or test IDs.

**Delivered**
- Brand components (LogoMark/Wordmark/ECGTrace/top rail + boot intro)
- OR-monitor overlays and instrument-style panel chrome
- Motion polish and regression verification

**Outcome**
- Confirmed cinematic/recognizable “Operating Theater” identity and stable interactions.

---

### Phase 4 — 72h MDP + DQN Policy Brain Hero (COMPLETED)
**Goal:** Make the RL agent unmissable and scientifically legible: **Q-values**, **selected_action**, **guardrails**, and decision ticks.

**Backend additions (COMPLETED)**
- Updated mock case model to **72h episode**:
  - `case.windowHours=72`, `case.tickHours=6`, `case.maxSteps=12`
  - `case.maxContacts=3`
- Implemented `POST /api/policy/recommend` returning:
  - `selected_action`
  - `q_values` object for 11 actions
  - `policy_version: dqn-export-4748`, `source: dqn_export`
  - `constraints_passed/constraints_total`
  - `guardrails[]` with enforced states (e.g., contact budget masking)

**Frontend additions (COMPLETED)**
- Added **Policy Brain** hero panel (center) that:
  - calls `/api/policy/recommend` per tick
  - renders horizontal Q-value bar chart for all 11 actions
  - highlights selected action
  - shows guardrail notes and constraints

---

### Phase 5 — RazorSense Full‑System Redesign (Coherence Pass) (COMPLETED)
**Goal:** Apply a calm, premium, trustworthy RazorSense design language across the entire experience—*not one isolated card*—while preserving full functionality, responsiveness, and accessibility.

**Key directives addressed (COMPLETED)**
- Removed tacky/disconnected fixed health bar (VitalTopBar).
- Replaced with an in-flow **ConsoleHeader** (brand + case IDs left; contextual status sentence + dot + “Updated <time> · T+xh” right).
- Treated the hero odds card as the *reference component* and propagated its:
  - spacing rhythm
  - typography hierarchy
  - depth/elevation
  - border language
  - restraint

**Unified design system (COMPLETED)**
- One radius scale:
  - 24px cards, 16px nested, 12px controls
- One glass recipe (baseline) + one signature gradient hairline reserved for:
  - hero odds card
  - Policy Brain
  - “AI’s next step” panel
  - floating dock
- Calm charts:
  - solid azure strokes (2px) and uniform markers
  - Q-bars: 6px height
  - recovery area fill: 0.10 opacity
- Pills/badges demoted to inline **dot + text**:
  - case status
  - SSE status
  - customer plane state
  - policy version/constraints
- Failure block made informative-not-alarming:
  - neutral inset panel + 2px destructive accent strip
- Accessibility:
  - global `:focus-visible` dual ring
  - readable font sizes; reduced-motion respected
- Removed decorative clutter:
  - removed HeroBeams
- Toast styling aligned with the system.

**Layout coherence (COMPLETED)**
- HERO row: Failure Anatomy (left) + Policy Brain (center)
- Next row: Recovery Window + AI next step + Trust Budget
- Proof row: Ghost runs + Customer plane
- Live updates panel
- Floating dock remains the single global instrument for time control.

**Testing + QA (COMPLETED)**
- Testing agent `iteration_2.json`:
  - Backend: **100% (20/20)**
  - Frontend: **95% (42/44)**
- Post-test fixes applied:
  - RecoveryWindow aria-label updated to “72-hour window”
  - Ghost run hover improved with `pointerEvents="stroke"` and thinner hit target
- Responsive verification:
  - 1920 desktop, 768 tablet, 390 mobile — no overflow; dock usable.

---

## 3) Next Actions (Immediate)
1. **Optional: Navigation + multi-case expansion**
   - If required for demo polish, add a lightweight left nav or case picker without changing the single-case core.
2. **Optional: Accessibility hardening**
   - Add explicit aria-describedby for key status sentences and ensure all interactive SVG scrub regions have clear keyboard alternatives.
3. **Optional: Demo choreography**
   - Add “jump to tick” shortcuts (Tick 1/4/7/9/10) that set `t` to key moments without altering scrubber contract.
4. **Optional: Performance audit**
   - Validate no expensive layout thrash; keep animations transform/opacity.

---

## 4) Success Criteria
- **No regressions:** one `timelineT` drives all visuals and actions in sync.
- **RL visibility:** Policy Brain shows Q-values for 11 actions; selected action and guardrails are obvious.
- **MDP legibility:** 72h episode, 6h ticks, ≤12 steps, trust budget 3 are explicit and consistent.
- **RazorSense coherence:** one premium design system across every component—calm, intentional, not templated.
- **Usability + accessibility:** readable typography, strong contrast, keyboard operable dock, reduced motion respected.
- **Still a hackathon demo:** stable, visually stunning, fully mocked with working SSE + policy endpoints.