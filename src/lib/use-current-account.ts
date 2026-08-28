"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { ensureCurrentProfile } from "@/lib/supabase-data";
import type { AccountAccessProfile } from "@/lib/account-access";

type AccountState =
  | { status: "demo"; profile: null }
  | { status: "loading"; profile: null }
  | { status: "signed-out"; profile: null }
  | { status: "signed-in"; profile: AccountAccessProfile }
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
      const { user } = await ensureCurrentProfile(client);
      if (!user) {
        setState({ status: "signed-out", profile: null });
        return;
      }

      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setState({ status: "signed-out", profile: null });
        return;
      }

      const response = await fetch("/api/account/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (response.status === 401) {
        await client.auth.signOut({ scope: "local" }).catch(() => undefined);
        setState({ status: "signed-out", profile: null });
        return;
      }
      if (!response.ok) throw new Error("Account status could not be loaded.");

      const body = (await response.json()) as { account?: AccountAccessProfile };
      if (!body.account) throw new Error("Account status could not be loaded.");

      setState({
        status: "signed-in",
        profile: body.account
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
