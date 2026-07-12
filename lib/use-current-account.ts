"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { ensureCurrentProfile } from "@/lib/supabase-data";

type AccountProfile = {
  id: string;
  handle: string;
  fullName: string;
};

type AccountState =
  | { status: "demo"; profile: null }
  | { status: "loading"; profile: null }
  | { status: "signed-out"; profile: null }
  | { status: "signed-in"; profile: AccountProfile }
  | { status: "error"; profile: null; message: string };

export function useCurrentAccount() {
  const [state, setState] = useState<AccountState>(() =>
    isSupabaseConfigured() ? { status: "loading", profile: null } : { status: "demo", profile: null }
  );

  const refresh = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setState({ status: "demo", profile: null });
      return;
    }

    try {
      const { user, profile } = await ensureCurrentProfile(client);
      if (!user) {
        setState({ status: "signed-out", profile: null });
        return;
      }

      setState({
        status: "signed-in",
        profile: {
          id: user.id,
          handle: profile?.handle ?? user.email?.split("@")[0] ?? user.id.slice(0, 8),
          fullName: profile?.full_name ?? user.email ?? "Jamly"
        }
      });
    } catch (error) {
      setState({
        status: "error",
        profile: null,
        message: error instanceof Error ? error.message : "Account could not be loaded."
      });
    }
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    void refresh();

    const { data } = client.auth.onAuthStateChange(() => {
      if (active) void refresh();
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
