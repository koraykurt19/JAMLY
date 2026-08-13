import { adminErrorResponse, assertUuid, noStoreHeaders, requireCapability } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { client } = await requireCapability(request, "badge.manage");

    const [definitions, recent] = await Promise.all([
      client
        .from("badge_definitions")
        .select(
          "key,name_tr,name_en,category,rarity,icon,tone,award_source,revocable,permanent,is_active,display_order"
        )
        .order("display_order", { ascending: true }),
      client
        .from("badge_awards")
        .select("id,profile_id,badge_key,source,award_reason,awarded_at,revoked_at")
        .order("awarded_at", { ascending: false })
        .limit(50)
    ]);

    if (definitions.error) throw new Error(definitions.error.message);
    if (recent.error) throw new Error(recent.error.message);

    return Response.json(
      { definitions: definitions.data ?? [], recentAwards: recent.data ?? [] },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

/** Manual grant or revoke. Both paths are audited by the database RPCs. */
export async function POST(request: Request) {
  try {
    const { client } = await requireCapability(request, "badge.manage");
    const body = (await request.json().catch(() => null)) as {
      action?: "grant" | "revoke";
      profileId?: string;
      badgeKey?: string;
      reason?: string;
    } | null;

    const profileId = String(body?.profileId ?? "");
    assertUuid(profileId, "profileId");

    const badgeKey = String(body?.badgeKey ?? "");
    if (!/^[a-z][a-z0-9_]{2,47}$/.test(badgeKey)) {
      return Response.json(
        { error: "invalid_badge", message: "Unknown badge key." },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    if (body?.action === "revoke") {
      const reason = String(body.reason ?? "").trim();
      if (reason.length < 3) {
        return Response.json(
          { error: "reason_required", message: "A revoke reason is required." },
          { status: 422, headers: noStoreHeaders() }
        );
      }

      const { error } = await client.rpc("revoke_badge", {
        p_profile_id: profileId,
        p_badge_key: badgeKey,
        p_reason: reason
      });
      if (error) throw new Error(error.message);

      await client.rpc("record_admin_action", {
        p_action: "badge.revoke",
        p_target_type: "profile",
        p_target_id: profileId,
        p_reason: reason,
        p_after: { badge_key: badgeKey }
      });

      return Response.json({ ok: true }, { headers: noStoreHeaders() });
    }

    const { data, error } = await client.rpc("grant_badge", {
      p_profile_id: profileId,
      p_badge_key: badgeKey,
      p_reason: body?.reason ?? null,
      p_source: "manual"
    });
    if (error) throw new Error(error.message);

    await client.rpc("record_admin_action", {
      p_action: "badge.grant",
      p_target_type: "profile",
      p_target_id: profileId,
      p_reason: body?.reason ?? null,
      p_after: { badge_key: badgeKey }
    });

    return Response.json({ ok: true, awardId: data }, { headers: noStoreHeaders() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
