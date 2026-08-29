# RazorStitch RL — Experiment Tracker

> **Workstream X** · Policy: Double DQN · Env: `RecoveryEnv` (72 h, 12 steps)

This directory tracks all planned and completed reinforcement-learning experiments for the RazorStitch payment-recovery agent.

---

## Quick links

| Document | Purpose |
|---|---|
| [RL_EXPERIMENTS.md](RL_EXPERIMENTS.md) | Full experiment specs (hypothesis → command → metric) |
| [../../eval/results/tables.md](../../eval/results/tables.md) | Latest benchmark table (DQN vs baselines) |
| [../../eval/results/training_curve.json](../../eval/results/training_curve.json) | Episode-level training curve |
| [../../eval/results/benchmark.json](../../eval/results/benchmark.json) | Raw benchmark JSON |
| [run_sweep.sh](run_sweep.sh) | Automated `friction_weight` sweep script |
| [../../packages/policy/bandit_stub.py](../../packages/policy/bandit_stub.py) | LinUCB contextual-bandit baseline (E6 stub) |

---

## Experiment status

| ID | Name | Status | Key result |
|---|---|---|---|
| E1 | `friction_weight` sweep | ⬜ Planned | — |
| E2 | `duplicate_penalty` sweep | ⬜ Planned | — |
| E3 | Episode budget (3 k / 5 k / 10 k) | ⬜ Planned | — |
| E4 | Double DQN vs vanilla (ablation) | ✅ Done — Double DQN ships | +36 k INR/seed vs `failure_rules` |
| E5 | Out-of-distribution eval | ⬜ Planned | — |
| E6 | LinUCB contextual-bandit baseline | ⬜ Optional | — |

> Update this table after each run. Fill **Key result** with `net_recovered_value_inr` delta vs the `failure_rules` baseline (see `tables.md`).

---

## Baseline reference (current best, seed-average)

From [`eval/results/tables.md`](../../eval/results/tables.md):

| Policy | Net recovered ₹ (sum/3 seeds) | Recovery rate | Duplicates |
|---|---:|---:|---:|
| always_payment_link | 3,122,242 | 88.60 % | 129 |
| exponential_backoff | 3,030,893 | 86.87 % | 162 |
| **dqn** (current) | **2,512,616** | **70.40 %** | **69** |
| failure_rules | 2,404,054 | 65.00 % | 57 |

---

## How to run experiments

```bash
# 1. Single train + eval
python -m packages.policy.train --train --eval --seed 42 --episodes 1500

# 2. Friction-weight sweep (E1)
bash docs/experiments/run_sweep.sh

# 3. Custom episodes (E3)
python -m packages.policy.train --train --eval --seed 42 --episodes 5000
```

> All scripts are **non-interactive** and write artefacts to `eval/`.

---

## Reward function (reference)

```
reward = amount_inr * recovered
       − comm_weight   × action_cost_inr
       − friction_weight × amount_inr × 0.01 × (contacts_used / contacts_max)
       − duplicate_penalty × amount_inr × 0.5  [if duplicate]
       − unsafe_penalty    × amount_inr × 0.02 [if invalid action]
```

Defaults: `comm_weight=1.0`, `friction_weight=0.5`, `duplicate_penalty=1.0`, `unsafe_penalty=2.0`.
Source: [`packages/policy/reward.py`](../../packages/policy/reward.py).
