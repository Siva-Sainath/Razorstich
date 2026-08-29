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

async function razorpayRequest(path: string, body: Record<string, unknown>) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Razorpay ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload;
}

export async function createOrder(amountPaise: number, receipt: string) {
  return razorpayRequest("/orders", { amount: amountPaise, currency: "INR", receipt, payment_capture: 1 });
}

export async function createInvoice(input: { amountPaise: number; customerId?: string; description: string }) {
  return razorpayRequest("/invoices", {
    type: "invoice",
    description: input.description,
    customer: input.customerId ? { name: "Demo Customer", email: "demo@razorstitch.dev" } : undefined,
    line_items: [{ name: input.description, amount: input.amountPaise, currency: "INR", quantity: 1 }],
    sms_notify: 1,
    email_notify: 1,
  });
}

export async function notifyInvoice(invoiceId: string) {
  return razorpayRequest(`/invoices/${invoiceId}/notify_by/sms`, {});
}
