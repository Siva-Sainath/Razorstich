# RazorStitch: Judge Demo Script (3 Minutes)

## Scene 1: The Incident (0:00 - 0:45)
**Visual:** Razorpay Test Mode Dashboard & RazorStitch Monitor
**Action:** 
- We trigger a simulated payment failure using a Razorpay Test Mode card (e.g., insufficient funds).
- The webhook instantly fires to the RazorStitch backend.
**Narration:** "Here’s a live payment failure in Razorpay Test Mode. In a traditional setup, this would either be lost revenue or it would trigger a blind, aggressive retry loop. Watch how RazorStitch intercepts this via webhook."

## Scene 2: The Operating Theater (0:45 - 1:30)
**Visual:** RazorStitch Dashboard (The "Operating Theater")
**Action:**
- Show the incident payload being parsed.
- Display the anatomy of the failure (error code, bank, time of day).
- Highlight the DQN Agent's live Q-value predictions for different actions (`noop`, `wait`, `immediate_retry`, `payment_link`).
- Show the agent selecting `payment_link` based on the highest Q-value.
**Narration:** "Instead of static rules, our Deep Q-Network analyzes the anatomy of the failure. You can see the Q-values calculated in real-time. The agent balances the probability of recovery against the cost of customer friction (Trust Budget). Here, it selects sending a targeted payment link."

## Scene 3: The Recovery (1:30 - 2:15)
**Visual:** Customer Email/SMS & Razorpay Success Dashboard
**Action:**
- Execute the recovery action: the payment link is generated and sent.
- We simulate the customer clicking and completing the payment using a success test card.
- The webhook confirms the payment is `captured`, updating the RazorStitch audit trail.
**Narration:** "The action is executed. The customer receives a seamless payment link and completes the transaction. RazorStitch registers the success, creating a complete audit trail for compliance and updating the agent's reward for future learning."

## Scene 4: The Benchmark (2:15 - 3:00)
**Visual:** Benchmark Slide (Simulated Recovery Benchmark - Not Test Mode)
**Action:**
- Display a clear chart comparing our DQN policy against baselines (`failure_rules`, `always_payment_link`, `immediate_retry`).
- Emphasize Net Recovered Value vs `failure_rules`.
- Show Duplicate incidents (customer friction) compared to aggressive baselines.
**Narration:** "Let's look at the data from our simulated environment. While a naive 'always send payment link' approach yields high gross recovery, it destroys user trust, causing 129 duplicate incidents in our evaluation. RazorStitch’s DQN generates an incremental net value of 36,187 INR per seed over standard failure rules, while halving duplicate incidents compared to aggressive baselines. It’s a razor-sharp recovery policy that protects your Trust Budget."
