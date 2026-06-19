"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

type OrderRequestButtonProps = {
  listing: Listing;
};

export function OrderRequestButton({ listing }: OrderRequestButtonProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [message, setMessage] = useState("");

  async function createOrderRequest() {
    setStatus("loading");
    setMessage("");

    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user && isUuid(listing.id) && isUuid(listing.creatorId)) {
        await supabase.from("order_requests").insert({
          listing_id: listing.id,
          creator_id: listing.creatorId,
          buyer_id: user.id,
          budget: listing.price,
          message: `${listing.title} demo order request`
        });
      }
    }

    window.setTimeout(() => {
      setStatus("sent");
      setMessage(t("orderMessage"));
    }, 450);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
      <button
        type="button"
        onClick={createOrderRequest}
        disabled={status === "loading" || status === "sent"}
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {status === "sent" ? t("requestSent") : t("requestOrder")}
      </button>
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
