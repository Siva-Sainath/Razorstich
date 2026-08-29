import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentLink } from "@/lib/razorpay-client";
import { getSupabase } from "@/lib/supabase";

const BodySchema = z.object({
  case_id: z.string(),
  action: z.literal("create_payment_link"),
  amount_paise: z.number().int().min(100),
  customer: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      contact: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const link = await createPaymentLink({
      amountPaise: parsed.data.amount_paise,
      referenceId: parsed.data.case_id,
      customer: parsed.data.customer,
    });
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from("recovery_cases")
        .update({ customer_checkout_state: "payment_link_created" })
        .eq("case_id", parsed.data.case_id);
    }
    return NextResponse.json({ ok: true, case_id: parsed.data.case_id, link });
  } catch (error) {
    console.error("Payment Link creation failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment Link creation failed" },
      { status: 502 }
    );
  }
}
