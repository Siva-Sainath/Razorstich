import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PolicyUnavailableError, recommendAction } from "@/lib/policy";
import { getSupabase } from "@/lib/supabase";

const BodySchema = z.object({
  case_id: z.string().optional(),
  failure_reason: z.string(),
  hours_since_failure: z.number().optional(),
  contacts_used: z.number().optional(),
  contacts_max: z.number().optional(),
  method: z.string().optional(),
  amount_paise: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let decision;
  try {
    decision = recommendAction(parsed.data);
  } catch (error) {
    if (error instanceof PolicyUnavailableError) {
      return NextResponse.json(
        {
          error: "DQN policy unavailable",
          detail: error.message,
          remediation: "Train and export the DQN policy before serving recommendations.",
        },
        { status: 503 }
      );
    }
    throw error;
  }
  const supabase = getSupabase();

  if (supabase && parsed.data.case_id) {
    await supabase.from("policy_decisions").insert({
      case_id: parsed.data.case_id,
      policy_version: decision.policy_version,
      selected_action: decision.selected_action,
      q_values: decision.q_values,
      constraints_passed: decision.constraints_passed,
      constraints_total: decision.constraints_total,
    });
  }

  return NextResponse.json({
    case_id: parsed.data.case_id,
    ...decision,
    expected_value_inr: parsed.data.amount_paise ? parsed.data.amount_paise / 100 : null,
  });
}
