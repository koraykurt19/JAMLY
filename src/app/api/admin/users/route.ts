import {
  adminErrorResponse,
  noStoreHeaders,
  requireAdmin,
  sanitizeSearch
} from "@/lib/server/admin";
import { betaAllowedHandleSet } from "@/lib/beta-access";
import { profileReadiness } from "@/lib/profile-readiness";
import { socialLinksFromRecord } from "@/lib/social-links";

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
      .select(
        "id, role, handle, full_name, headline, location, bio, avatar_url, cover_url, specialties, social_links, account_status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(80);

    if (isAccountStatus(status)) {
      query = query.eq("account_status", status);
    }

    if (search) {
      query = query.or(`handle.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const [
      { data: users, error: usersError },
      { data: admins, error: adminsError },
      { data: retentionSettings, error: retentionError },
      { data: betaAccessRows, error: betaAccessError },
      activeListingCounts
    ] =
      await Promise.all([
        query,
        client.from("admin_accounts").select("user_id, role, is_active"),
        client.from("profile_retention_settings").select("profile_id, plan, retention_multiplier"),
        client.from("profile_beta_access").select("profile_id, is_active"),
        getActiveListingCounts(client)
      ]);

    if (usersError) throw usersError;
    if (adminsError) throw adminsError;
    if (retentionError) throw retentionError;
    if (betaAccessError) throw betaAccessError;

    const adminById = new Map((admins ?? []).map((admin) => [admin.user_id, admin]));
    const retentionById = new Map(
      (retentionSettings ?? []).map((setting) => [setting.profile_id, setting])
    );
    const betaAccessById = new Map(
      (betaAccessRows ?? []).map((access) => [access.profile_id, access])
    );
    const betaAllowedHandles = betaAllowedHandleSet(process.env.JAMLY_BETA_ALLOWED_HANDLES);

    return Response.json(
      {
        users: (users ?? []).map((user) => {
          const retention = retentionById.get(user.id);
          const betaAccess = betaAccessById.get(user.id);
          const isAdmin = adminById.get(user.id)?.is_active === true;
          const isBetaHandleAllowed = betaAllowedHandles.has(String(user.handle ?? "").toLowerCase());
          const isBetaDirectAllowed = betaAccess?.is_active === true;
          const readiness = profileReadiness({
            role: user.role,
            handle: user.handle,
            fullName: user.full_name,
            headline: user.headline,
            bio: user.bio,
            avatarUrl: user.avatar_url,
            coverUrl: user.cover_url,
            location: user.location,
            specialties: user.specialties,
            socialLinkCount: socialLinksFromRecord(user.social_links).length,
            activeListingCount: activeListingCounts.get(user.id) ?? 0
          });
          return {
            id: user.id,
            role: user.role,
            handle: user.handle,
            fullName: user.full_name,
            headline: user.headline,
            location: user.location,
            status: user.account_status,
            adminRole: adminById.get(user.id)?.role ?? null,
            isAdmin,
            isBetaHandleAllowed,
            isBetaDirectAllowed,
            isBetaAllowed:
              user.account_status === "active" &&
              (isAdmin || isBetaDirectAllowed || isBetaHandleAllowed),
            retentionPlan: retention?.plan ?? "standard",
            retentionMultiplier: Number(retention?.retention_multiplier ?? 1),
            readiness: {
              score: readiness.score,
              level: readiness.level,
              missing: readiness.missing
            },
            createdAt: user.created_at
          };
        })
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

async function getActiveListingCounts(client: Awaited<ReturnType<typeof requireAdmin>>["client"]) {
  const { data, error } = await client.from("listings").select("creator_id").eq("is_active", true);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const listing of data ?? []) {
    counts.set(listing.creator_id, (counts.get(listing.creator_id) ?? 0) + 1);
  }
  return counts;
}
