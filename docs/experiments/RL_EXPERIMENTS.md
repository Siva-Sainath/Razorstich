# RazorStitch RL — Experiment Specifications

> All experiments use `python -m packages.policy.train` (non-interactive).  
> Default seed: `42`. Checkpoint written to `eval/checkpoints/`.  
> Baseline comparison: `failure_rules` policy (net ₹2,404,054 over 3 seeds × 500 eps).

---

## E1 — `friction_weight` sweep

**Hypothesis:**  
The current default `friction_weight=0.5` may under-penalise customer fatigue.  
Increasing it toward `1.5` should push the agent toward fewer but higher-value touchpoints,
improving `net_recovered_value_inr` while keeping `duplicate_incidents` low.

**Variables:**  
`friction_weight ∈ {0.5, 1.0, 1.5}` — passed at env construction time via `RewardCalculator`.

**Command (per value):**
```bash
# friction_weight must be threaded in via a RewardCalculator override.
# Recommended: extend train.py with --friction_weight flag, or use run_sweep.sh.
bash docs/experiments/run_sweep.sh
```

**Success metric:**  
`net_recovered_value_inr` (sum over 3 seeds × 500 eval eps) ≥ current DQN value of ₹2,512,616.  
Secondary: `duplicate_incidents` ≤ 69 (current DQN).

**Artefacts:**  
`eval/results/sweep_friction_<value>_seed<seed>.json` (written by `run_sweep.sh`).

---

## E2 — `duplicate_penalty` sweep

**Hypothesis:**  
The current `duplicate_penalty=1.0` means a duplicate wipes out ~50 % of case value.  
Doubling it to `2.0` should make the policy more conservative on aggressive retry actions
(`RETRY_CHECKOUT`, `CREATE_PAYMENT_LINK`), reducing duplicates at the cost of recovery rate.

**Variables:**  
`duplicate_penalty ∈ {0.5, 1.0, 2.0}` in `RewardCalculator`.

**Command (per value — extend train.py or inline):**
```bash
# Example: run one configuration manually
python - << 'EOF'
from pathlib import Path
from packages.policy.dqn import DQNConfig, DQNAgent, get_device
from packages.simulator.env import RecoveryEnv
from packages.policy.reward import RewardCalculator
import numpy as np, json

PENALTY = 2.0   # <-- change this value
SEED    = 42
EPISODES = 1500

# Monkey-patch the env to use a custom RewardCalculator
orig_compute = RecoveryEnv._compute_step_reward
def patched_compute(self, action, invalid):
    from packages.policy.reward import RewardCalculator
    assert self.state is not None
    calc = RewardCalculator(duplicate_penalty=PENALTY)
    return calc.step_reward(
        action=action, amount_inr=self.state.amount_inr,
        contacts_used=self.state.contacts_used,
        contacts_max=self.state.contacts_max,
        invalid_action=invalid, duplicate=self.state.duplicate_incident,
        recovered=False, comm_cost=self.state.total_comm_cost,
    )
RecoveryEnv._compute_step_reward = patched_compute

from packages.policy.train import train_dqn, run_benchmark
train_dqn(seed=SEED, episodes=EPISODES,
          out_dir=Path(f"eval/checkpoints/dup_pen_{PENALTY}"))
EOF
```

**Success metric:**  
`duplicate_incidents` (sum over 3 seeds) ≤ 50 without `net_recovered_value_inr` dropping below ₹2,300,000.

**Artefacts:**  
`eval/checkpoints/dup_pen_<value>/dqn_best.pt`

---

## E3 — Episode budget: 3 000 vs 5 000 vs 10 000

**Hypothesis:**  
The default 1 500-episode budget underfits: the val curve still improves at episode 1 400.  
Extending to 5 000 or 10 000 episodes should yield measurably higher `val_net_recovered_value_inr`
at convergence without catastrophic forgetting (ε decays to 0.05 by step 5 000).

**Variables:**  
`--episodes ∈ {3000, 5000, 10000}`

**Command:**
```bash
for EPS in 3000 5000 10000; do
  python -m packages.policy.train \
    --train --eval \
    --seed 42 \
    --episodes "$EPS"
  # rename artefacts to avoid clobbering
  cp eval/results/training_curve.json "eval/results/curve_eps${EPS}.json"
  cp eval/results/benchmark.json       "eval/results/benchmark_eps${EPS}.json"
done
```

**Success metric:**  
`val_net_recovered_value_inr` at final checkpoint ≥ 1.05 × value at episode 1 500.  
Wall-clock time per run noted (MPS / CUDA / CPU).

**Artefacts:**  
`eval/results/curve_eps<N>.json`, `eval/results/benchmark_eps<N>.json`

---

## E4 — Double DQN vs vanilla DQN (ablation)

> **Status: ✅ DONE — Double DQN is the current production algorithm.**

