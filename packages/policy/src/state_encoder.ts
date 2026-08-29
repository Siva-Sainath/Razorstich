const REASONS = [
  "insufficient_funds",
  "payment_cancelled",
  "authentication_failed",
  "gateway_error",
  "upi_timeout",
  "bank_outage",
] as const;

const SOURCES = ["customer", "gateway", "business", "razorpay"] as const;

export const OBS_DIM = 31;
export const NUM_ACTIONS = 11;

function oneHot(value: string, vocab: readonly string[], size: number): number[] {
  const v = new Array(size).fill(0);
  const idx = vocab.indexOf(value);
  if (idx >= 0) v[idx] = 1;
  return v;
}

export interface StateEncoderInput {
  amount_inr: number;
  failure_reason: string;
  error_source?: string;
  method?: string;
  hours_since_failure?: number;
  attempt_count?: number;
  contacts_used?: number;
  contacts_max?: number;
  is_returning?: boolean;
  late_auth_risk?: boolean;
  prior_action?: number;
  prior_outcome?: number;
}

export function encodeState(input: StateEncoderInput): number[] {
  const reasonOh = oneHot(input.failure_reason || "gateway_error", REASONS, 6);
  const sourceOh = oneHot(input.error_source || "gateway", SOURCES, 4);
  const methodOh = oneHot(input.method || "card", ["card", "upi"], 2);
  const priorActionOh = new Array(NUM_ACTIONS).fill(0);
  const prior = input.prior_action ?? 0;
  if (prior >= 0 && prior < NUM_ACTIONS) priorActionOh[prior] = 1;

  const contactsMax = Math.max(1, input.contacts_max ?? 3);
  const contactsUsed = Math.max(0, input.contacts_used ?? 0);

  return [
    Math.log1p(Math.max(0, input.amount_inr)) / 10,
    Math.max(0, input.hours_since_failure ?? 0) / 72,
    Math.max(0, input.attempt_count ?? 1) / 5,
    contactsUsed / contactsMax,
    input.is_returning ? 1 : 0,
    input.late_auth_risk ? 1 : 0,
    input.prior_outcome ?? 0,
    (contactsMax - contactsUsed) / contactsMax,
    ...reasonOh,
    ...sourceOh,
    ...methodOh,
    ...priorActionOh,
  ];
}

export function buildActionMask(input: {
  failure_reason: string;
  method?: string;
  hours_since_failure?: number;
  contacts_used?: number;
  contacts_max?: number;
  recovered?: boolean;
  stopped?: boolean;
}): boolean[] {
  const mask = new Array(NUM_ACTIONS).fill(true);
  const contactsUsed = input.contacts_used ?? 0;
  const contactsMax = input.contacts_max ?? 3;
  const hours = input.hours_since_failure ?? 0;

  if (contactsUsed >= contactsMax) {
    for (const idx of [5, 4, 2]) mask[idx] = false; // notify, resend, suggest_alt
  }
  if (hours < 1 && input.failure_reason === "upi_timeout") {
    mask[1] = false; // retry_checkout
    mask[3] = false; // create_payment_link
  }
  if (input.recovered || input.stopped) {
    for (let i = 0; i < mask.length; i++) mask[i] = false;
    mask[10] = true; // stop
  }
  if (hours >= 72) {
    for (let i = 0; i < mask.length; i++) mask[i] = false;
    mask[10] = true; // stop
    mask[8] = true; // escalate_human
  }
  return mask;
}
