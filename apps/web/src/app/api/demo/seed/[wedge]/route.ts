import { NextRequest, NextResponse } from "next/server";
import { createInvoice, createOrder, createPaymentLink } from "@/lib/razorpay-client";
import { getSupabase } from "@/lib/supabase";

const SCENARIOS: Record<string, Record<string, unknown>> = {
  checkout_failed: {
    case_id: "RS-CHK-UPI-2048",
    failure_reason: "upi_timeout",
    hours_since_failure: 0,
    amount_inr: 1499,
    method: "upi",
    demo_seed_id: "checkout_upi_timeout_t0",
  },
  cart_abandon: {
    case_id: "RS-CART-2048",
    failure_reason: "payment_page",
    hours_since_failure: 0.33,
    amount_inr: 2499,
    abandon_stage: "payment_page",
    demo_seed_id: "cart_20min_idle",
  },
  subscription_failed: {
    case_id: "RS-SUB-2048",
    failure_reason: "card_expired",
    hours_since_failure: 0,
    amount_inr: 899,
    failed_attempts: 1,
    demo_seed_id: "subscription_card_expired",
  },
  invoice_overdue: {
    case_id: "RS-INV-2048",
    failure_reason: "smb",
    hours_since_failure: 168,
    amount_inr: 12500,
    customer_tier: "smb",
    partial_paid_ratio: 0,
    demo_seed_id: "invoice_7d_overdue",
  },
};

export async function POST(_req: NextRequest, ctx: { params: Promise<{ wedge: string }> }) {
  const { wedge } = await ctx.params;
  const scenario = SCENARIOS[wedge];
  if (!scenario) return NextResponse.json({ error: "unknown wedge" }, { status: 400 });

  let razorpay: Record<string, unknown> | null = null;
  try {
    if (wedge === "cart_abandon") {
      razorpay = await createOrder(Math.round((scenario.amount_inr as number) * 100), scenario.case_id as string);
    } else if (wedge === "invoice_overdue") {
      razorpay = await createInvoice({
        amountPaise: Math.round((scenario.amount_inr as number) * 100),
        description: `RazorStitch overdue invoice ${scenario.case_id}`,
      });
    } else if (wedge === "checkout_failed") {
      razorpay = await createPaymentLink({
        amountPaise: Math.round((scenario.amount_inr as number) * 100),
        referenceId: scenario.case_id as string,
      });
    }
  } catch (error) {
    razorpay = { simulated: true, detail: error instanceof Error ? error.message : "razorpay unavailable" };
  }

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("recovery_cases").upsert({
      case_id: scenario.case_id,
      amount_paise: Math.round((scenario.amount_inr as number) * 100),
      wedge,
      wedge_metadata: scenario,
      demo_seed_id: scenario.demo_seed_id,
      payment_status: "open",
    });
  }

  return NextResponse.json({ ok: true, wedge, scenario, razorpay });
}
