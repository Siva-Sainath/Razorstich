# RazorStitch — RL training guide

## Where to train?

| Environment | Recommendation | Why |
|---|---|---|
| **MacBook Air M3 (local)** | **Primary for 16h demo** | DQN is a small MLP (~50k params). 1500 episodes × 12 steps trains in **~3–8 minutes** on CPU/MPS. |
| **Google Colab (optional)** | Longer runs, multiple seeds in parallel | Only if you want 10k+ episodes or hyperparameter sweeps. Not required. |

### MacBook setup

```bash
cd /Users/siva/Documents/Recovery_agent
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

PyTorch will use **MPS** (Apple GPU) when available:

```python
from packages.policy.dqn import get_device
print(get_device())  # mps on M3
```

### Notebooks

| Notebook | Purpose |
|---|---|
| [`notebooks/01_train_dqn.ipynb`](../notebooks/01_train_dqn.ipynb) | Train DQN, save checkpoint |
| [`notebooks/02_eval_benchmark.ipynb`](../notebooks/02_eval_benchmark.ipynb) | Compare baselines vs DQN, export rules for Vercel |

### CLI (same logic as notebooks)

```bash
# Train
python -m packages.policy.train --train --seed 42 --episodes 1500

# Evaluate
python -m packages.policy.train --eval --seed 42

# Export JSON rules for Next.js (no torch on Vercel)
python -m packages.policy.export_rules eval/checkpoints/dqn_train_seed42.pt eval/checkpoints/policy_rules.json
```

## RL setup summary

| Component | Choice |
|---|---|
| Algorithm | **DQN** (deep Q-network, 3×128 MLP) |
| Why not full PPO/A3C? | Recovery is episodic (~12 steps); DQN is lighter and trains fast on laptop |
| State | 37-dim vector (amount, time, failure reason, contacts, …) |
| Actions | 11 masked recovery actions |
| Reward | Net value: collected − comm cost − friction − duplicate penalty |
| Environment | `packages/simulator/env.py` — hidden customer model |
| Baselines | noop, wait, immediate retry, backoff, failure-rules, always link |

## Artifacts

| File | Use |
|---|---|
| `eval/checkpoints/dqn_train_seed42.pt` | Python reload, notebooks |
| `eval/checkpoints/policy_rules.json` | **Vercel API** — reason → action + Q-values |
| `eval/checkpoints/policy_manifest.json` | Version metadata |
| `eval/results/benchmark.json` | Judge-facing metrics |
| `eval/results/tables.md` | Human-readable benchmark |

## Colab (optional)

1. Upload repo zip or clone from GitHub
2. `pip install -e .`
3. Open `notebooks/01_train_dqn.ipynb`
4. Download `eval/checkpoints/*.pt` and `policy_rules.json` to local repo

No GPU required; T4 only speeds marginally for this network size.
