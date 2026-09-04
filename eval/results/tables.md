# RazorStitch simulated recovery benchmark (shipped)

_Metric: mean net recovered INR vs FailureRulesPolicy. Protocol: 10 seeds (42–51) × 200 episodes. Simulator — not live merchant uplift._

Weights in `packages/policy/weights/` match these rows. cart and subscription were rolled back to v1 after v2 regression.

| Scenario | Shipped | Mean net ₹/seed | Failure-rules ₹/seed | Lift | Seeds beaten |
|---|---|---:|---:|---:|---|
| checkout_failed | v2 | 516,614 | 320,532 | +61.2% | 10/10 |
| cart_abandon | v1 | 558,302 | 179,763 | +210.6% | 10/10 |
| subscription_failed | v1 | 453,353 | 262,697 | +72.6% | 10/10 |
| invoice_overdue | v2 (parity review) | 497,263 | 218,627 | +127.4% | 10/10 |

Checkout 95% CI: policy ₹515,369–517,939 · rules ₹319,363–321,456 (non-overlapping).

HPO: 6 trials × 1,500 episodes × 4 wedges = 24 mini-runs before the 20k v2 train.
