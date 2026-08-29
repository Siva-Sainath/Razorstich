# Workstream B — Recovery Research Pack

You are working in RazorStitch (adaptive payment recovery, Double DQN in simulator).

## Task
Create these files under `docs/research/`:

1. `README.md` — index of research artifacts
2. `claims.md` — 15–20 evidence-backed claims about payment recovery (dunning timing, insufficient funds wait, UPI duplicate risk, contact fatigue, net vs gross recovery). Tag each: `[A]` academic/RCT, `[B]` industry, `[C]` Razorpay docs, `[D]` anecdotal
3. `conflicts.md` — 5–8 conflicts where sources disagree; resolution rule for our simulator/policy
4. `recovery-playbook.md` — per failure_reason default timing and actions (feeds judge narrative)

## Context already in repo
- `docs/RL_ARCHITECTURE.md`, `docs/CHALLENGES_AND_SOLUTIONS.md`
- Simulator encodes: insufficient_funds wait, UPI 1h mask, trust budget 3 contacts
- DQN beats failure_rules on net value (+36k INR/seed in eval) but not always_payment_link on gross

## Constraints
- Honest labels: simulator ≠ live merchant uplift
- No shame/commission framing for customers (Hallsworth gov-debt does not transfer)
- Write markdown only; do not change Python code
