# Challenges Faced & How We Solved Them

Living document for RazorStitch buildathon — update as we hit new issues.

---

## 1. Train on Razorpay API vs simulator?

**Challenge:** Judges may expect "RL on Razorpay." Running thousands of RL episodes against real checkout is slow, non-reproducible, and hits rate limits.

**Solution:** Two-track architecture:
- **Simulator MDP** (`RecoveryEnv`) for fast offline DQN training
- **Razorpay Test Mode** for confirmed recovery proof via webhooks
- Honest dual labels: `simulated recovered value` vs `confirmed Test Mode recovered value`

---

## 2. No ground-truth customer response data

**Challenge:** We don't have merchant datasets for "if we email at hour 6, P(pay) = ?"

**Solution:** Hidden `CustomerResponseModel` with research-informed priors:
- Insufficient funds: low early notify success, rising spontaneous recovery after 24h
- UPI: duplicate risk window in first hour
- Contact fatigue decay on repeated nudges

Policy sees observations only; dynamics are hidden (standard RL sim-to-real).

---

## 3. Reward hacking — optimize gross recovery

**Challenge:** Agent could spam payment links or retries to maximize recovery count while harming customers and causing duplicates.

**Solution:** Net-value reward + structural guardrails:
- `RewardCalculator`: subtract comm cost, friction, duplicate penalty (−50% amount)
- `action_mask()`: block UPI retry/link in first hour; block contacts when Trust Budget exhausted
- Inference layer (`policy.ts`) re-enforces constraints after DQN export

---

## 4. Reward hacking — exploit invalid actions

**Challenge:** Agent might learn to pick actions that should be forbidden.

**Solution:** Invalid actions forced to `wait` with `unsafe_penalty`; masked Q-values set to −∞ during DQN `select_action`.

---

## 5. PyTorch on Vercel

**Challenge:** Serverless can't run DQN inference with torch.

**Solution:** Export `policy_rules.json` after training — reason → action + Q-values. Node.js loads JSON; no GPU needed in production.

---

## 6. Razorpay error codes ≠ our taxonomy

**Challenge:** Razorpay returns varied `error_code` / `error_description` strings.

**Solution:** `packages/razorpay/taxonomy.py` maps to 6 canonical `failure_reason` values shared by simulator and API.

---

## 7. DQN underperforms naive "always payment link" on gross rate

**Challenge:** Smoke training (300 episodes) showed `always_payment_link` beating DQN on gross recovery rate.

**Solution:** Expected early in under-trained runs — link spam recovers more gross but causes more duplicates and comm cost. DQN target is **net value** and beating **failure_rules** baseline (+12.7pp recovery in smoke eval). Full 1500-episode train + net-value comparison is the judge metric.

---

## 8. Simulator ≠ production

**Challenge:** Policy may overfit simulator dynamics.

**Solution:**
- Eval on held-out envs: `shift`, `bank_outage`, `adversarial` (lower `_shift` multiplier)
- Razorpay calibration script (planned) to fit hidden params from Test Mode outcomes
- Never claim simulator numbers as live merchant uplift

---

## 9. Webhook duplicates & ordering

**Challenge:** Razorpay delivers at-least-once; `payment.failed` may precede `payment.captured` on same txn (UPI late auth).

**Solution:**
- `razorpay_event_id` unique constraint on `audit_entries`
- State machine: don't trigger aggressive recovery on failed if captured is imminent — UPI wait mask encodes this in policy
- Hash-chained audit for demo narrative

---

## 10. Solo 16h timeline

**Challenge:** Can't build full PPO + live RL + custom UI + Razorpay integration.

**Solution:**
- Small DQN (3×128 MLP), trains in minutes on M3
- Emergent for UI; Cursor for backend/RL
- Test Mode only (no live mode)
- Supabase + Vercel from day 1

---

## Open challenges (not yet solved)

| Challenge | Planned approach |
|---|---|
| Payment Links API not wired in backend yet | Add `apps/web/src/lib/razorpay-client.ts` |
| No real calibration data yet | Collect after first Test Mode runs |
| Subscription halted flow | Week-2 scope; one-time checkout first |
| Living research KB automation | Periodic claim refresh via agy CLI |

---

*Last updated: build day 1 — pre full 1500-episode train*
