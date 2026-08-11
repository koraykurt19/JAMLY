"use client";

import Link from "next/link";
import { AlertCircle, ArrowUpRight, Loader2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CreatorProfileEditor } from "@/components/creator-profile-editor";
import { useI18n } from "@/components/language-provider";
import { creators } from "@/lib/data";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { ensureCurrentProfile, fetchCreator } from "@/lib/supabase-data";
import type { Creator } from "@/lib/types";

type PageState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; creator: Creator; isDemo: boolean };

export default function ProfileSettingsPage() {
  const { language } = useI18n();
  const [state, setState] = useState<PageState>(() => {
    if (!isSupabaseConfigured()) {
      return { status: "ready", creator: creators[0], isDemo: true };
    }
    return { status: "loading" };
  });

  const loadProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setState({ status: "loading" });
    try {
      const { user } = await ensureCurrentProfile(client);
      if (!user) {
        setState({ status: "signed-out" });
        return;
      }

      const creator = await fetchCreator(client, user.id);
      if (!creator) throw new Error("Profile could not be loaded.");
      setState({ status: "ready", creator, isDemo: false });
    } catch (error) {
      if (isMissingOrInvalidSession(error)) {
        await client.auth.signOut({ scope: "local" });
        setState({ status: "signed-out" });
        return;
      }

      setState({
        status: "error",
        message: isSupabaseRecoverableError(error)
          ? language === "tr"
            ? "Supabase bağlantısı doğrulanamadı. Lütfen yeniden giriş yapın."
            : "Supabase connection could not be verified. Please sign in again."
          : error instanceof Error
            ? error.message
            : language === "tr"
              ? "Profil yüklenemedi."
              : "Profile could not be loaded."
      });
    }
  }, [language]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (state.status !== "ready") {
    const loading = state.status === "loading";
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-16 text-center">
        <div>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-jam-blue/20 bg-jam-blue/10 text-jam-blue">
            {loading ? <Loader2 className="animate-spin" /> : <AlertCircle />}
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-white">
            {loading
              ? language === "tr"
                ? "Pro Page yükleniyor"
                : "Loading Pro Page"
              : state.status === "signed-out"
                ? language === "tr"
                  ? "Önce giriş yapın"
                  : "Sign in first"
                : language === "tr"
                  ? "Profil yüklenemedi"
                  : "Profile could not be loaded"}
          </h1>
          {state.status === "error" ? (
            <p className="mt-3 text-sm text-white/52">{state.message}</p>
          ) : null}
          {state.status === "signed-out" ? (
            <Link
              href="/auth/sign-in?next=%2Faccount%2Fprofile"
              className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-full bg-jam-blue px-5 text-sm font-bold text-white hover:bg-jam-mint hover:text-black"
            >
              {language === "tr" ? "Giriş yap" : "Sign in"}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-jam-blue">
            <UserRound size={18} />
            <p className="text-xs font-bold uppercase tracking-[0.24em]">
              {language === "tr" ? "Storefront yönetimi" : "Storefront management"}
            </p>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {language === "tr" ? "Pro Page'inizi düzenleyin" : "Edit your Pro Page"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/54">
            {language === "tr"
              ? "Kapak görselinizi, profil fotoğrafınızı, biyografinizi, uzmanlıklarınızı ve sosyal bağlantılarınızı tek vitrinde yönetin."
              : "Manage your cover, avatar, bio, specialties, and social links in one storefront."}
          </p>
        </div>
        <Link
          href={`/creators/${state.creator.handle}`}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/12 px-4 text-sm font-bold text-white/72 transition hover:border-jam-blue/45 hover:bg-jam-blue/10 hover:text-white"
        >
          {language === "tr" ? "Canlı profili gör" : "View live profile"}
          <ArrowUpRight size={17} />
        </Link>
      </div>

      <CreatorProfileEditor
        creator={state.creator}
        isDemo={state.isDemo}
        onSaved={() => void loadProfile()}
      />
    </section>
  );
}

function isMissingOrInvalidSession(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return normalized.includes("auth session missing") || normalized.includes("jwt");
}
