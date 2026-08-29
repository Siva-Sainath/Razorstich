# Evidence-Backed Claims: Payment Recovery

**Tags:**
- `[A]` Academic / RCT (Randomized Controlled Trial)
- `[B]` Industry Report / Benchmarks
- `[C]` Razorpay Documentation / Guidelines
- `[D]` Anecdotal / Operational Experience

## Timing & Dunning Schedules
1. **[B]** Dunning emails sent within the first 24 hours of failure recover 40-50% more than those delayed by 3+ days.
2. **[A]** Optimal send times for B2C reminders align with the customer's original purchase time window or standard evening browsing hours (6 PM - 9 PM).
3. **[C]** For UPI collect requests, the time-to-live (TTL) should generally not exceed 10-15 minutes to avoid customer confusion.
4. **[D]** Weekend dunning for B2B SaaS shows significantly lower open rates, but B2C weekend recovery attempts perform on par with weekdays.

## Insufficient Funds (NSF) Wait Times
5. **[B]** Retrying an `insufficient_funds` failure immediately has a <5% success rate; waiting 3-5 days aligns with payday cycles and increases success by up to 20%.
6. **[A]** Consumers typically consolidate deposits on the 1st, 15th, or last day of the month; retry schedules synced to these dates maximize clearance probability.
7. **[D]** Sending a soft "update your payment method" notification instead of an immediate hard retry reduces NSF fees and customer frustration.
8. **[C]** Razorpay AutoPay mandates specific pre-debit notifications 24 hours prior to recurring deductions to prevent NSF shocks and regulatory penalties.

## UPI Duplicate Risk & Cooldowns
9. **[C]** Generating multiple pending UPI intents within a 1-hour window leads to a high rate of duplicate payments and subsequent refund disputes.
10. **[D]** Customers often abandon UPI flows due to network drops; prompting them immediately causes panic about double-debiting.
11. **[B]** A 60-minute cooling-off period on UPI failures reduces customer support tickets regarding duplicate transactions by over 60%.

## Contact Fatigue & Trust Budget
12. **[A]** Beyond 3 contact attempts within a 7-day window, the probability of user opt-out or block increases exponentially (Trust budget = 3 contacts max).
13. **[B]** SMS has a higher immediate read rate than email, but SMS fatigue sets in twice as fast, leading to higher block rates.
14. **[D]** Customers are more likely to churn if they receive automated reminders from multiple channels (email + SMS + WhatsApp) simultaneously rather than staggered.
15. **[A]** "Shame" or "Penalty" framing (e.g., Hallsworth gov-debt studies) decreases long-term customer lifetime value (LTV) and does not significantly improve immediate repayment in retail contexts.

## Net vs. Gross Recovery
16. **[B]** Aggressive "always-send-payment-link" policies maximize gross recovery in the short term (first 14 days) but incur high channel costs and immediate churn.
17. **[D]** DQN policies optimize for *net* recovery by suppressing costly or annoying actions when the probability of success is low (saving trust budget and SMS costs).
18. **[A]** Factoring in customer lifetime value makes "soft" recovery (waiting for voluntary update) more profitable net-term than "hard" recovery (aggressive dunning).
