import crypto from "crypto";

/**
 * Verifies the Razorpay payment signature.
 * Razorpay signs: HMAC-SHA256(`${orderId}|${paymentId}`, keySecret)
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
