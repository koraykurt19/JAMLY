"use client";

import Link from "next/link";
import { Info, Loader2, LogIn, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/supabase-data";
import type { Listing } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

type OrderRequestButtonProps = {
  listing: Listing;
};

export function OrderRequestButton({ listing }: OrderRequestButtonProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"checking" | "idle" | "loading" | "sent" | "signed-out" | "demo">(
    isSupabaseConfigured() ? "checking" : "demo"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    getCurrentProfile(supabase)
      .then(({ user }) => {
        if (!active) return;
        if (!user) {
          setStatus("signed-out");
        } else if (!isUuid(listing.id) || !isUuid(listing.creatorId)) {
          setStatus("demo");
        } else {
          setStatus("idle");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus("idle");
          setMessage(error instanceof Error ? error.message : t("unknownError"));
        }
      });

    return () => {
      active = false;
    };
  }, [listing.creatorId, listing.id, t]);

  async function createOrderRequest() {
    setStatus("loading");
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isUuid(listing.id) || !isUuid(listing.creatorId)) {
      setStatus("demo");
      setMessage(t("demoOrderOnly"));
      return;
    }

    try {
      const { user, profile } = await getCurrentProfile(supabase);
      if (!user) {
        setStatus("signed-out");
        return;
      }
      if (profile?.role !== "buyer") {
        setStatus("idle");
        setMessage(t("buyerOnlyOrder"));
        return;
      }

      const { error } = await supabase.from("order_requests").insert({
          listing_id: listing.id,
          creator_id: listing.creatorId,
          buyer_id: user.id,
          budget: listing.price,
          message: `${listing.title} order request`
      });

      if (error) {
        throw new Error(error.message);
      }

      setStatus("sent");
      setMessage(t("orderMessage"));
    } catch (error) {
      setStatus("idle");
      setMessage(
        `${t("orderRequestError")}: ${error instanceof Error ? error.message : t("unknownError")}`
      );
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
      {status === "signed-out" ? (
        <Link href="/auth/sign-in" className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-jam-mint">
          <LogIn size={18} />
          {t("signInToRequest")}
        </Link>
      ) : status === "demo" ? (
        <div className="flex items-start gap-3 rounded-lg border border-jam-blue/25 bg-jam-blue/10 p-3 text-sm text-jam-blue">
          <Info size={18} className="mt-0.5 shrink-0" />
          <span>{t("demoOrderOnly")}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={createOrderRequest}
          disabled={status === "checking" || status === "loading" || status === "sent"}
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "checking" || status === "loading" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {status === "sent" ? t("requestSent") : t("requestOrder")}
        </button>
      )}
      {message ? <p className="mt-3 text-sm text-jam-mint">{message}</p> : null}
      <p className="mt-3 text-xs leading-5 text-white/48">
        {t("orderHelp")}
      </p>
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
