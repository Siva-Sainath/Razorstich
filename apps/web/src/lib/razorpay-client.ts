const RAZORPAY_API = "https://api.razorpay.com/v1";

export type PaymentLinkInput = {
  amountPaise: number;
  referenceId: string;
  description?: string;
  customer?: { name?: string; email?: string; contact?: string };
};

export async function createPaymentLink(input: PaymentLinkInput) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
  }
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new Error("Payment Link amount must be an integer of at least 100 paise");
  }

  const response = await fetch(`${RAZORPAY_API}/payment_links`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      accept_partial: false,
      reference_id: input.referenceId,
      description: input.description ?? `RazorStitch recovery for ${input.referenceId}`,
      customer: input.customer,
      expire_by: Math.floor(Date.now() / 1000) + 72 * 60 * 60,
      notes: { razorstitch_case_id: input.referenceId },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Razorpay Payment Link failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload as { id: string; short_url: string; status: string };
}
