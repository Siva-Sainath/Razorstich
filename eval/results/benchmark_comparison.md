# RazorStitch 10-seed shipped benchmark

_Simulated recovery — net economic value. See `eval/results/benchmark_*_stats.json`._

| Scenario | Policy | Net ₹/seed | vs rules | Seeds |
|---|---|---:|---:|---|
| checkout_failed | Dueling DDQN v2 | 516,614 | +61.2% | 10/10 |
| cart_abandon | Dueling DDQN v1 | 558,302 | +210.6% | 10/10 |
| subscription_failed | Dueling DDQN v1 | 453,353 | +72.6% | 10/10 |
| invoice_overdue | Dueling DDQN v2* | 497,263 | +127.4% | 10/10 |

\*invoice v2 held for inference parity; demo still replays those weights with a review badge.

Always-payment-link can beat DQN on **gross** recovery rate. The training objective is **net** INR (comms cost, friction, UPI duplicate penalty).
