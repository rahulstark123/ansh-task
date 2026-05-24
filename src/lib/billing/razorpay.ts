import Razorpay from "razorpay";

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  proPlanAmountPaisa: number; // per-workspace flat monthly amount
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
  const amountRaw =
    process.env.RAZORPAY_PRO_PLAN_AMOUNT_PAISA?.trim() || "39900";
  const proPlanAmountPaisa = Number(amountRaw);

  if (
    !keyId ||
    !keySecret ||
    !Number.isFinite(proPlanAmountPaisa) ||
    proPlanAmountPaisa <= 0
  ) {
    return null;
  }

  return { keyId, keySecret, proPlanAmountPaisa: Math.trunc(proPlanAmountPaisa) };
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
      "Razorpay is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_PRO_PLAN_AMOUNT_PAISA in .env"
    );
  }
  _instance = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret });
  return _instance;
}
