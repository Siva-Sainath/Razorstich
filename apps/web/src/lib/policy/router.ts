import checkoutWeights from "@/data/weights/checkout_failed.json";
import cartWeights from "@/data/weights/cart_abandon.json";
import subscriptionWeights from "@/data/weights/subscription_failed.json";
import invoiceWeights from "@/data/weights/invoice_overdue.json";
import { predictDuelingDQN, type DuelingWeights, type PolicyTelemetry } from "@policy/inference";
import {
  buildActionMask,
  encodeState,
  encodeCartState,
  buildCartActionMask,
  encodeSubscriptionState,
  buildSubscriptionActionMask,
  encodeInvoiceState,
  buildInvoiceActionMask,
  type StateEncoderInput,
} from "@policy/encoders";

export class PolicyUnavailableError extends Error {}

export type RecoveryWedge =
  | "checkout_failed"
  | "cart_abandon"
  | "subscription_failed"
  | "invoice_overdue";

const WEIGHTS: Record<RecoveryWedge, DuelingWeights> = {
  checkout_failed: checkoutWeights as DuelingWeights,
  cart_abandon: cartWeights as DuelingWeights,
  subscription_failed: subscriptionWeights as DuelingWeights,
  invoice_overdue: invoiceWeights as DuelingWeights,
};

const REASON_TO_SOURCE: Record<string, string> = {
  insufficient_funds: "customer",
  payment_cancelled: "customer",
  authentication_failed: "customer",
  gateway_error: "gateway",
  upi_timeout: "gateway",
  bank_outage: "razorpay",
  card_expired: "customer",
  smb: "business",
  enterprise: "business",
  payment_page: "business",
};

export interface RecommendInput {
  wedge?: RecoveryWedge;
  failure_reason: string;
  hours_since_failure?: number;
  contacts_used?: number;
  contacts_max?: number;
  method?: string;
  amount_paise?: number;
  amount_inr?: number;
  error_source?: string;
  attempt_count?: number;
  is_returning?: boolean;
  late_auth_risk?: boolean;
  prior_action?: number;
  prior_outcome?: number;
  abandon_stage?: string;
  billing_cycle_day?: number;
  failed_attempts?: number;
  customer_tier?: string;
  partial_paid_ratio?: number;
}

export function recommendForWedge(input: RecommendInput): {
  wedge: RecoveryWedge;
  policy_version: string;
  selected_action: string;
  q_values: Record<string, number>;
  telemetry: PolicyTelemetry;
  source: "dueling_dqn_forward_pass";
  constraints_passed: number;
  constraints_total: number;
} {
  const wedge = input.wedge ?? "checkout_failed";
  const weights = WEIGHTS[wedge];
  if (!weights?.shared?.fc1?.w) {
    throw new PolicyUnavailableError(`weights missing for wedge ${wedge}`);
  }

  const amountInr = input.amount_inr ?? (input.amount_paise ? input.amount_paise / 100 : 1500);
  const base: StateEncoderInput = {
    amount_inr: amountInr,
    failure_reason: input.failure_reason || "gateway_error",
    error_source: input.error_source || REASON_TO_SOURCE[input.failure_reason] || "gateway",
    method: input.method || "card",
    hours_since_failure: input.hours_since_failure ?? 0,
    attempt_count: input.attempt_count ?? 1,
    contacts_used: input.contacts_used ?? 0,
    contacts_max: input.contacts_max ?? 3,
    is_returning: input.is_returning ?? false,
    late_auth_risk: input.late_auth_risk ?? false,
    prior_action: input.prior_action ?? 0,
    prior_outcome: input.prior_outcome ?? 0,
  };

  let stateVector: number[];
  let actionMask: boolean[];

  switch (wedge) {
    case "cart_abandon":
      stateVector = encodeCartState({ ...base, abandon_stage: input.abandon_stage });
      actionMask = buildCartActionMask({ ...base, failure_reason: "payment_cancelled" });
      break;
    case "subscription_failed":
      stateVector = encodeSubscriptionState({
        ...base,
        failure_reason: input.failure_reason || "card_expired",
        failed_attempts: input.failed_attempts,
      });
      actionMask = buildSubscriptionActionMask({ ...base, failure_reason: input.failure_reason || "card_expired" });
      break;
    case "invoice_overdue":
      stateVector = encodeInvoiceState({
        ...base,
        customer_tier: input.customer_tier ?? input.failure_reason ?? "smb",
        partial_paid_ratio: input.partial_paid_ratio,
      });
      actionMask = buildInvoiceActionMask({ ...base, failure_reason: input.customer_tier ?? "smb" });
      break;
    default:
      stateVector = encodeState(base);
      actionMask = buildActionMask(base);
  }

  const telemetry = predictDuelingDQN(stateVector, actionMask, weights);

  let constraintsPassed = 3;
  const contactActions = new Set(["notify_customer", "resend_link", "suggest_alt_method"]);
  if (contactActions.has(telemetry.selectedAction) && (base.contacts_used ?? 0) >= (base.contacts_max ?? 3)) {
    constraintsPassed -= 1;
  }
  if (
    wedge === "checkout_failed" &&
    base.method === "upi" &&
    (base.hours_since_failure ?? 0) < 1 &&
    ["retry_checkout", "create_payment_link"].includes(telemetry.selectedAction)
  ) {
    constraintsPassed -= 1;
  }

  return {
    wedge,
    policy_version: weights.policy_version,
    selected_action: telemetry.selectedAction,
    q_values: telemetry.qValues,
    telemetry,
    source: "dueling_dqn_forward_pass",
    constraints_passed: constraintsPassed,
    constraints_total: 3,
  };
}
