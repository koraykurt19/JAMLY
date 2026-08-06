"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { setListingActiveState } from "@/lib/supabase-data";

export function ListingVisibilityControl({
  listingId,
  isActive,
  exclusiveSold,
  isDemo,
  onChanged
}: {
  listingId: string;
  isActive: boolean;
  exclusiveSold: boolean;
  isDemo: boolean;
  onChanged: () => void;
}) {
  const { language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const canPublish = !exclusiveSold;
  const actionLabel = isActive
    ? language === "tr"
      ? "Yayından kaldır"
      : "Unpublish"
    : language === "tr"
      ? "Yayına al"
      : "Publish";

  async function toggleVisibility() {
    if (loading || !canPublish) return;
    if (isDemo) {
      setMessage(
        language === "tr"
          ? "Demo modunda görünürlük değişikliği kaydedilmez."
          : "Visibility changes are not saved in demo mode."
      );
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;

    setLoading(true);
    setMessage("");
    try {
      await setListingActiveState(client, listingId, !isActive);
      onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : language === "tr"
            ? "İlan güncellenemedi."
            : "The listing could not be updated."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={toggleVisibility}
        disabled={loading || !canPublish}
        className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-white/12 bg-black/20 px-3 text-xs font-bold text-white/72 transition hover:border-jam-blue/55 hover:bg-jam-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : isActive ? <EyeOff size={15} /> : <Eye size={15} />}
        {exclusiveSold
          ? language === "tr"
            ? "Exclusive satıldı"
            : "Exclusive sold"
          : actionLabel}
      </button>
      {message ? <p className="max-w-48 text-xs leading-5 text-jam-blue">{message}</p> : null}
    </div>
  );
}
