"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Gauge,
  Layers3,
  SlidersHorizontal
} from "lucide-react";
import type { Listing } from "@/lib/types";
import { currency } from "@/lib/format";
import { categoryLabel } from "@/lib/labels";
import { useI18n } from "@/components/language-provider";
import { useAudioPlayer } from "@/components/audio-player-provider";
import { ShortlistButton } from "@/components/shortlist-button";
import { isBeatLicenseListing } from "@/lib/beat-licenses";
import { SafeImage } from "@/components/safe-image";
import { EmbeddedAudioWaveform } from "@/components/embedded-audio-waveform";

type ListingCardProps = {
  listing: Listing;
  priority?: boolean;
  creatorVerified?: boolean;
  density?: "standard" | "compact";
};

export function ListingCard({
  listing,
  priority = false,
  creatorVerified = false,
  density = "standard"
}: ListingCardProps) {
  const { currencyCode, language, usdTryRate } = useI18n();
  const player = useAudioPlayer();
  const isBeat = isBeatLicenseListing(listing);
  const trackId = `listing-${listing.id}`;
  const isActive = player.activeTrack?.id === trackId;
  const isPlaying = isActive && player.isPlaying;
  const hasAudio = Boolean(listing.audioPreviewUrl.trim());
  const startingPrice =
    isBeat && listing.licensePrices
      ? Math.min(...Object.values(listing.licensePrices))
      : listing.price;

  function togglePreview() {
    void player.playTrack({
      id: trackId,
      src: listing.audioPreviewUrl,
      title: listing.title,
      creatorHandle: listing.creatorHandle,
      coverImageUrl: listing.coverImageUrl,
      listingHref: `/listing/${listing.id}`,
      listingId: listing.id
    });
  }

  return (
    <article className="group min-w-0 overflow-hidden rounded-lg border border-white/[0.09] bg-[#121722] transition duration-200 hover:-translate-y-0.5 hover:border-jam-blue/45 hover:bg-[#151b27] focus-within:border-jam-blue/45">
      <div className="relative">
        <Link
          href={`/listing/${listing.id}`}
          className="focus-ring block"
          aria-label={`${listing.title} ${language === "tr" ? "detaylarını aç" : "view details"}`}
        >
          <div
            className={
              density === "compact"
                ? "relative aspect-[5/4] overflow-hidden bg-white/[0.04]"
                : "relative aspect-[4/3] overflow-hidden bg-white/[0.04]"
            }
          >
            <SafeImage
              src={listing.coverImageUrl}
              alt={`${listing.title} kapak görseli`}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-[1.025]"
              priority={priority}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f]/88 via-transparent to-black/20" />
          </div>
        </Link>

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-md border border-white/10 bg-[#080a0f]/84 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md">
            {categoryLabel(listing.category, language)}
          </span>
          {listing.featured ? (
            <span className="rounded-md bg-jam-mint px-2.5 py-1 text-[11px] font-bold text-[#071018]">
              {language === "tr" ? "Öne çıkan" : "Featured"}
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3">
          <ShortlistButton listingId={listing.id} compact />
        </div>

        <span className="absolute bottom-3 right-3 rounded-md border border-white/10 bg-[#080a0f]/88 px-3 py-2 text-sm font-bold text-white backdrop-blur-md">
          <span className="mr-1 text-[10px] font-medium uppercase text-white/48">
            {language === "tr" ? "Başlangıç" : "From"}
          </span>
          {currency(startingPrice, language, currencyCode, usdTryRate)}
        </span>
      </div>

      <EmbeddedAudioWaveform
        title={listing.title}
        seed={listing.id}
        currentTime={isActive ? player.currentTime : 0}
        duration={isActive ? player.duration : 0}
        isActive={isActive}
        isPlaying={isPlaying}
        disabled={!hasAudio}
        onToggle={togglePreview}
        onSeek={player.seek}
      />

      <div className={density === "compact" ? "p-4" : "p-5"}>
        <Link
          href={`/listing/${listing.id}`}
          className="focus-ring block rounded-sm"
        >
          <h3 className="line-clamp-1 text-[17px] font-semibold text-white transition group-hover:text-jam-mint">
            {listing.title}
          </h3>
        </Link>

        <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
          <Link
            href={`/creators/${listing.creatorHandle}`}
            className="focus-ring flex min-w-0 items-center gap-2 rounded-md"
          >
            <SafeImage
              src={listing.creatorAvatarUrl}
              alt={`@${listing.creatorHandle}`}
              width={32}
              height={32}
              sizes="32px"
              className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover"
            />
            <span className="min-w-0 truncate text-sm font-medium text-white/66 transition hover:text-white">
              @{listing.creatorHandle}
            </span>
            {creatorVerified ? (
              <BadgeCheck
                size={14}
                className="shrink-0 text-jam-mint"
                aria-label={language === "tr" ? "Doğrulanmış üretici" : "Verified creator"}
              />
            ) : null}
          </Link>
          <span className="truncate text-xs text-white/42">{listing.genre}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {isBeat ? (
            <>
              {listing.bpm ? (
                <Metadata icon={Gauge} label={`${listing.bpm} BPM`} />
              ) : null}
              <Metadata
                icon={Layers3}
                label={language === "tr" ? "3 lisans" : "3 licenses"}
              />
              {listing.filesIncluded.some((file) =>
                file.toLowerCase().includes("stem")
              ) ? (
                <Metadata icon={SlidersHorizontal} label="Stems" />
              ) : null}
            </>
          ) : (
            <>
              {listing.turnaround ? (
                <Metadata icon={Clock3} label={listing.turnaround} />
              ) : null}
              {listing.deliverables[0] ? (
                <Metadata icon={Layers3} label={listing.deliverables[0]} />
              ) : null}
            </>
          )}
        </div>

        {density === "standard" ? (
          <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-white/48">
            {listing.description}
          </p>
        ) : null}

        <Link
          href={`/listing/${listing.id}`}
          className="focus-ring mt-5 flex min-h-11 items-center justify-between rounded-md border border-white/[0.09] px-3.5 text-sm font-semibold text-white/72 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
        >
          {isBeat
            ? language === "tr"
              ? "Lisansları incele"
              : "View licenses"
            : language === "tr"
              ? "Hizmeti incele"
              : "View service"}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function Metadata({
  icon: Icon,
  label
}: {
  icon: typeof Gauge;
  label: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-white/[0.07] bg-black/20 px-2 py-1 text-[11px] font-medium text-white/54">
      <Icon size={12} className="shrink-0 text-jam-blue" />
      <span className="truncate">{label}</span>
    </span>
  );
}
