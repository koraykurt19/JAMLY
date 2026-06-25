"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CreatorProfileView } from "@/components/creator-profile-view";
import { useI18n } from "@/components/language-provider";
import { getCreatorByHandle, getCreatorListings } from "@/lib/data";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { fetchCreatorByHandle, fetchCreatorListings } from "@/lib/supabase-data";
import type { Creator, Listing } from "@/lib/types";

type CreatorProfilePageProps = {
  params: {
    handle: string;
  };
};

type CreatorState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; creator: Creator; listings: Listing[] };

export default function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { t } = useI18n();
  const [state, setState] = useState<CreatorState>(() => getInitialState(params.handle));

  useEffect(() => {
    if (getCreatorByHandle(params.handle) || !isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    async function load() {
      try {
        const creator = await fetchCreatorByHandle(client, params.handle);
        if (!active) return;
        if (!creator) {
          setState({ status: "not-found" });
          return;
        }
        const creatorListings = await fetchCreatorListings(client, creator.id);
        if (active) setState({ status: "ready", creator, listings: creatorListings });
      } catch (error) {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : t("unknownError")
          });
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [params.handle, t]);

  if (state.status !== "ready") {
    const loading = state.status === "loading";
    return (
      <section className="mx-auto flex min-h-[68vh] max-w-2xl items-center justify-center px-4 text-center">
        <div>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">
            {loading ? <Loader2 className="animate-spin" /> : <AlertCircle />}
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-white">
            {loading ? t("dashboardLoading") : state.status === "error" ? t("dashboardErrorTitle") : t("creatorNotFound")}
          </h1>
          {state.status === "error" ? <p className="mt-3 text-sm text-white/52">{state.message}</p> : null}
        </div>
      </section>
    );
  }

  return <CreatorProfileView creator={state.creator} listings={state.listings} />;
}

function getInitialState(handle: string): CreatorState {
  const creator = getCreatorByHandle(handle);
  if (creator) {
    return { status: "ready", creator, listings: getCreatorListings(creator.id) };
  }
  return isSupabaseConfigured() ? { status: "loading" } : { status: "not-found" };
}
