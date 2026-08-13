"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ListingEditorForm } from "@/components/listing-editor-form";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { fetchListing, getCurrentProfile } from "@/lib/supabase-data";
import type { Listing } from "@/lib/types";

type PageState =
  | { status: "loading" }
  | { status: "ready"; listing: Listing; isDemo: boolean }
  | { status: "error"; message: string };

export default function CreatorListingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isSupabaseConfigured()) {
        if (active) setState({ status: "error", message: "İlan düzenleme demo modunda kullanılamaz." });
        return;
      }
      const client = getSupabaseBrowserClient();
      if (!client) {
        if (active) setState({ status: "error", message: "Supabase bağlantısı kurulamadı." });
        return;
      }
      try {
        const [{ user }, listing] = await Promise.all([getCurrentProfile(client), fetchListing(client, id)]);
        if (!user) throw new Error("Bu ilanı düzenlemek için giriş yapmalısınız.");
        if (!listing) throw new Error("İlan bulunamadı.");
        if (listing.creatorId !== user.id) throw new Error("Bu ilanı düzenleme yetkiniz yok.");
        if (active) setState({ status: "ready", listing, isDemo: false });
      } catch (error) {
        if (active) setState({ status: "error", message: error instanceof Error ? error.message : "İlan yüklenemedi." });
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  return <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8"><Link href="/dashboard/creator" className="focus-ring inline-flex rounded-md text-sm font-semibold text-white/64 transition hover:text-white">← Üretici paneline dön</Link>{state.status === "loading" ? <p className="mt-8 text-sm text-white/52">İlan yükleniyor...</p> : null}{state.status === "error" ? <div className="mt-8 rounded-lg border border-rose-400/25 bg-rose-400/10 p-5"><h1 className="text-xl font-semibold text-white">İlan düzenleyici açılamadı</h1><p className="mt-2 text-sm leading-6 text-white/64">{state.message}</p></div> : null}{state.status === "ready" ? <div className="mt-7"><ListingEditorForm listing={state.listing} isDemo={state.isDemo} /></div> : null}</main>;
}
