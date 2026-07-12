"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ListingDetailView } from "@/components/listing-detail-view";
import { useI18n } from "@/components/language-provider";
import { creators, getCreatorByHandle, getCreatorListings, getListingById } from "@/lib/data";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { fetchCreator, fetchCreatorListings, fetchListing } from "@/lib/supabase-data";
import type { Creator, Listing } from "@/lib/types";

type ListingDetailPageProps = {
  params: {
    id: string;
  };
};

type ListingState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; listing: Listing; creator: Creator | null; related: Listing[] };

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { t } = useI18n();
  const [state, setState] = useState<ListingState>(() => getInitialState(params.id));

  useEffect(() => {
    if (!isUuid(params.id) || !isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    async function load() {
      try {
        const listing = await fetchListing(client, params.id);
        if (!active) return;
        if (!listing) {
          setState({ status: "not-found" });
          return;
        }
        const [creator, creatorListings] = await Promise.all([
          fetchCreator(client, listing.creatorId),
          fetchCreatorListings(client, listing.creatorId)
        ]);
        if (active) {
          setState({
            status: "ready",
            listing,
            creator,
            related: creatorListings.filter((item) => item.id !== listing.id)
          });
        }
      } catch (error) {
        if (active) {
          setState({
            status: "error",
            message: isSupabaseRecoverableError(error)
              ? t("supabaseInvalidConfig")
              : error instanceof Error
                ? error.message
                : t("unknownError")
          });
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [params.id, t]);

  if (state.status === "loading") {
    return <PageNotice icon={<Loader2 className="animate-spin" />} title={t("dashboardLoading")} />;
  }
  if (state.status === "not-found") {
    return <PageNotice icon={<AlertCircle />} title={t("notFoundTitle")} description={t("notFoundCopy")} />;
  }
  if (state.status === "error") {
    return <PageNotice icon={<AlertCircle />} title={t("dashboardErrorTitle")} description={state.message} />;
  }

  return (
    <ListingDetailView
      listing={state.listing}
      creator={state.creator}
      relatedListings={state.related}
    />
  );
}

function getInitialState(id: string): ListingState {
  const listing = getListingById(id);
  if (listing) {
    const creator =
      getCreatorByHandle(listing.creatorHandle) ??
      creators.find((item) => item.id === listing.creatorId) ??
      null;
    return {
      status: "ready",
      listing,
      creator,
      related: getCreatorListings(listing.creatorId).filter((item) => item.id !== listing.id)
    };
  }
  return isUuid(id) && isSupabaseConfigured() ? { status: "loading" } : { status: "not-found" };
}

function PageNotice({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <section className="mx-auto flex min-h-[68vh] max-w-2xl items-center justify-center px-4 text-center">
      <div>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">{icon}</span>
        <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-6 text-white/52">{description}</p> : null}
      </div>
    </section>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
