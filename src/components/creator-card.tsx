"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Pause,
  Play,
  Star
} from "lucide-react";
import { useAudioPlayer } from "@/components/audio-player-provider";
import { useI18n } from "@/components/language-provider";
import type { Creator, Listing } from "@/lib/types";
import { SafeImage } from "@/components/safe-image";

export function CreatorCard({
  creator,
  previewListing
}: {
  creator: Creator;
  previewListing?: Listing;
}) {
  const { language } = useI18n();
  const player = useAudioPlayer();
  const trackId = previewListing ? `creator-preview-${previewListing.id}` : null;
  const isPlaying = Boolean(
    trackId && player.activeTrack?.id === trackId && player.isPlaying
  );
  const hasPreview = Boolean(previewListing?.audioPreviewUrl.trim());

  function togglePreview() {
    if (!previewListing || !trackId) return;
    void player.playTrack({
      id: trackId,
      src: previewListing.audioPreviewUrl,
      title: previewListing.title,
      creatorHandle: creator.handle,
      coverImageUrl: previewListing.coverImageUrl,
      listingHref: `/listing/${previewListing.id}`,
      listingId: previewListing.id
    });
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-white/[0.09] bg-[#121722] transition duration-200 hover:-translate-y-0.5 hover:border-jam-blue/45">
      <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.04]">
        <SafeImage
          src={creator.coverUrl}
          alt={`${creator.name} çalışma alanı`}
          fill
          sizes="(max-width: 768px) 92vw, (max-width: 1200px) 46vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-black/18 to-transparent" />
        {hasPreview ? (
          <button
            type="button"
            onClick={togglePreview}
            className="focus-ring absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-jam-mint"
            aria-label={
              isPlaying
                ? `${creator.name} ${language === "tr" ? "portföyünü duraklat" : "pause portfolio"}`
                : `${creator.name} ${language === "tr" ? "portföyünü oynat" : "play portfolio"}`
            }
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
        ) : null}
      </div>

      <div className="relative p-5 pt-11">
        <SafeImage
          src={creator.avatarUrl}
          alt={creator.name}
          width={68}
          height={68}
          sizes="68px"
          className="absolute -top-9 left-5 h-[68px] w-[68px] rounded-lg border-4 border-[#121722] object-cover"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-lg font-semibold text-white">{creator.name}</h3>
              {creator.verified ? (
                <BadgeCheck
                  size={16}
                  className="shrink-0 text-jam-mint"
                  aria-label={language === "tr" ? "Doğrulanmış" : "Verified"}
                />
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-white/46">@{creator.handle}</p>
          </div>
          {creator.rating > 0 ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/74">
              <Star size={14} className="text-jam-gold" fill="currentColor" />
              {creator.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-white/56">
          {creator.headline}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {creator.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="rounded-md border border-white/[0.08] bg-black/20 px-2 py-1 text-[11px] font-medium text-white/54"
            >
              {specialty}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/46">
            {creator.completedOrders > 0 ? (
              <span>
                {creator.completedOrders} {language === "tr" ? "tamamlanan iş" : "completed"}
              </span>
            ) : null}
            {creator.responseTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 size={13} />
                {creator.responseTime}
              </span>
            ) : null}
          </div>
          <Link
            href={`/creators/${creator.handle}`}
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-white/66 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
            aria-label={`${creator.name} ${language === "tr" ? "profilini gör" : "view profile"}`}
          >
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
