import type { PolicyTelemetry } from "./inference";

export interface NarratorOutput {
  merchantRationale: string;
  customerCopy?: string;
}

const ACTION_INDEX: Record<string, number> = {
  wait: 0,
  retry_checkout: 1,
  suggest_alt_method: 2,
  create_payment_link: 3,
  resend_link: 4,
  notify_customer: 5,
  request_method_update: 6,
  offer_partial: 7,
  escalate_human: 8,
  reconcile: 9,
  stop: 10,
};

const CONTACT_ACTIONS = new Set([
  "notify_customer",
  "resend_link",
  "suggest_alt_method",
  "request_method_update",
]);

export async function generatePolicyNarration(
  stateContext: Record<string, unknown>,
  telemetry: PolicyTelemetry
): Promise<NarratorOutput> {
  const prompt = {
    system:
      "You are the Explainability Copilot for the RazorStitch RL Engine. You NEVER pick, modify, or suggest actions. Your only job is to: 1) Explain mathematically why the RL agent chose this action by comparing its Q-value and Advantage to blocked or lower-ranked alternatives; 2) If the action contacts the customer, write crisp, contextual WhatsApp/SMS copy.",
    context: {
      failureReason: stateContext.failureReason,
      amount: stateContext.amount,
      hoursElapsed: stateContext.hoursElapsed,
      trustBudgetRemaining: stateContext.trustBudgetRemaining,
      chosenAction: telemetry.selectedAction,
      baselineHealthV: telemetry.baselineValue,
      advantageA: telemetry.advantages[telemetry.selectedAction],
      allQValues: telemetry.qValues,
      actionMask: telemetry.actionMask,
    },
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey && process.env.POLICY_NARRATOR_MODEL) {
    try {
      const response = await fetch(
        process.env.POLICY_NARRATOR_ENDPOINT || "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.POLICY_NARRATOR_MODEL,
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: JSON.stringify(prompt.context) },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content) as NarratorOutput;
      }
    } catch {
      // Fall through to deterministic narration.
    }
  }

  return deterministicNarration(stateContext, telemetry);
}

function deterministicNarration(
  stateContext: Record<string, unknown>,
  telemetry: PolicyTelemetry
): NarratorOutput {
  const chosen = telemetry.selectedAction;
  const chosenQ = telemetry.qValues[chosen];
  const chosenAdv = telemetry.advantages[chosen];
  const ranked = Object.entries(telemetry.qValues)
    .filter(([name]) => telemetry.actionMask[ACTION_INDEX[name] ?? -1])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const merchantRationale =
    `Policy selected **${chosen}** (Q=${chosenQ.toFixed(3)}, A=${chosenAdv.toFixed(3)}, V=${telemetry.baselineValue.toFixed(3)}). ` +
    `Top masked alternatives: ${ranked.map(([a, q]) => `${a} (${q.toFixed(3)})`).join(", ")}. ` +
    `Failure: ${stateContext.failureReason ?? "unknown"}; ${stateContext.hoursElapsed ?? 0}h elapsed.`;

  let customerCopy: string | undefined;
  if (CONTACT_ACTIONS.has(chosen)) {
    const amount = stateContext.amount ?? "your payment";
    customerCopy =
      chosen === "resend_link"
        ? `Hi — here's a fresh secure link to complete your payment of ₹${amount}. Reply HELP if you need assistance.`
        : `Hi — we noticed your recent payment didn't go through. You can retry safely here when ready (₹${amount}).`;
  }

  return { merchantRationale, customerCopy };
}
