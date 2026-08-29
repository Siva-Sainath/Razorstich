import { NUM_ACTIONS, type StateEncoderInput, encodeState, buildActionMask } from "../state_encoder";

const HORIZON = { cart_abandon: 48, subscription_failed: 336, invoice_overdue: 720 } as const;

function oneHot(value: string, vocab: string[], size: number): number[] {
  const v = new Array(size).fill(0);
  const idx = vocab.indexOf(value);
  if (idx >= 0) v[idx] = 1;
  return v;
}

export function encodeCartState(input: StateEncoderInput & { abandon_stage?: string; session_depth?: number }) {
  const stageOh = oneHot(input.abandon_stage ?? "payment_page", ["payment_page", "browsing", "shipping"], 6);
  const vec = encodeState({ ...input, failure_reason: "payment_cancelled", hours_since_failure: (input.hours_since_failure ?? 0) });
  vec[1] = Math.min(1, (input.hours_since_failure ?? 0) / HORIZON.cart_abandon);
  vec[4] = input.is_returning ? 1 : 0;
  vec[8] = stageOh[0];
  vec[9] = stageOh[1];
  vec[10] = stageOh[2];
  return vec;
}

export function buildCartActionMask(input: Parameters<typeof buildActionMask>[0]) {
  const mask = buildActionMask({ ...input, failure_reason: "payment_cancelled" });
  mask[1] = false;
  return mask;
}

export function encodeSubscriptionState(input: StateEncoderInput & { billing_cycle_day?: number; failed_attempts?: number }) {
  const reasons = ["insufficient_funds", "card_expired", "authentication_failed", "gateway_error"];
  const reason = reasons.includes(input.failure_reason) ? input.failure_reason : "card_expired";
  const vec = encodeState({ ...input, failure_reason: reason === "card_expired" ? "authentication_failed" : reason });
  vec[1] = Math.min(1, (input.hours_since_failure ?? 0) / HORIZON.subscription_failed);
  vec[2] = Math.min(1, (input.failed_attempts ?? 1) / 5);
  vec[4] = 1;
  return vec;
}

export function buildSubscriptionActionMask(input: Parameters<typeof buildActionMask>[0]) {
  const mask = buildActionMask(input);
  if ((input.hours_since_failure ?? 0) < 6) mask[1] = false;
  return mask;
}

export function encodeInvoiceState(input: StateEncoderInput & { customer_tier?: string; partial_paid_ratio?: number }) {
  const tier = input.customer_tier ?? input.failure_reason ?? "smb";
  const vec = encodeState({ ...input, failure_reason: "gateway_error" });
  vec[1] = Math.min(1, (input.hours_since_failure ?? 0) / HORIZON.invoice_overdue);
  vec[4] = tier === "enterprise" ? 1 : 0;
  vec[5] = 1;
  vec[6] = input.partial_paid_ratio ?? 0;
  vec[8] = tier === "smb" ? 1 : 0;
  vec[9] = tier === "enterprise" ? 1 : 0;
  return vec;
}

export function buildInvoiceActionMask(input: Parameters<typeof buildActionMask>[0]) {
  const mask = buildActionMask(input);
  mask[1] = false;
  mask[3] = false;
  return mask;
}

export { encodeState, buildActionMask, NUM_ACTIONS };
