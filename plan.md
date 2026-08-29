# plan.md — Midnight Operating Theater (React SPA + FastAPI)

## 1) Objectives
- **Functional goal (COMPLETED):** Deliver a fully working, cinematic single-case “Operating Theater” dashboard that makes an RL recovery loop legible and impressive.
- **Synchronization goal (COMPLETED):** Ensure one global `timelineT (0..1)` drives *all* visuals (playhead, recovery curve, ghost runs, policy strip, checkout assets, trust budget, ticker highlight).
- **Backend mocking goal (COMPLETED):** Provide a fully mocked but believable backend: `/api/case/current` narrative + `/api/events/stream` SSE ticker.
- **Brand Identity Elevation goal (COMPLETED):** Eliminate the “vibe coded” feel by adding a distinct, recognizable product identity (Cursor/Claude-like) with a committed surgical/OR-monitor theme, RazorSense-like pulse motion language, and subtle retro/CRT overlays — **without breaking functionality or any existing `data-testid`s**.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): “Timeline ↔ SSE ↔ Derived State” (COMPLETED)
**Goal:** Prove the hardest piece: synchronized timeline state + SSE event ingestion + derived state driving UI.

**User stories**
1. As a judge, I can press Play and watch the case progress through clear stages ending in “Recovered”.
2. As a judge, I can scrub the timeline and every panel updates in lockstep.
3. As a judge, I see new live events stream in (SSE) without freezing or duplicating.
4. As a judge, I can pause live auto-follow to inspect past events, then resume.
5. As a judge, I can snap the scrubber to key events (markers) to understand the narrative.

**Backend (FastAPI) POC**
- Implemented `GET /api/case/current` returning a single mock case payload (case metadata, events, recovery curve, ghost runs, policy snapshots, interventions, trust ledger, etc.).
- Implemented `GET /api/events/stream` SSE (text/event-stream), streaming ambient ops events.

**Frontend POC**
- Implemented `TimelineProvider` (context) with:
  - `t`, `playing`, `activeEventIndex`, `mode (LIVE|REVIEW)`
  - rAF play loop and derived selectors (stage, recoveryProb, trustRemaining, intervention, policy)
- Implemented a working scrubber + play/pause + SSE ticker integration.

**POC acceptance**
- Achieved: timeline scrub updates derived values; SSE connects; app remains responsive.

---

### Phase 2 — V1 App Development (MVP Theater Screen) (COMPLETED)
**Goal:** Build the full cinematic single-screen dashboard and wire *every panel* to `timelineT`.

**User stories**
1. As a judge, I instantly understand the case (amount, merchant, decline reason, live status) from the header.
2. As a judge, I can see the recovery probability curve and move the playhead to inspect any moment.
3. As a judge, I can compare the chosen path vs ghost runs to understand “what could’ve happened”.
4. As a judge, I can see the RL policy’s candidate actions with Q-values and why the chosen action changes over time.
5. As a judge, I can watch the customer checkout “morph” as the agent changes assets (nudge → incentive → capture).

**Frontend foundation**
- Applied design tokens + fonts in `index.css` (ink canvas, glass panels, cyan/green/amber accents).
- Built `src/components/theater/` panel set + grid layout.

**Data wiring**
- Fetch `/api/case/current` once on load with offline fallback.
- Connect SSE `/api/events/stream` for LiveEventTicker.

**Panels delivered (all driven by provider selectors)**
- CaseHeader
- FailureAnatomy
- RecoveryWindow (custom SVG + draggable playhead)
- CounterfactualGhostRuns (custom SVG)
- CustomerPlane (mock checkout morph)
- InterventionComposer
- TrustBudget (SVG gauge)
- PolicyBrainStrip
- LiveEventTicker (SSE)
- AuditTrailScrubber (global slider + markers + controls)

**Motion pass (framer-motion)**
- Staggered first-load reveal for panels.
- Micro-animations for live status and list insertions.

**Phase 2 checkpoint: Testing agent**
- **COMPLETED:** testing agent passed **29/29** (100%), no functional issues.

---

