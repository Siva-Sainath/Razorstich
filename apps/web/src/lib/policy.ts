import rules from "@/data/policy_rules.json";

export type PolicyRules = {
  policy_version: string;
  hours_buckets: string[];
  contact_buckets: number[];
  reasons: Record<
    string,
    Record<
      string,
      Record<
        string,
        {
          selected_action: string;
          q_values: Record<string, number>;
          ranked: { action: string; q: number }[];
        }
      >
    >
  >;
};

export class PolicyUnavailableError extends Error {}

function getHoursBucket(hours: number): string {
  if (hours < 6) return "0_6";
  if (hours < 24) return "6_24";
  return "24_72";
}

export function recommendAction(input: {
  failure_reason: string;
  hours_since_failure?: number;
  contacts_used?: number;
  contacts_max?: number;
  method?: string;
}): {
  policy_version: string;
  selected_action: string;
  q_values: Record<string, number>;
  source: "dqn_export" | "failure_rules";
  constraints_passed: number;
  constraints_total: number;
} {
  const reason = input.failure_reason || "gateway_error";
  const policy = rules as PolicyRules;
  const bucket = getHoursBucket(Math.max(0, input.hours_since_failure ?? 0));
  const contacts = Math.min(3, Math.max(0, Math.floor(input.contacts_used ?? 0)));
  const exported = policy.reasons[reason]?.[bucket]?.[String(contacts)];
  if (!exported) {
    throw new PolicyUnavailableError(
      `No DQN policy export for reason=${reason}, bucket=${bucket}, contacts=${contacts}`
    );
  }
  let selected = exported.selected_action;

  let constraintsPassed = 3;
  const constraintsTotal = 3;

  // Trust budget: block notify/resend if contacts exhausted
  const contactsUsed = input.contacts_used ?? 0;
  const contactsMax = input.contacts_max ?? 3;
  const contactActions = new Set(["notify_customer", "resend_link", "suggest_alt_method"]);
  if (contactActions.has(selected) && contactsUsed >= contactsMax) {
    selected = "wait";
    constraintsPassed -= 1;
  }

  // UPI duplicate-risk window: prefer wait in first hour
  if (
    input.method === "upi" &&
    (input.hours_since_failure ?? 0) < 1 &&
    ["retry_checkout", "create_payment_link"].includes(selected)
  ) {
    selected = "wait";
    constraintsPassed -= 1;
  }

  return {
    policy_version: policy.policy_version,
    selected_action: selected,
    q_values: exported.q_values,
    source: "dqn_export",
    constraints_passed: constraintsPassed,
    constraints_total: constraintsTotal,
  };
}
