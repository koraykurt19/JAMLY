/**
 * Shared waitlist domain rules. Imported by both the browser form and the API
 * route so validation cannot drift between the two.
 */

export const waitlistPersonas = ["creator", "buyer", "both"] as const;
export type WaitlistPersona = (typeof waitlistPersonas)[number];

export const waitlistInterests = [
  "beats",
  "mixing",
  "mastering",
  "songwriting",
  "vocals",
  "instruments",
  "cover_art",
  "collab"
] as const;
export type WaitlistInterest = (typeof waitlistInterests)[number];

export type WaitlistSubmission = {
  email: string;
  displayName?: string;
  reservedUsername?: string;
  persona: WaitlistPersona;
  interests: WaitlistInterest[];
  locale: "tr" | "en";
  referralCode?: string;
  acceptedTerms: boolean;
  marketingOptIn: boolean;
  utm?: Record<string, string | undefined>;
};

export type WaitlistFieldError = {
  field: keyof WaitlistSubmission | "form";
  code: string;
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "");
}

/** Referral codes are uppercase hex; anything else is discarded rather than rejected. */
export function normalizeReferralCode(value: string | null | undefined) {
  if (!value) return undefined;
  const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.length >= 6 && cleaned.length <= 16 ? cleaned : undefined;
}

export function validateWaitlistSubmission(input: WaitlistSubmission): WaitlistFieldError[] {
  const errors: WaitlistFieldError[] = [];
  const email = normalizeEmail(input.email ?? "");

  if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.push({ field: "email", code: "invalid_email" });
  }

  if (input.displayName && input.displayName.trim().length > 80) {
    errors.push({ field: "displayName", code: "display_name_too_long" });
  }

  if (input.reservedUsername) {
    const username = normalizeUsername(input.reservedUsername);
    if (!USERNAME_PATTERN.test(username)) {
      errors.push({ field: "reservedUsername", code: "invalid_username" });
    }
  }

  if (!waitlistPersonas.includes(input.persona)) {
    errors.push({ field: "persona", code: "invalid_persona" });
  }

  if (input.interests?.some((interest) => !waitlistInterests.includes(interest))) {
    errors.push({ field: "interests", code: "invalid_interest" });
  }

  if (!input.acceptedTerms) {
    errors.push({ field: "acceptedTerms", code: "terms_required" });
  }

  return errors;
}

/**
 * Founding-order label. Position is 1-indexed and assigned by the database, so
 * it is stable even if earlier entries are later removed.
 */
export function foundingTierFor(position: number) {
  if (position <= 100) return "first_100" as const;
  if (position <= 1000) return "first_1000" as const;
  return "community" as const;
}

export function buildReferralUrl(origin: string, code: string) {
  const url = new URL("/early-access", origin);
  url.searchParams.set("ref", code);
  return url.toString();
}

/** Attribution keys we accept from the query string, mapped to UTM names. */
export function extractUtm(params: URLSearchParams) {
  const utm: Record<string, string> = {};
  for (const key of ["source", "medium", "campaign", "content"] as const) {
    const value = params.get(`utm_${key}`);
    if (value && value.length <= 120) utm[key] = value;
  }
  return utm;
}