**Decision recorded here for audit purposes.**

**What was compared:**

| Variant | Update rule |
|---|---|
| Vanilla DQN | `target = r + γ · max_a Q_target(s', a)` |
| **Double DQN** (ships) | `target = r + γ · Q_target(s', argmax_a Q_online(s', a))` |

Double DQN is implemented in [`packages/policy/dqn.py L96–L107`](../../packages/policy/dqn.py):

```python
# Double DQN: choose the next action with the online network,
# then evaluate that action with the target network.
online_next_q = self.policy(ns_t).masked_fill(~nmask_t, -torch.inf)
next_actions   = online_next_q.argmax(dim=1, keepdim=True)
target_next_q  = self.target(ns_t).gather(1, next_actions).squeeze(1)
```

**Observed benefit:**  
Double DQN reduced Q-value overestimation on the `train` split; `val_net_recovered_value_inr`
was higher by approximately 4–8 % in informal runs during development.

**If you need to reproduce vanilla DQN** (for a fresh ablation paper), replace the block above with:
```python
# Vanilla DQN
max_next_t = self.target(ns_t).masked_fill(~nmask_t, -torch.inf).max(dim=1).values
max_next_t = torch.where(nmask_t.any(dim=1), max_next_t, torch.zeros_like(max_next_t))
```

**Command (vanilla ablation):**
```bash
# Patch dqn.py manually (or use a feature flag), then:
python -m packages.policy.train --train --eval --seed 42 --episodes 1500
```

---

## E5 — OOD evaluation: `shift` / `bank_outage` / `adversarial`

**Hypothesis:**  
A policy trained on `train` may overfit to the training failure-reason distribution.  
Evaluating on `shift`, `bank_outage`, and `adversarial` env splits reveals generalisation gaps.

**Environment splits registered in `ENV_REGISTRY`** ([`packages/simulator/env.py L148–L155`](../../packages/simulator/env.py)):

| env_name | Expected distribution shift |
|---|---|
| `train` | Balanced across all 6 failure reasons |
| `val` | Same distribution, different seeds |
| `test` | Same distribution, held-out seeds |
| `shift` | Heavy `insufficient_funds` & `authentication_failed` weighting |
| `bank_outage` | Near-exclusively `bank_outage` failures |
| `adversarial` | Worst-case sequences (high duplicate risk, low p_success) |

**Command:**
```bash
# Load best checkpoint and evaluate across all OOD splits
python - << 'EOF'
from pathlib import Path
from packages.policy.baselines import evaluate_policy
from packages.policy.dqn import DQNAgent
import json

CKPT = Path("eval/checkpoints/dqn_best.pt")
agent = DQNAgent.load(CKPT)
agent.name = "dqn"

results = {}
for env_name in ("train", "val", "test", "shift", "bank_outage", "adversarial"):
    r = evaluate_policy(agent, env_name, 500, seed=42)
    results[env_name] = r
    print(f"{env_name:15s}  recovery={r['recovery_rate']:.2%}  "
          f"net={r['net_recovered_value_inr']:,.0f}  dups={r['duplicate_incidents']}")

Path("eval/results/ood_eval.json").write_text(json.dumps(results, indent=2))
EOF
```

**Success metric:**  
`recovery_rate` on `shift` and `bank_outage` ≥ 60 % (vs `failure_rules` ~65 % on `train`).  
`duplicate_incidents` on `adversarial` ≤ 2 × the `test` value.

**Artefacts:**  
`eval/results/ood_eval.json`

---

## E6 — Contextual bandit baseline: LinUCB (optional)

**Hypothesis:**  
A contextual bandit (no temporal credit assignment) is a strong lower-bound on what pure
arm-selection can achieve. If LinUCB approaches DQN performance, the MDP temporal structure
adds little signal and we should simplify the deployed model.

**Algorithm:** LinUCB (Disjoint) — linear upper-confidence bound per action.  
Features: `obs` vector (dim = `OBS_DIM = 17`) after whitening.

**Stub location:** [`packages/policy/bandit_stub.py`](../../packages/policy/bandit_stub.py)

**Command:**
```bash
python - << 'EOF'
from packages.policy.bandit_stub import LinUCBPolicy
from packages.policy.baselines import evaluate_policy

policy = LinUCBPolicy(alpha=1.0)
r = evaluate_policy(policy, "test", 500, seed=42)
print(f"LinUCB  recovery={r['recovery_rate']:.2%}  "
      f"net={r['net_recovered_value_inr']:,.0f}  dups={r['duplicate_incidents']}")
EOF
```

**Success metric:**  
`net_recovered_value_inr` on `test` (500 eps, seed 42) compared to `failure_rules` and `dqn`.  
If LinUCB ≥ 90 % of DQN performance → revisit model complexity.

**Artefacts:**  
Console output (no checkpoint needed — bandit weights are in-memory).
