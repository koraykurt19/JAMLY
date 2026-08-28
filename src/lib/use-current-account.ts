"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { betaAllowedHandleSet } from "@/lib/beta-access";
import { ensureCurrentProfile } from "@/lib/supabase-data";

type AccountProfile = {
  id: string;
  handle: string;
  fullName: string;
  isAdmin: boolean;
  adminRole: string | null;
  accountStatus: "active" | "suspended" | "banned";
  isBetaAllowed: boolean;
  retentionPlan: "standard" | "premium";
  retentionMultiplier: number;
};

type AccountState =
  | { status: "demo"; profile: null }
  | { status: "loading"; profile: null }
  | { status: "signed-out"; profile: null }
  | { status: "signed-in"; profile: AccountProfile }
  | { status: "error"; profile: null; message: string };

export function useCurrentAccount() {
  const refreshInFlightRef = useRef(false);
  const [state, setState] = useState<AccountState>(() =>
    isSupabaseConfigured() ? { status: "loading", profile: null } : { status: "demo", profile: null }
  );

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    const client = getSupabaseBrowserClient();
    if (!client) {
      setState({ status: "demo", profile: null });
      return;
    }

    refreshInFlightRef.current = true;
    try {
      const { user, profile } = await ensureCurrentProfile(client);
      if (!user) {
        setState({ status: "signed-out", profile: null });
        return;
      }

      const [{ data: isAdmin }, { data: adminRole }, retention, betaAccess] = await Promise.all([
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
      if (retention.error) throw new Error(retention.error.message);
      if (betaAccess.error) throw new Error(betaAccess.error.message);
      const accountStatus = profile?.account_status ?? "active";
      const handle = profile?.handle ?? user.email?.split("@")[0] ?? user.id.slice(0, 8);
      const allowedHandles = betaAllowedHandleSet(process.env.NEXT_PUBLIC_BETA_ALLOWED_HANDLES);
      const retentionPlan =
        retention.data?.plan === "premium" || retention.data?.plan === "standard"
          ? retention.data.plan
          : "standard";

      setState({
        status: "signed-in",
        profile: {
          id: user.id,
          handle,
          fullName: profile?.full_name ?? user.email ?? "Jamly",
          isAdmin: Boolean(isAdmin),
          adminRole: adminRole ?? null,
          accountStatus,
          isBetaAllowed:
            accountStatus === "active" &&
            (Boolean(isAdmin) ||
              betaAccess.data?.is_active === true ||
              allowedHandles.has(handle.toLowerCase())),
          retentionPlan,
          retentionMultiplier: Number(retention.data?.retention_multiplier ?? 1)
        }
      });
    } catch (error) {
      if (isInvalidSession(error)) {
        await client.auth.signOut({ scope: "local" }).catch(() => undefined);
        setState({ status: "signed-out", profile: null });
        return;
      }

      setState({
        status: "error",
        profile: null,
        message: isSupabaseRecoverableError(error)
          ? "Account connection is temporarily unavailable."
          : error instanceof Error
            ? error.message
            : "Account could not be loaded."
      });
    } finally {
      refreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    void refresh();

    const { data } = client.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (active) void refresh();
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    await client.auth.signOut();
    setState({ status: "signed-out", profile: null });
  }, []);

  return { state, refresh, signOut };
}

function isInvalidSession(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return (
    normalized.includes("auth session missing") ||
    normalized.includes("jwt") ||
    normalized.includes("refresh token") ||
    normalized.includes("invalid claim")
  );
}
