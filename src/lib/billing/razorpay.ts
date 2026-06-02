import Razorpay from "razorpay";

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  /** Per-seat monthly price in paisa (INR). */
  proPlanAmountPaisa?: number;
  /** Per-seat monthly price in cents (USD). */
  proPlanAmountCents?: number;
};

let _instance: Razorpay | null = null;

/**
 * Reads RAZORPAY_KEY_ID / NEXT_PUBLIC_RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET
 * from environment variables and returns a typed config object.
 * Returns null if any required variable is missing or invalid.
 */
export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId =
    process.env.RAZORPAY_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const inrRaw = process.env.RAZORPAY_PRO_PLAN_AMOUNT_PAISA?.trim();
  const usdRaw = process.env.RAZORPAY_PRO_PLAN_AMOUNT_CENTS?.trim();
  const proPlanAmountPaisa = inrRaw ? Number(inrRaw) : undefined;
  const proPlanAmountCents = usdRaw ? Number(usdRaw) : undefined;

  if (!keyId || !keySecret) {
    return null;
  }

  const truncPositive = (n: number | undefined) =>
    n && Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;

  return {
    keyId,
    keySecret,
    proPlanAmountPaisa: truncPositive(proPlanAmountPaisa),
    proPlanAmountCents: truncPositive(proPlanAmountCents),
  };
}

/**
 * Returns a cached Razorpay SDK instance.
 * Throws if env vars are not configured.
 */
export function getRazorpayInstance(): Razorpay {
  if (_instance) return _instance;
  const cfg = getRazorpayConfig();
  if (!cfg) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }
  _instance = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret });
  return _instance;
}
