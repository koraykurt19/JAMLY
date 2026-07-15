"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, Gauge, Tag } from "lucide-react";
import type { Listing } from "@/lib/types";
import { currency } from "@/lib/format";
import { categoryLabel, licenseLabel, moodLabel, usageLabel } from "@/lib/labels";
import { useI18n } from "@/components/language-provider";
import { AudioPreview } from "@/components/audio-preview";
import { ShortlistButton } from "@/components/shortlist-button";
import { StartConversationButton } from "@/components/start-conversation-button";
import { isBeatLicenseListing } from "@/lib/beat-licenses";

type ListingCardProps = {
  listing: Listing;
  priority?: boolean;
};

export function ListingCard({ listing, priority = false }: ListingCardProps) {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const discoveryPills = [
    listing.moods[0]
      ? { key: `mood-${listing.moods[0]}`, label: moodLabel(listing.moods[0], language) }
      : null,
    listing.useCases[0]
      ? {
          key: `use-${listing.useCases[0]}`,
          label: usageLabel(listing.useCases[0], language)
        }
      : null
  ].filter((item): item is { key: string; label: string } => Boolean(item));

  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.035))] shadow-soft transition duration-300 hover:-translate-y-1 hover:border-jam-blue/40 hover:bg-white/[0.08] hover:shadow-[0_28px_90px_rgba(88,197,255,0.14)]">
      <div className="relative">
        <Link href={`/listing/${listing.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.04]">
            <Image
              src={listing.coverImageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              priority={priority}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jam-mint/70 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jam-mint">
                  {categoryLabel(listing.category, language)}
                </p>
                <h3 className="mt-1 line-clamp-2 text-xl font-semibold tracking-tight text-white">
                  {listing.title}
                </h3>
              </div>
              <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-black shadow-[0_10px_30px_rgba(0,0,0,0.24)]">
                {currency(listing.price, language, currencyCode, usdTryRate)}
              </p>
            </div>
          </div>
        </Link>
        <div className="absolute right-4 top-4">
          <ShortlistButton listingId={listing.id} compact />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Image
            src={listing.creatorAvatarUrl}
            alt={listing.creatorName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full border border-white/10 object-cover"
          />
          <div className="min-w-0">
            <Link
              href={`/creators/${listing.creatorHandle}`}
              className="flex items-center gap-1 truncate text-sm font-semibold text-white transition hover:text-jam-mint"
            >
              {listing.creatorName}
              <BadgeCheck size={14} className="text-jam-blue" />
            </Link>
            <p className="text-xs text-white/48">
              {listing.genre}
              {listing.bpm ? ` / ${listing.bpm} BPM` : ""}
            </p>
          </div>
        </div>

        <AudioPreview src={listing.audioPreviewUrl} title={listing.title} compact />

        <div className="flex flex-wrap gap-2">
          {discoveryPills.map((item) => (
            <span
              key={item.key}
              className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs font-semibold text-white/60"
            >
              {item.label}
            </span>
          ))}
        </div>

        <div className="grid gap-2 text-xs text-white/58 sm:grid-cols-3">
          <span className="flex items-center gap-1 rounded-md bg-black/24 px-2 py-2">
            <Tag size={13} />
            {isBeatLicenseListing(listing)
              ? t("threeLicenseOptions")
              : licenseLabel(listing.licenseType, language)}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-black/24 px-2 py-2">
            <Clock size={13} />
            {listing.turnaround}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-black/24 px-2 py-2">
            <Gauge size={13} />
            {listing.bpm ?? t("bpmOpen")}
          </span>
        </div>

        <StartConversationButton
          artistId={listing.creatorId}
          listingId={listing.id}
          label={listing.licenseType === "Service" ? "offer" : "message"}
          variant="compact"
        />
      </div>
    </article>
  );
}
