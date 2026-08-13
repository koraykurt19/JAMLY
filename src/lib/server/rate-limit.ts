import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Rate limiting backed by Postgres.
 *
 * Serverless functions do not share memory, so an in-process counter cannot
 * enforce a global limit. The counter lives in the database and is incremented
 * atomically by `consume_rate_limit`.
 *
 * Production behaviour is fail-closed: if the limiter itself is unavailable we
 * reject rather than silently allow unbounded traffic. Development stays
 * permissive so a missing local database does not block work.
 */

export type RateLimitRule = {
  bucket: string;
  limit: number;
  windowSeconds: number;
};

export const rateLimitRules = {
  waitlistJoin: { bucket: "waitlist:join", limit: 5, windowSeconds: 3600 },
  waitlistVerify: { bucket: "waitlist:verify", limit: 10, windowSeconds: 3600 },
  waitlistStats: { bucket: "waitlist:stats", limit: 120, windowSeconds: 60 },
  reportCreate: { bucket: "report:create", limit: 5, windowSeconds: 3600 },
  supportTicket: { bucket: "support:create", limit: 5, windowSeconds: 3600 },
  adminMutation: { bucket: "admin:mutation", limit: 60, windowSeconds: 60 },
  exchangeRate: { bucket: "public:exchange-rate", limit: 60, windowSeconds: 60 }
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const IP_SALT = process.env.RATE_LIMIT_SALT?.trim() || "jamly-local-development-salt";

/**
 * Hashes the caller identity so the limiter never stores a raw IP address.
 * Falls back to a per-process random value when no IP header is present, which
 * makes an unidentifiable caller cheap to rate limit but impossible to track.
 */
export function identityFromRequest(request: Request, extra?: string) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || realIp.trim();
  const basis = ip || `anonymous:${randomBytes(8).toString("hex")}`;
  return hashIdentity(extra ? `${basis}|${extra}` : basis);
}

export function hashIdentity(value: string) {
  return createHash("sha256").update(`${IP_SALT}:${value}`).digest("hex").slice(0, 48);
}

export async function consumeRateLimit(
  rule: RateLimitRule,
  identity: string
): Promise<RateLimitResult> {
  const client = createServiceClient();

  if (!client) {
    // Supabase is absent entirely — the app is running in demo mode and there
    // is no persisted data behind these endpoints to protect. Allowing here is
    // not a bypass; the write paths themselves refuse to run without a database.
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
  }

  const { data, error } = await client.rpc("consume_rate_limit", {
    p_bucket: rule.bucket,
    p_identity: identity,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds
  });

  if (error) {
    // Supabase IS configured but the limiter failed: there is real data behind
    // this endpoint and no working limit, so fail closed in production.
    console.error("rate_limit_unavailable", { bucket: rule.bucket, message: error.message });
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, remaining: 0, retryAfterSeconds: 30 };
    }
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    remaining: Number(row?.remaining ?? 0),
    retryAfterSeconds: Number(row?.retry_after_seconds ?? 0)
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return Response.json(
    {
      error: "rate_limited",
      message: "Too many requests. Please try again shortly."
    },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.max(result.retryAfterSeconds, 1))
      }
    }
  );
}

/**
 * Anon-key client used for RPCs that are security-definer and safe to call
 * without a user session (rate limiting, public waitlist counters).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  return createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
