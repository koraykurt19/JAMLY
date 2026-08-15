import { createServiceClient } from "@/lib/server/rate-limit";
import { JAMLY_EMAILS } from "@/lib/jamly-contacts";

/**
 * Outbound email.
 *
 * There is no provider configured yet, so nothing is transmitted. Messages are
 * rendered and written to `email_outbox`; a worker drains the queue once
 * EMAIL_PROVIDER_API_KEY exists. Wiring a provider means implementing
 * `deliver()` below — every call site and template stays unchanged.
 *
 * In development the rendered message is logged so the verification link is
 * reachable without a mail server.
 */

export type EmailTemplate =
  | "waitlist_verification"
  | "waitlist_welcome"
  | "waitlist_invite"
  | "badge_earned";

type EnqueueInput = {
  template: EmailTemplate;
  to: string;
  locale: "tr" | "en";
  subject: string;
  payload: Record<string, unknown>;
  kind?: "transactional" | "marketing";
};

export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/^/, "https://") ||
    "http://localhost:3000"
  );
}

export function emailSender() {
  return process.env.EMAIL_FROM_ADDRESS?.trim() || JAMLY_EMAILS.noreply;
}

export function emailReplyTo() {
  return process.env.EMAIL_REPLY_TO_ADDRESS?.trim() || JAMLY_EMAILS.support;
}

export async function enqueueEmail(input: EnqueueInput) {
  const client = createServiceClient();

  if (!client) {
    logRenderedEmail(input);
    return { queued: false as const, reason: "not_configured" as const };
  }

  const { data, error } = await client.rpc("enqueue_email", {
    p_template: input.template,
    p_to_email: input.to,
    p_subject: input.subject,
    p_payload: input.payload,
    p_locale: input.locale,
    p_kind: input.kind ?? "transactional"
  });

  if (error) {
    // A failed notification must never fail the user's action.
    console.error("email_enqueue_failed", { template: input.template, message: error.message });
    logRenderedEmail(input);
    return { queued: false as const, reason: "enqueue_failed" as const };
  }

  logRenderedEmail(input);
  return { queued: true as const, id: data as unknown as string };
}

const verificationCopy = {
  tr: {
    subject: "Jamly erken kaydını doğrula",
    heading: "Erken kaydını doğrula"
  },
  en: {
    subject: "Confirm your Jamly early access",
    heading: "Confirm your early access"
  }
} as const;

export async function queueWaitlistVerificationEmail(input: {
  email: string;
  locale: "tr" | "en";
  token: string;
  queuePosition: number;
  referralCode: string;
}) {
  const copy = verificationCopy[input.locale];
  const verifyUrl = `${siteOrigin()}/early-access/verify?token=${encodeURIComponent(input.token)}`;

  return enqueueEmail({
    template: "waitlist_verification",
    to: input.email,
    locale: input.locale,
    subject: copy.subject,
    payload: {
      heading: copy.heading,
      verifyUrl,
      queuePosition: input.queuePosition,
      referralCode: input.referralCode
    }
  });
}

function logRenderedEmail(input: EnqueueInput) {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    `\n[email:${input.template}] -> ${input.to}\n  subject: ${input.subject}\n  payload: ${JSON.stringify(
      input.payload,
      null,
      2
    )}\n`
  );
}
