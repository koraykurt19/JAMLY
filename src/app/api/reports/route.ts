import { createClient } from "@supabase/supabase-js";
import {
  consumeRateLimit,
  identityFromRequest,
  rateLimitResponse,
  rateLimitRules
} from "@/lib/server/rate-limit";
import { defaultPriorityFor, validateReport, type ReportSubmission } from "@/lib/reports";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Report submission. Requires a signed-in reporter (anonymous reports are an
 * abuse vector with no recourse) and is rate limited per account and per IP.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    return Response.json(
      { error: "authentication_required", message: "Please sign in to submit a report." },
      { status: 401, headers: noStore }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return Response.json(
      { error: "not_configured", message: "Reporting is unavailable in this environment." },
      { status: 503, headers: noStore }
    );
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const {
    data: { user },
    error: userError
  } = await client.auth.getUser(token);

  if (userError || !user) {
    return Response.json(
      { error: "invalid_session", message: "Please sign in again." },
      { status: 401, headers: noStore }
    );
  }

  // Limit by account first: a determined reporter rotating IPs is the case
  // that actually matters for report spam.
  for (const identity of [`user:${user.id}`, identityFromRequest(request)]) {
    const rate = await consumeRateLimit(rateLimitRules.reportCreate, identity);
    if (!rate.allowed) return rateLimitResponse(rate);
  }

  let payload: Partial<ReportSubmission>;
  try {
    payload = (await request.json()) as Partial<ReportSubmission>;
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400, headers: noStore });
  }

  const submission: ReportSubmission = {
    targetType: payload.targetType as ReportSubmission["targetType"],
    targetId: String(payload.targetId ?? "").trim(),
    category: payload.category as ReportSubmission["category"],
    description: String(payload.description ?? "").trim()
  };

  const errors = validateReport(submission);
  if (errors.length > 0) {
    return Response.json(
      { error: "validation_failed", codes: errors },
      { status: 422, headers: noStore }
    );
  }

  const { error } = await client.from("reports").insert({
    reported_by: user.id,
    target_type: submission.targetType,
    target_id: submission.targetId,
    category: submission.category,
    reason: submission.description,
    priority: defaultPriorityFor(submission.category)
  });

  if (error) {
    console.error("report_insert_failed", { message: error.message });
    return Response.json(
      { error: "report_failed", message: "The report could not be submitted." },
      { status: 500, headers: noStore }
    );
  }

  return Response.json({ ok: true }, { status: 201, headers: noStore });
}
