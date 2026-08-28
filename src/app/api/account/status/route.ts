import { createClient } from "@supabase/supabase-js";
import { resolveBetaAccess, type AccountAccessProfile } from "@/lib/account-access";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return Response.json({ error: "missing_token" }, { status: 401, headers: noStore });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return Response.json({ error: "supabase_not_configured" }, { status: 503, headers: noStore });
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
    return Response.json({ error: "invalid_token" }, { status: 401, headers: noStore });
  }

  const [{ data: profile, error: profileError }, { data: isAdmin }, { data: adminRole }, retention, betaAccess] =
    await Promise.all([
      client
        .from("profiles")
        .select("id, handle, full_name, account_status")
        .eq("id", user.id)
        .maybeSingle(),
      client.rpc("is_current_user_admin"),
      client.rpc("current_admin_role"),
      client
        .from("profile_retention_settings")
        .select("plan, retention_multiplier")
        .eq("profile_id", user.id)
        .maybeSingle(),
      client
        .from("profile_beta_access")
        .select("is_active")
        .eq("profile_id", user.id)
        .maybeSingle()
    ]);

  if (profileError) return Response.json({ error: "profile_failed" }, { status: 500, headers: noStore });
  if (retention.error) return Response.json({ error: "retention_failed" }, { status: 500, headers: noStore });
  if (betaAccess.error) return Response.json({ error: "beta_access_failed" }, { status: 500, headers: noStore });

  const handle = profile?.handle ?? user.email?.split("@")[0] ?? user.id.slice(0, 8);
  const accountStatus = normalizeAccountStatus(profile?.account_status);
  const isBetaDirectAllowed = betaAccess.data?.is_active === true;
  const access = resolveBetaAccess({
    accountStatus,
    handle,
    isAdmin: Boolean(isAdmin),
    isBetaDirectAllowed,
    allowedHandlesCsv: process.env.JAMLY_BETA_ALLOWED_HANDLES
  });
  const retentionPlan = retention.data?.plan === "premium" ? "premium" : "standard";

  const account: AccountAccessProfile = {
    id: user.id,
    handle,
    fullName: profile?.full_name ?? user.email ?? "Jamly",
    isAdmin: Boolean(isAdmin),
    adminRole: typeof adminRole === "string" ? adminRole : null,
    accountStatus,
    isBetaHandleAllowed: access.isBetaHandleAllowed,
    isBetaDirectAllowed,
    isBetaAllowed: access.isBetaAllowed,
    retentionPlan,
    retentionMultiplier: Number(retention.data?.retention_multiplier ?? 1)
  };

  return Response.json({ account }, { headers: noStore });
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
}

function normalizeAccountStatus(value: unknown): "active" | "suspended" | "banned" {
  if (value === "suspended" || value === "banned") return value;
  return "active";
}
