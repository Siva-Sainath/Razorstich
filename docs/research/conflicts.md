# Conflicts & Resolutions

Sources often disagree on the best payment recovery tactics. Below are documented conflicts between industry norms, research, and anecdotal data, along with the resolution rules adopted by our RazorStitch simulator and DQN policy.

### Conflict 1: Immediate Retries vs. Cooling Off
- **Source 1 [B]**: Stripe/industry defaults often retry immediately for soft declines to catch temporary gateway blips.
- **Source 2 [D]**: Retrying immediately triggers fraud alarms on Indian issuer banks, permanently blocking the card.
- **Resolution Rule**: In our simulator, immediate unprompted retries are heavily penalized on failure. We enforce a minimum wait time before an automated backend retry, preferring user-prompted action for non-transient errors.

### Conflict 2: Channel Blasting vs. Staggering
- **Source 1 [B]**: "Omnichannel" platforms claim simultaneous Email + SMS + WhatsApp yields the fastest time-to-recovery.
- **Source 2 [A]**: Academic studies on trust budgets show simultaneous blasts trigger spam filters and user panic/blocks.
- **Resolution Rule**: The simulator imposes a strict "Trust Budget" of 3 contacts total per episode, and penalizes concurrent multi-channel dispatches in the same timestep. 

### Conflict 3: Tone of Dunning Messaging
- **Source 1 [A]**: Hallsworth gov-debt studies suggest stern, obligation-focused messaging ("You owe us") works best for compliance.
- **Source 2 [D]**: E-commerce and subscription customers churn permanently when shamed or threatened over failed payments.
- **Resolution Rule**: We strictly exclude shame/commission framing. All simulated customer states respond optimally to neutral, helpful "update payment method" actions. Stern messaging incurs a negative reward (simulated churn).

### Conflict 4: Handling 'Insufficient Funds'
- **Source 1 [B]**: Standard recurring billing tools retry NSF daily.
- **Source 2 [C]**: Razorpay guidelines suggest waiting for the customer to top up, as repeated failures can incur bank penalties for the customer.
- **Resolution Rule**: The simulator encodes a hard constraint: `insufficient_funds` triggers a mandatory multi-day wait or a soft nudge (no active debit attempt) until a high-probability payday or user top-up signal.

### Conflict 5: UPI Intent Abandonment
- **Source 1 [B]**: Standard cart abandonment logic says to send a link within 15 minutes of drop-off.
- **Source 2 [C]**: UPI architecture risks duplicate debits if a second intent is triggered while the first is pending in the NPCI switch.
- **Resolution Rule**: Simulator encodes a strict 1-hour UPI mask. Any action attempting to send a new UPI link within 1 hour of a UPI-related failure yields zero probability of success and a negative reward.

### Conflict 6: Maximizing Gross vs. Net Recovery
- **Source 1 [B]**: Sales and growth teams often prioritize gross recovery (total cash collected).
- **Source 2 [A/D]**: Net recovery (Cash Recovered - Contact Costs - Expected Churn Loss) is the true business metric.
- **Resolution Rule**: The DQN agent is rewarded purely on Net Value. "Always send payment link" policies are explicitly shown to fail against this metric due to channel costs and depleted trust budgets, even if they match gross recovery.
