import { createHash } from "node:crypto";
import {
  consumeRateLimit,
  createServiceClient,
  identityFromRequest,
  rateLimitResponse,
  rateLimitRules
} from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const rate = await consumeRateLimit(rateLimitRules.waitlistVerify, identityFromRequest(request));
  if (!rate.allowed) return rateLimitResponse(rate);

  let token = "";
  try {
    const body = (await request.json()) as { token?: string };
    token = String(body.token ?? "").trim();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400, headers: noStore });
  }

  if (token.length < 16 || token.length > 256) {
    return Response.json(
      { error: "invalid_token", message: "This verification link is not valid." },
      { status: 400, headers: noStore }
    );
  }

  const client = createServiceClient();
  if (!client) {
    return Response.json(
      { error: "not_configured", message: "Verification is unavailable in this environment." },
      { status: 503, headers: noStore }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await client.rpc("verify_waitlist_entry", { p_token_hash: tokenHash });

  if (error) {
    // Do not distinguish "unknown token" from "already used" to the caller.
    return Response.json(
      { error: "invalid_token", message: "This verification link is not valid or has expired." },
      { status: 400, headers: noStore }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return Response.json(
      { error: "invalid_token", message: "This verification link is not valid or has expired." },
      { status: 400, headers: noStore }
    );
  }

  return Response.json(
    {
      ok: true,
      queuePosition: Number(row.queue_position),
      referralCode: row.referral_code
    },
    { headers: noStore }
  );
}
