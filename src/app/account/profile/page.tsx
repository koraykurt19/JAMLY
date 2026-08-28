"use client";

import Link from "next/link";
import { AlertCircle, ArrowUpRight, CheckCircle2, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CreatorProfileEditor } from "@/components/creator-profile-editor";
import { useI18n } from "@/components/language-provider";
import { creators } from "@/lib/data";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import {
  ensureCurrentProfile,
  fetchActiveCreatorListingCount,
  fetchCreator
} from "@/lib/supabase-data";
import { profileReadiness, type ProfileReadiness } from "@/lib/profile-readiness";
import type { Creator } from "@/lib/types";

type PageState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; creator: Creator; activeListingCount: number; isDemo: boolean };

export default function ProfileSettingsPage() {
  const { language } = useI18n();
  const [state, setState] = useState<PageState>(() => {
    if (!isSupabaseConfigured()) {
      return { status: "ready", creator: creators[0], activeListingCount: 1, isDemo: true };
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

      const [creator, activeListingCount] = await Promise.all([
        fetchCreator(client, user.id),
        fetchActiveCreatorListingCount(client, user.id)
      ]);
      if (!creator) throw new Error("Profile could not be loaded.");
      setState({ status: "ready", creator, activeListingCount, isDemo: false });
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

      <ProfileReadinessPanel
        readiness={profileReadinessFromCreator(state.creator, state.activeListingCount)}
        language={language}
      />

      <CreatorProfileEditor
        creator={state.creator}
        isDemo={state.isDemo}
        onSaved={() => void loadProfile()}
      />
    </section>
  );
}

function ProfileReadinessPanel({
  readiness,
  language
}: {
  readiness: ProfileReadiness;
  language: "tr" | "en";
}) {
  const tr = language === "tr";
  const title =
    readiness.level === "launch_ready"
      ? tr
        ? "Launch-ready profil"
        : "Launch-ready profile"
      : readiness.level === "ready"
        ? tr
          ? "Profil hazir"
          : "Profile ready"
        : readiness.level === "started"
          ? tr
            ? "Profil baslatildi"
            : "Profile started"
          : tr
            ? "Profil bos"
            : "Profile empty";

  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-jam-blue">
            <ShieldCheck size={15} />
            {tr ? "Profil hazirlik" : "Profile readiness"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            {tr
              ? "Beta ve marketplace kullanimi icin profil guven sinyallerini tamamla."
              : "Complete trust signals for beta and marketplace use."}
          </p>
        </div>
        <div className="w-full max-w-xs shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-white/58">{tr ? "Skor" : "Score"}</span>
            <span className="font-bold tabular-nums text-jam-mint">{readiness.score}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-jam-mint" style={{ width: `${readiness.score}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {readiness.checks.map((check) => (
          <div
            key={check.key}
            className={
              check.passed
                ? "flex items-center gap-2 rounded-md border border-jam-mint/18 bg-jam-mint/[0.055] px-3 py-2 text-sm font-semibold text-jam-mint"
                : "flex items-center gap-2 rounded-md border border-white/8 bg-black/20 px-3 py-2 text-sm font-semibold text-white/50"
            }
          >
            <CheckCircle2 size={15} />
            {readinessLabel(check.key, language)}
          </div>
        ))}
      </div>
    </section>
  );
}

function profileReadinessFromCreator(creator: Creator, activeListingCount: number) {
  return profileReadiness({
    role: creator.role,
    handle: creator.handle,
    fullName: creator.name,
    headline: creator.headline,
    bio: creator.about,
    avatarUrl: creator.avatarUrl,
    coverUrl: creator.coverUrl,
    location: creator.location,
    specialties: creator.specialties,
    socialLinkCount: creator.socialLinks.length,
    activeListingCount
  });
}

function readinessLabel(key: ProfileReadiness["checks"][number]["key"], language: "tr" | "en") {
  if (language === "en") {
    return {
      identity: "Identity",
      headline: "Headline",
      bio: "Bio depth",
      avatar: "Avatar",
      cover: "Cover",
      specialties: "Specialties",
      social: "Social proof",
      creator_listing: "Active listing"
    }[key];
  }
  return {
    identity: "Kimlik",
    headline: "Baslik",
    bio: "Bio derinligi",
    avatar: "Avatar",
    cover: "Kapak",
    specialties: "Uzmanlik",
    social: "Sosyal kanit",
    creator_listing: "Aktif ilan"
  }[key];
}

function isMissingOrInvalidSession(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return normalized.includes("auth session missing") || normalized.includes("jwt");
}
