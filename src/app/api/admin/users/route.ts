import {
  adminErrorResponse,
  noStoreHeaders,
  requireAdmin,
  sanitizeSearch
} from "@/lib/server/admin";

export const dynamic = "force-dynamic";

const accountStatuses = ["active", "suspended", "banned"] as const;
type AccountStatus = (typeof accountStatuses)[number];

export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const url = new URL(request.url);
    const search = sanitizeSearch(url.searchParams.get("q"));
    const status = url.searchParams.get("status")?.trim() ?? "";

    let query = client
      .from("profiles")
      .select("id, role, handle, full_name, headline, location, account_status, created_at")
      .order("created_at", { ascending: false })
      .limit(80);

    if (isAccountStatus(status)) {
      query = query.eq("account_status", status);
    }

    if (search) {
      query = query.or(`handle.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const [{ data: users, error: usersError }, { data: admins, error: adminsError }] =
      await Promise.all([
        query,
        client.from("admin_accounts").select("user_id, role, is_active")
      ]);

    if (usersError) throw usersError;
    if (adminsError) throw adminsError;

    const adminById = new Map((admins ?? []).map((admin) => [admin.user_id, admin]));
    const betaAllowedHandles = hostList(process.env.JAMLY_BETA_ALLOWED_HANDLES, [
      "koraykurt",
      "hakanefe"
    ]);

    return Response.json(
      {
        users: (users ?? []).map((user) => ({
          id: user.id,
          role: user.role,
          handle: user.handle,
          fullName: user.full_name,
          headline: user.headline,
          location: user.location,
          status: user.account_status,
          adminRole: adminById.get(user.id)?.role ?? null,
          isAdmin: adminById.get(user.id)?.is_active === true,
          isBetaHandleAllowed: betaAllowedHandles.has(String(user.handle ?? "").toLowerCase()),
          isBetaAllowed:
            user.account_status === "active" &&
            (adminById.get(user.id)?.is_active === true ||
              betaAllowedHandles.has(String(user.handle ?? "").toLowerCase())),
          createdAt: user.created_at
        }))
      },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

function isAccountStatus(value: string): value is AccountStatus {
  return (accountStatuses as readonly string[]).includes(value);
}

function hostList(value: string | undefined, fallback: string[]) {
  return new Set(
    (value?.split(",") ?? fallback)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}
