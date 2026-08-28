import { createHash, randomBytes } from "node:crypto";
import {
  consumeRateLimit,
  createServiceClient,
  hashIdentity,
  identityFromRequest,
  rateLimitResponse,
  rateLimitRules
} from "@/lib/server/rate-limit";
import {
  normalizeEmail,
  normalizeReferralCode,
  normalizeUsername,
  sanitizeLaunchSignal,
  validateWaitlistSubmission,
  type WaitlistPersona,
  type WaitlistSubmission
} from "@/lib/waitlist";
import { queueWaitlistVerificationEmail } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Public counter for the launch page. Aggregates only — never row data. */
export async function GET(request: Request) {
  const rate = await consumeRateLimit(rateLimitRules.waitlistStats, identityFromRequest(request));
  if (!rate.allowed) return rateLimitResponse(rate);

  const client = createServiceClient();
  if (!client) {
    return Response.json(
      { configured: false, total: 0, verified: 0, creators: 0 },
      { headers: noStore }
    );
  }

  const { data, error } = await client.rpc("get_waitlist_stats");
  if (error) {
    return Response.json(
      { configured: false, total: 0, verified: 0, creators: 0 },
      { headers: noStore }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  return Response.json(
    {
      configured: true,
      total: Number(row?.total_count ?? 0),
      verified: Number(row?.verified_count ?? 0),
      creators: Number(row?.creator_count ?? 0)
    },
    { headers: noStore }
  );
}

export async function POST(request: Request) {
  let payload: Partial<WaitlistSubmission>;
  try {
    payload = (await request.json()) as Partial<WaitlistSubmission>;
  } catch {
    return Response.json(
      { error: "invalid_body", message: "Request body must be JSON." },
      { status: 400, headers: noStore }
    );
  }

  const email = normalizeEmail(String(payload.email ?? ""));

  // Two limits: one per caller, one per address, so rotating IPs cannot hammer
  // a single mailbox and a single IP cannot enumerate many addresses.
  const ipIdentity = identityFromRequest(request);
  const emailIdentity = hashIdentity(`email:${email}`);

  for (const identity of [ipIdentity, emailIdentity]) {
    const rate = await consumeRateLimit(rateLimitRules.waitlistJoin, identity);
    if (!rate.allowed) return rateLimitResponse(rate);
  }

  const submission: WaitlistSubmission = {
    email,
    displayName: payload.displayName?.trim() || undefined,
    reservedUsername: payload.reservedUsername
      ? normalizeUsername(payload.reservedUsername)
      : undefined,
    persona: (payload.persona ?? "both") as WaitlistPersona,
    interests: Array.isArray(payload.interests) ? payload.interests.slice(0, 8) : [],
    locale: payload.locale === "en" ? "en" : "tr",
    referralCode: normalizeReferralCode(payload.referralCode),
    acceptedTerms: Boolean(payload.acceptedTerms),
    marketingOptIn: Boolean(payload.marketingOptIn),
    utm: payload.utm,
    launchSignal: sanitizeLaunchSignal(payload.launchSignal)
  };

  const errors = validateWaitlistSubmission(submission);
  if (errors.length > 0) {
    return Response.json(
      { error: "validation_failed", fields: errors },
      { status: 422, headers: noStore }
    );
  }

  const client = createServiceClient();
  if (!client) {
    return Response.json(
      {
        error: "not_configured",
        message: "The waitlist is not available in this environment."
      },
      { status: 503, headers: noStore }
    );
  }

  // The raw token goes in the email; only its hash is stored, so a database
  // leak cannot be used to verify someone else's address.
  const verificationToken = randomBytes(32).toString("base64url");
  const verificationTokenHash = createHash("sha256").update(verificationToken).digest("hex");

  const { data, error } = await client.rpc("join_waitlist", {
    p_email: submission.email,
    p_display_name: submission.displayName ?? null,
    p_reserved_username: submission.reservedUsername ?? null,
    p_persona: submission.persona,
    p_interests: submission.interests,
    p_locale: submission.locale,
    p_referral_code: submission.referralCode ?? null,
    p_utm: submission.utm ?? {},
    p_accepted_terms: submission.acceptedTerms,
    p_marketing_opt_in: submission.marketingOptIn,
    p_verification_token_hash: verificationTokenHash,
    p_ip_hash: ipIdentity,
    p_launch_signal: submission.launchSignal ?? {}
  });

  if (error) {
    if (error.message.includes("already reserved")) {
      return Response.json(
        { error: "username_taken", fields: [{ field: "reservedUsername", code: "taken" }] },
        { status: 409, headers: noStore }
      );
    }
    console.error("waitlist_join_failed", { message: error.message });
    return Response.json(
      { error: "join_failed", message: "We could not add you to the waitlist." },
      { status: 500, headers: noStore }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return Response.json(
      { error: "join_failed", message: "We could not add you to the waitlist." },
      { status: 500, headers: noStore }
    );
  }

  if (!row.already_registered) {
    await queueWaitlistVerificationEmail({
      email: submission.email,
      locale: submission.locale,
      token: verificationToken,
      queuePosition: Number(row.queue_position),
      referralCode: row.referral_code
    });
  }

  return Response.json(
    {
      ok: true,
      alreadyRegistered: Boolean(row.already_registered),
      queuePosition: Number(row.queue_position),
      referralCode: row.referral_code,
      status: row.status
    },
    { status: row.already_registered ? 200 : 201, headers: noStore }
  );
}
