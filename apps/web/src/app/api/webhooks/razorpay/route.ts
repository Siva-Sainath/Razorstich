import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase";
import { mapRazorpayError, verifyRazorpaySignature } from "@/lib/razorpay";
import { recommendAction } from "@/lib/policy";

function auditHash(payload: unknown, prev: string | null): string {
  const body = JSON.stringify({ payload, prev });
  return crypto.createHash("sha256").update(body).digest("hex");
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get("x-razorpay-signature");

  if (secret && !verifyRazorpaySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  const eventId = event?.event_id ?? event?.id ?? crypto.randomUUID();
  const entity = event?.payload?.payment?.entity ?? event?.payload?.payment ?? {};
  const status = entity?.status ?? "unknown";
  const caseId = entity?.order_id ?? entity?.id ?? `RZP-${eventId}`;

  const failureReason =
    status === "failed"
      ? mapRazorpayError(entity?.error_code, entity?.error_description)
      : null;

  const supabase = getSupabase();
  let prevHash: string | null = null;

  if (supabase) {
    const { data: last } = await supabase
      .from("audit_entries")
      .select("hash")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    prevHash = last?.hash ?? null;

    if (status === "failed") {
      await supabase.from("recovery_cases").upsert(
        {
          case_id: caseId,
          amount_paise: entity?.amount ?? 0,
          method: entity?.method ?? "card",
          error_reason: failureReason,
          payment_status: status,
        },
        { onConflict: "case_id" }
      );
    } else if (status === "captured") {
      await supabase
        .from("recovery_cases")
        .update({ payment_status: status, recovered_at: new Date().toISOString() })
        .eq("case_id", caseId);
    }
  }

  let policyDecision = null;
  if (failureReason) {
    policyDecision = recommendAction({
      failure_reason: failureReason,
      method: entity?.method,
      hours_since_failure: 0,
    });
    if (supabase) {
      await supabase.from("policy_decisions").insert({
        case_id: caseId,
        policy_version: policyDecision.policy_version,
        selected_action: policyDecision.selected_action,
        q_values: policyDecision.q_values,
        constraints_passed: policyDecision.constraints_passed,
        constraints_total: policyDecision.constraints_total,
      });
    }
  }

  const hash = auditHash({ eventId, caseId, status, policyDecision }, prevHash);

  if (supabase) {
    await supabase.from("audit_entries").insert({
      case_id: caseId,
      event_type: event?.event ?? "payment.event",
      policy_version: policyDecision?.policy_version,
      payload: event,
      hash,
      prev_hash: prevHash,
      razorpay_event_id: eventId,
    });
  }

  return NextResponse.json({ ok: true, case_id: caseId, policy: policyDecision });
}
