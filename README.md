# RazorStitch

Adaptive payment recovery for Razorpay — simulator-trained DQN policy + Test Mode webhooks.

## Quick start (RL on MacBook)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
python -m packages.policy.train --train --eval --seed 42
```

Or open [`notebooks/01_train_dqn.ipynb`](notebooks/01_train_dqn.ipynb) then [`notebooks/02_eval_benchmark.ipynb`](notebooks/02_eval_benchmark.ipynb).

See [`docs/TRAINING.md`](docs/TRAINING.md) for Mac vs Colab guidance.

## Layout

```
packages/simulator/   # Recovery MDP + hidden customer model
packages/policy/      # DQN, baselines, train CLI, export_rules
notebooks/            # Training + eval + export
apps/web/             # Next.js API (webhooks, policy recommend)
supabase/migrations/  # Postgres schema
contracts/            # JSON schemas for events & policy decisions
eval/                 # checkpoints + benchmark results (gitignored)
```

## Export for Vercel

```bash
python -m packages.policy.export_rules eval/checkpoints/dqn_train_seed42.pt eval/checkpoints/policy_rules.json
```
