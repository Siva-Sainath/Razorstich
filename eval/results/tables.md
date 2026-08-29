# RazorStitch simulated recovery benchmark

_simulated recovered value — not Test Mode_

| Policy | Net recovered ₹ (sum/seeds) | Gross recovered ₹ | Recovery rate | Duplicates |
|---|---:|---:|---:|---:|
| always_payment_link | 3,122,242 | 3,305,636 | 88.60% | 129 |
| exponential_backoff | 3,030,893 | 3,248,266 | 86.87% | 162 |
| immediate_retry | 2,871,234 | 3,071,478 | 80.20% | 155 |
| dqn | 2,512,616 | 2,603,295 | 70.40% | 69 |
| failure_rules | 2,404,054 | 2,480,123 | 65.00% | 57 |
| noop | 1,945,944 | 1,945,944 | 50.93% | 0 |
| wait | 1,945,944 | 1,945,944 | 50.93% | 0 |

**Incremental net value vs failure_rules:** 36,187 INR/seed
