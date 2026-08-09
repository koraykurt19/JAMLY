"use client";

import { Heart } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/format";
import { useShortlist } from "@/lib/use-shortlist";

const DEFAULT_SHORTLIST = ["night-shift-bounce", "velvet-hook-package"];

type ShortlistButtonProps = {
  listingId: string;
  compact?: boolean;
};

export function ShortlistButton({ listingId, compact = false }: ShortlistButtonProps) {
  const { t } = useI18n();
  const shortlist = useShortlist(DEFAULT_SHORTLIST);
  const saved = shortlist.contains(listingId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        shortlist.toggle(listingId);
      }}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-full border text-sm font-bold transition",
        saved
          ? "border-jam-coral bg-jam-coral text-black"
          : "border-white/12 bg-black/44 text-white/72 backdrop-blur hover:border-white/24 hover:bg-white/12 hover:text-white",
        compact ? "h-10 w-10" : "px-4 py-2"
      )}
      aria-pressed={saved}
      aria-label={saved ? t("removeShortlist") : t("addShortlist")}
    >
      <Heart size={compact ? 16 : 17} fill={saved ? "currentColor" : "none"} />
      {compact ? <span className="sr-only">{t("shortlist")}</span> : saved ? t("savedToShortlist") : t("addShortlist")}
    </button>
  );
}
