"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LicenseCheckout } from "@/components/license-checkout";
import { useI18n } from "@/components/language-provider";
import { getListingById } from "@/lib/data";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { fetchListing } from "@/lib/supabase-data";
import type { Listing } from "@/lib/types";
import { isBeatLicenseListing } from "@/lib/beat-licenses";

type CheckoutPageProps = { params: { id: string } };
type CheckoutState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; listing: Listing };

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { t } = useI18n();
  const [state, setState] = useState<CheckoutState>(() => {
    const demoListing = getListingById(params.id);
    if (demoListing) return { status: "ready", listing: demoListing };
    return isUuid(params.id) && isSupabaseConfigured()
      ? { status: "loading" }
      : { status: "not-found" };
  });

  useEffect(() => {
    if (!isUuid(params.id) || !isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    fetchListing(client, params.id)
      .then((listing) => {
        if (!active) return;
        setState(listing ? { status: "ready", listing } : { status: "not-found" });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message: isSupabaseRecoverableError(error)
            ? t("supabaseInvalidConfig")
            : error instanceof Error
              ? error.message
              : t("unknownError")
        });
      });

    return () => {
      active = false;
    };
  }, [params.id, t]);

  if (state.status === "ready" && isBeatLicenseListing(state.listing)) {
    return <LicenseCheckout listing={state.listing} />;
  }

  return (
    <section className="mx-auto flex min-h-[68vh] max-w-2xl items-center justify-center px-4 text-center">
      <div>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">
          {state.status === "loading" ? <Loader2 className="animate-spin" /> : <AlertCircle />}
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-white">
          {state.status === "loading"
            ? t("dashboardLoading")
            : state.status === "error"
              ? t("dashboardErrorTitle")
              : t("checkoutUnavailable")}
        </h1>
        {state.status === "error" ? (
          <p className="mt-3 text-sm leading-6 text-white/52">{state.message}</p>
        ) : null}
      </div>
    </section>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