### Phase 3 — Brand Identity Elevation (Surgical Productization) (COMPLETED)
**Goal:** Upgrade from “cool demo dashboard” to a **distinct product identity**: OR-monitor vibe + RazorSense-style pulse responsiveness, *while preserving the working MVP*.

**User stories**
1. As a judge, I recognize the product instantly from its visual signature (wordmark + ECG/vitals + instrument labels).
2. As a judge, the UI feels “manufactured” and deliberate (like Cursor/Claude), not generic.
3. As a judge, the “operating theater” metaphor is consistent across chrome, motion, typography, and overlays.
4. As an operator, readability remains high (projector-friendly) despite cinematic/retro layers.
5. As a developer, I can add brand layers **without touching business logic** or existing `data-testid`s.

**Brand layer components (COMPLETED)**
- Implemented `src/components/brand/`:
  - `LogoMark.jsx`: notched monitor frame + ECG spike (SVG, stroke-only) with draw-in animation.
  - `Wordmark.jsx`: MIDNIGHT / Operating Theater lockup with ECG baseline.
  - `ECGTrace.jsx`: signature live ECG device — amplitude/color/heart-rate driven by `recoveryProb`, transform-only tiled scroll.
  - `VitalTopBar.jsx`: fixed OR-monitor rail (brand + ECG + vitals chips: P·Recover, Trust, Elapsed, Clock, CRITICAL↔STABLE).
  - `SterilizeIntro.jsx`: 2.1s boot/sterilization overlay, auto-skipped under `prefers-reduced-motion`.

**Global identity overlays (COMPLETED)**
- CRT scanlines overlay (very subtle; pointer-events-none).
- Phosphor sweep overlay (very subtle; disabled under reduced motion).
- Giant watermark typography (“RESUSCITATION”, “PROTOCOL 7F3A”) as a background layer.

**Panel chrome upgrades (COMPLETED; all testids preserved)**
- Upgraded `Panel.jsx` to include:
  - `INSTRUMENT 01–08` indexing.
  - Left tick ruler device (`panel-ruler`).
  - Refined header spacing (instrument-grade labeling).
- Passed indices into all panels (FailureAnatomy→InterventionComposer).

**Motion identity upgrades (COMPLETED)**
- Added monitor-style pulse indicators (top bar status dot, ECG trace).
- Kept animation constraints: transform/opacity only (ECG uses transform-based scroll + stroke glow).

**Phase 3 checkpoint: Visual QA + Regression (COMPLETED)**
- Verified via screenshots:
  - Boot intro overlay.
  - Playing state with amber ECG and CRITICAL state.
  - End state (RECOVERED/CAPTURED) with emerald ECG and STABLE.
- Verified regression manually:
  - Autoplay starts.
  - Scrubber drives all panels.
  - SSE connects and streams.
  - Keyboard slider works.
  - Toasts still show.
  - No console errors.
- Verified build: esbuild clean.

---

## 3) Next Actions (Immediate)
1. **Polish (optional):** fine-tune overlay opacity for projector environments (scanlines/watermark), ensure text contrast stays high.
2. **Demo choreography (optional):** add one-click “jump to key moments” shortcuts for judges (without altering the existing timeline/scrubber contract).
3. **Packaging (optional):** add a short README section describing how to demo (play, scrub, highlight policy changes) and a 30–60s scripted walkthrough.

---

## 4) Success Criteria
- **No regressions:** timeline scrub/play updates *every* panel consistently from a single `timelineT`.
- **Brand recognition:** VitalTopBar + wordmark + LogoMark + ECG trace + instrument indexing makes it instantly recognizable as “M.O.T.”.
- **Surgical coherence:** OR-monitor devices (vitals rail, rulers, crosshair-ready charts, trace) feel consistent and intentional.
- **RazorSense-like motion:** pulse/responsiveness is present but restrained (no jank).
- **Performance + accessibility:** overlays are subtle, reduced-motion respected, and text remains readable on projector.
- **Still a hackathon demo:** stable, wow-factor, and fully mocked with SSE ticker intact.
