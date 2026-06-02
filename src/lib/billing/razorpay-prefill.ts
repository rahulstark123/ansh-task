export type RazorpayPrefill = {
  name?: string;
  email?: string;
  contact?: string;
};

export type RazorpayReadonlyFields = {
  email?: boolean;
  contact?: boolean;
};

/** Build Razorpay Checkout `prefill` — only fields we have; never a default phone. */
export function buildRazorpayPrefill(user: {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
} | null | undefined): RazorpayPrefill {
  if (!user) return {};

  const prefill: RazorpayPrefill = {};

  const email = user.email?.trim();
  if (email) {
    prefill.email = email;
  }

  const name = [user.firstName, user.lastName]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  if (name) {
    prefill.name = name;
  }

  // Only set contact when profile has a real phone — omit entirely otherwise
  const contact = normalizeRazorpayContact(user.phone);
  if (contact) {
    prefill.contact = contact;
  }

  return prefill;
}

/** Lock prefill fields in checkout only when we actually sent them. */
export function buildRazorpayReadonly(
  prefill: RazorpayPrefill
): RazorpayReadonlyFields | undefined {
  const readonly: RazorpayReadonlyFields = {};
  if (prefill.email) readonly.email = true;
  if (prefill.contact) readonly.contact = true;
  return Object.keys(readonly).length > 0 ? readonly : undefined;
}

/** Digits-only phone suitable for Razorpay `prefill.contact` (10-digit IN or E.164 without +). */
export function normalizeRazorpayContact(
  phone: string | null | undefined
): string | undefined {
  if (!phone?.trim()) return undefined;

  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  // +91xxxxxxxxxx → 10-digit local (Razorpay India checkout expects this often)
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (digits.length < 8 || digits.length > 15) {
    return undefined;
  }

  // Skip obvious placeholders / demo numbers (do not send to Razorpay)
  if (/^(\d)\1{7,}$/.test(digits)) return undefined;
  if (/^555\d{7}$/.test(digits)) return undefined;

  return digits;
}
