import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase";
import { mapRazorpayError, verifyRazorpaySignature } from "@/lib/razorpay";
import { recommendAction, type RecoveryWedge } from "@/lib/policy";

function auditHash(payload: unknown, prev: string | null): string {
  return crypto.createHash("sha256").update(JSON.stringify({ payload, prev })).digest("hex");
}

function resolveWedge(event: Record<string, unknown>): RecoveryWedge {
  const name = String(event?.event ?? "");
  if (name.includes("subscription")) return "subscription_failed";
  if (name.includes("invoice")) return "invoice_overdue";
  if (name.includes("order")) return "cart_abandon";
  return "checkout_failed";
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get("x-razorpay-signature");
  if (secret && !verifyRazorpaySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  const wedge = resolveWedge(event);
  const eventId = event?.event_id ?? event?.id ?? crypto.randomUUID();
  const payment = event?.payload?.payment?.entity ?? event?.payload?.payment ?? {};
  const order = event?.payload?.order?.entity ?? {};
  const subscription = event?.payload?.subscription?.entity ?? {};
  const invoice = event?.payload?.invoice?.entity ?? {};

  const entity = payment?.id ? payment : order?.id ? order : subscription?.id ? subscription : invoice;
  const status = entity?.status ?? "unknown";
  const caseId = entity?.order_id ?? entity?.id ?? `RZP-${eventId}`;
  const amountPaise = entity?.amount ?? entity?.amount_paid ?? entity?.plan_amount ?? 0;

  const failureReason =
    wedge === "checkout_failed" && status === "failed"
      ? mapRazorpayError(entity?.error_code, entity?.error_description)
      : wedge === "subscription_failed"
        ? "card_expired"
        : wedge === "invoice_overdue"
          ? "smb"
          : wedge === "cart_abandon"
            ? "payment_page"
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

    await supabase.from("recovery_cases").upsert(
      {
        case_id: caseId,
        amount_paise: amountPaise,
        method: entity?.method ?? "card",
        error_reason: failureReason,
        payment_status: status,
        wedge,
        wedge_metadata: { event: event?.event, entity },
      },
      { onConflict: "case_id" }
    );
  }

  let policyDecision = null;
  if (failureReason || wedge !== "checkout_failed") {
    policyDecision = recommendAction({
      wedge,
      failure_reason: failureReason ?? "gateway_error",
      method: entity?.method,
      hours_since_failure: wedge === "invoice_overdue" ? 168 : wedge === "cart_abandon" ? 0.33 : 0,
      amount_paise: amountPaise,
      customer_tier: wedge === "invoice_overdue" ? "smb" : undefined,
      abandon_stage: wedge === "cart_abandon" ? "payment_page" : undefined,
      failed_attempts: wedge === "subscription_failed" ? 1 : undefined,
    });
    if (supabase && policyDecision) {
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

  const hash = auditHash({ eventId, caseId, status, wedge, policyDecision }, prevHash);
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

  return NextResponse.json({ ok: true, case_id: caseId, wedge, policy: policyDecision });
}
