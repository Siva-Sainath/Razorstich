# Workstream I — Judge Demo + Pitch

## Task
Create `docs/pitch/` with:

1. `DEMO_SCRIPT.md` — 3-minute judge demo, scene by scene:
   - Scene 1: payment fails (Test Mode card) → webhook
   - Scene 2: Operating Theater shows failure anatomy + DQN Q-values + selected action
   - Scene 3: execute recovery (payment link) → success card → captured
   - Scene 4: benchmark slide — net value vs failure_rules, duplicates vs aggressive baselines
   - Label simulator vs confirmed Test Mode metrics

2. `PITCH_60s.md` — one paragraph + 5 bullets for Hive NOVELTY track

3. `FAQ.md` — 8 judge Q&As (why DQN not rules, why not train on Razorpay API, reward hacking guardrails, etc.)

## Use committed results
Read `eval/results/tables.md` and `eval/results/training_curve.json` if present.

## Constraints
- RazorStitch = razor-sharp recovery policy + Trust Budget + audit trail
- Do not claim DQN beats always_payment_link on gross recovery — be honest, lead with net value vs failure_rules and safety
