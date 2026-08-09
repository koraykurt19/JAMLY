"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/format";
import {
  findOrCreateMarketplaceConversation,
  getDemoConversationId
} from "@/lib/messaging-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function StartConversationButton({
  artistId,
  listingId = null,
  label = "message",
  variant = "primary",
  className
}: {
  artistId: string;
  listingId?: string | null;
  label?: "message" | "offer";
  variant?: "primary" | "secondary" | "compact";
  className?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openConversation() {
    if (loading) return;
    setLoading(true);
    setError("");

    const client = getSupabaseBrowserClient();
    if (!client || !isUuid(artistId) || (listingId !== null && !isUuid(listingId))) {
      router.push(`/messages?conversation=${encodeURIComponent(getDemoConversationId(artistId, listingId))}`);
      return;
    }

    try {
      const conversationId = await findOrCreateMarketplaceConversation(
        client,
        artistId,
        listingId
      );
      router.push(`/messages?conversation=${encodeURIComponent(conversationId)}`);
    } catch (conversationError) {
      const code = conversationError instanceof Error ? conversationError.message : "";
      if (code === "AUTH_REQUIRED") {
        router.push("/auth/sign-in");
        return;
      }
      setError(`${t("conversationStartError")}: ${code || t("unknownError")}`);
      setLoading(false);
    }
  }

  return (
    <div className={cn(variant === "compact" ? "w-full" : "", className)}>
      <button
        type="button"
        onClick={openConversation}
        disabled={loading}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 font-bold transition disabled:cursor-wait disabled:opacity-60",
          variant === "primary" &&
            "w-full rounded-md bg-jam-mint px-5 py-3 text-sm text-black hover:bg-white",
          variant === "secondary" &&
            "rounded-md border border-white/12 px-5 py-3 text-sm text-white/78 hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white",
          variant === "compact" &&
            "w-full rounded-md border border-white/10 px-3 py-2.5 text-xs text-white/68 hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white"
        )}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
        {loading ? t("startingConversation") : label === "offer" ? t("requestOffer") : t("messageArtist")}
      </button>
      {error ? <p className="mt-2 text-xs leading-5 text-red-300">{error}</p> : null}
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
