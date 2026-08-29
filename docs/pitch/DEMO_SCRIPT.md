# RazorStitch: 4-Wedge Judge Demo Script (4 Minutes)

## Scene 1: Four recovery lanes (0:00 - 0:45)
**Visual:** Operating Theater with wedge tabs
**Action:**
- Switch across **Failed checkout**, **Abandoned cart**, **Subscription failed**, **Overdue invoice**
- Click **Seed demo case** on each lane to create a live/simulated Razorpay entity
**Narration:** "RazorStitch is not one static retry rule. It is a recovery orchestration platform with separate Dueling Double DQN policies for each revenue-loss pattern."

## Scene 2: Policy Brain (0:45 - 2:00)
**Visual:** Center panel — V(s), Q-value bars, blocked actions
**Action:**
- On **Failed checkout / UPI timeout at t=0**, show `wait` or blocked retry/link guardrails
- Advance episode +6h on insufficient-funds case; show policy shift toward notify/payment link
- On **Subscription failed**, highlight `request_method_update` advantage for card-expired cases
- On **Invoice overdue**, show `offer_partial` rising in rank after +24h
**Narration:** "Each wedge has its own simulator-trained policy. The UI never overrides the math — it explains V(s), A(s,a), and masked Q-values in real time."

## Scene 3: Execute recovery (2:00 - 3:00)
**Visual:** Execute panel + Razorpay Test Mode dashboard
**Action:**
- Execute recommended action on **checkout_failed** (payment link) and **cart_abandon** (payment link)
- Show webhook audit trail updating case status
**Narration:** "The RL agent chooses timing and channel. Execution adapters call Razorpay APIs. The LLM copilot only narrates — it never changes the action."

## Scene 4: Benchmark proof (3:00 - 4:00)
**Visual:** `eval/results/benchmark_<wedge>.json` summary slide
**Action:**
- Show net recovered INR per wedge: Dueling vs failure_rules
- Call out lower duplicate / trust spend on checkout lane vs aggressive baselines
**Narration:** "We train offline in simulators, prove online in Test Mode, and optimize for net recovered value — not vanity gross recovery."
