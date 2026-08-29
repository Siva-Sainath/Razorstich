# Workstream X — RL Experiments Backlog

## Task
Create `docs/experiments/`:

1. `README.md` — experiment tracker for RazorStitch RL
2. `RL_EXPERIMENTS.md` — 6 concrete experiments with hypothesis, command, success metric:
   - E1: reward friction_weight sweep {0.5, 1.0, 1.5}
   - E2: duplicate_penalty sweep {0.5, 1.0, 2.0}
   - E3: episodes 3000 vs 5000 vs 10000
   - E4: Double DQN vs vanilla (ablation note — we use Double DQN now)
   - E5: eval on shift/bank_outage/adversarial envs
   - E6: contextual bandit baseline (LinUCB sketch — optional code stub in `packages/policy/bandit_stub.py`)

3. `run_sweep.sh` — bash script that runs train+eval for friction_weight values (calls `python -m packages.policy.train`)

Read existing: `packages/policy/train.py`, `packages/policy/dqn.py`, `eval/results/tables.md`.

## Constraints
- Scripts must be non-interactive
- Do not break existing train CLI flags
- bandit_stub.py can be minimal (<80 lines) if included
