import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentLink, createInvoice, notifyInvoice } from "@/lib/razorpay-client";
import { getSupabase } from "@/lib/supabase";

const BodySchema = z.object({
  case_id: z.string(),
  wedge: z.enum(["checkout_failed", "cart_abandon", "subscription_failed", "invoice_overdue"]).optional(),
  action: z.enum([
    "create_payment_link",
    "notify_customer",
    "request_method_update",
    "offer_partial",
    "resend_invoice",
  ]),
  amount_paise: z.number().int().min(100),
  customer: z.object({ name: z.string().optional(), email: z.string().email().optional(), contact: z.string().optional() }).optional(),
  invoice_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    let result: Record<string, unknown>;
    if (parsed.data.action === "resend_invoice" && parsed.data.invoice_id) {
      result = { invoice: await notifyInvoice(parsed.data.invoice_id) };
    } else if (parsed.data.action === "offer_partial") {
      result = {
        link: await createPaymentLink({
          amountPaise: Math.max(100, Math.floor(parsed.data.amount_paise * 0.5)),
          referenceId: `${parsed.data.case_id}-partial`,
          description: `Partial payment offer for ${parsed.data.case_id}`,
          customer: parsed.data.customer,
        }),
        offer: "50% partial settlement",
      };
    } else {
      result = {
        link: await createPaymentLink({
          amountPaise: parsed.data.amount_paise,
          referenceId: parsed.data.case_id,
          customer: parsed.data.customer,
          description: `RazorStitch ${parsed.data.wedge ?? "recovery"} action: ${parsed.data.action}`,
        }),
        action: parsed.data.action,
      };
    }

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("recovery_cases").update({
        customer_checkout_state: parsed.data.action,
        wedge: parsed.data.wedge,
      }).eq("case_id", parsed.data.case_id);
    }
    return NextResponse.json({ ok: true, case_id: parsed.data.case_id, wedge: parsed.data.wedge, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "execute failed" }, { status: 502 });
  }
}
