import crypto from "crypto";

export function verifyRazorpaySignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export function mapRazorpayError(errorCode?: string, description?: string): string {
  const text = `${errorCode ?? ""} ${description ?? ""}`.toLowerCase();
  if (text.includes("insufficient")) return "insufficient_funds";
  if (text.includes("cancel")) return "payment_cancelled";
  if (text.includes("auth")) return "authentication_failed";
  if (text.includes("timeout") || text.includes("upi")) return "upi_timeout";
  if (text.includes("bank")) return "bank_outage";
  if (text.includes("gateway")) return "gateway_error";
  return "gateway_error";
}
