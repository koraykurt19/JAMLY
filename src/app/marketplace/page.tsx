"use client";

import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { SectionHeading } from "@/components/section-heading";
import { useI18n } from "@/components/language-provider";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { listings } from "@/lib/data";
import { localizeListing } from "@/lib/i18n";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { fetchMarketplaceListings } from "@/lib/supabase-data";
import type { Listing } from "@/lib/types";

type MarketplaceState =
  | { status: "loading" }
  | { status: "ready"; listings: Listing[]; isDemo: boolean }
  | { status: "error"; message: string };

export default function MarketplacePage() {
  const { language, t } = useI18n();
  const [state, setState] = useState<MarketplaceState>({
    status: "ready",
    listings,
    isDemo: true
  });

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    fetchMarketplaceListings(client)
      .then((liveListings) => {
        if (active) setState({ status: "ready", listings: liveListings, isDemo: false });
      })
      .catch((error: unknown) => {
        if (active) {
          if (isSupabaseRecoverableError(error)) {
            setState({ status: "ready", listings, isDemo: true });
            return;
          }
          setState({
            status: "error",
            message: error instanceof Error ? error.message : t("unknownError")
          });
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  const localizedListings =
    state.status === "ready"
      ? state.listings.map((listing) => localizeListing(listing, language))
      : [];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={t("marketplaceEyebrow")}
          title={t("marketplaceTitle")}
          description={t("marketplaceDescription")}
        />
        <div className="rounded-lg border border-white/10 bg-white/[0.045] px-5 py-4 text-sm text-white/58">
          {isSupabaseConfigured() && state.status === "ready" && state.isDemo ? (
            <Loader2 size={16} className="mr-2 inline animate-spin" />
          ) : null}
          <span className="font-semibold text-white">{localizedListings.length}</span>{" "}
          {state.status === "ready" && state.isDemo ? t("demoListingsReady") : t("listingsFound")}
        </div>
      </div>

      {state.status === "error" ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
          <AlertCircle size={20} />
          <p className="mt-3 font-semibold">{t("dashboardErrorTitle")}</p>
          <p className="mt-1 text-red-200/70">{state.message}</p>
        </div>
      ) : state.status === "loading" ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] text-white/52">
          <Loader2 className="mr-3 animate-spin" /> {t("dashboardLoading")}
        </div>
      ) : localizedListings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/14 p-10 text-center">
          <p className="font-semibold text-white">{t("noListings")}</p>
          <p className="mt-2 text-sm text-white/48">{t("noLiveListingsCopy")}</p>
        </div>
      ) : (
        <MarketplaceBrowser listings={localizedListings} />
      )}
    </section>
  );
}
