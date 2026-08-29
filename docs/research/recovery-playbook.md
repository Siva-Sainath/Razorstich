# Default Recovery Playbook

This playbook outlines the default timing and actions per `failure_reason`. It serves as the baseline policy (often mapped as static `failure_rules`) and directly feeds the narrative for our LLM judge/simulator for realistic state transitions.

## 1. Failure Reason: `insufficient_funds`
- **Context**: Customer does not have enough balance. Repeated retries harm the customer (bank fees) and our success rate.
- **Action t+0**: Do nothing (Silence).
- **Action t+24h**: Send soft nudge via Email ("Action required: Update your payment method").
- **Action t+3-5 days**: Backend retry (aligned with typical salary cycles: 1st/15th of the month) OR send Payment Link via WhatsApp if no updated card is on file.
- **Judge Narrative**: The customer needs time to deposit money. Immediate pressure causes anxiety; giving a grace period preserves the relationship and maintains trust.

## 2. Failure Reason: `upi_network_timeout` / `upi_pending`
- **Context**: NPCI switch or issuer bank is unresponsive. High risk of duplicate payment if pushed aggressively.
- **Action t+0**: Mask/Block all communication for 1 hour.
- **Action t+1h**: Check status. If still failed, send an SMS/WhatsApp with a fresh Payment Link.
- **Judge Narrative**: UPI delays are out of the customer's control. Pushing a new link immediately causes panic about double-debiting. Wait out the standard TTL before re-engaging.

## 3. Failure Reason: `card_expired` / `invalid_card`
- **Context**: Hard decline. The current payment method will never work.
- **Action t+0**: Immediate Email + In-app notification to update the card.
- **Action t+48h**: If un-updated, send SMS with Payment Link.
- **Action t+7d**: Final WhatsApp reminder before subscription suspension.
- **Judge Narrative**: The user must actively intervene. Prompting immediately is expected and helpful, not annoying. Tone should be strictly neutral.

## 4. Failure Reason: `do_not_honor` / `fraud_suspected`
- **Context**: Issuer bank blocked the transaction. Often triggered by velocity checks or unverified usage.
- **Action t+0**: Send Email instructing the customer to contact their bank to approve the transaction.
- **Action t+24h**: Send fallback Payment Link (allowing them to use an alternate method like UPI or a different card).
- **Judge Narrative**: Retrying the same card will lower our merchant trust score with the gateway. The user must use a new method or clear the block with their bank.

## 5. Failure Reason: `gateway_timeout` (Generic)
- **Context**: Transient failure not directly attributable to the user's funds or credentials.
- **Action t+0**: Do nothing.
- **Action t+2h**: Silent backend retry.
- **Action t+24h**: If retry fails, treat as a standard hard decline and send Payment Link via Email.
- **Judge Narrative**: Hide the complexity from the user. Attempt a silent recovery first; only bother the user if the transient issue persists.
