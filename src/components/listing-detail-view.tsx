"use client";

import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileAudio,
  Gauge,
  ShieldCheck,
  Tag
} from "lucide-react";
import { AudioPreview } from "@/components/audio-preview";
import { CreativeBriefBuilder } from "@/components/creative-brief-builder";
import { ListingCard } from "@/components/listing-card";
import { OrderRequestButton } from "@/components/order-request-button";
import { ShortlistButton } from "@/components/shortlist-button";
import { StartConversationButton } from "@/components/start-conversation-button";
import { useI18n } from "@/components/language-provider";
import { currency, shortDate } from "@/lib/format";
import { categoryLabel, licenseLabel, moodLabel, usageLabel } from "@/lib/labels";
import { localizeCreator, localizeListing } from "@/lib/i18n";
import type { Creator, Listing } from "@/lib/types";

type ListingDetailViewProps = {
  listing: Listing;
  creator: Creator | null;
  relatedListings: Listing[];
};

export function ListingDetailView({
  listing,
  creator,
  relatedListings
}: ListingDetailViewProps) {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const localizedListing = localizeListing(listing, language);
  const localizedCreator = creator ? localizeCreator(creator, language) : null;
  const localizedRelatedListings = relatedListings.map((item) =>
    localizeListing(item, language)
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/marketplace"
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/68 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
      >
        <ArrowLeft size={16} />
        {t("backMarketplace")}
      </Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]">
          <div className="relative aspect-[16/11] min-h-[320px]">
            <Image
              src={localizedListing.coverImageUrl}
              alt={localizedListing.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/18 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-jam-mint">
                {categoryLabel(localizedListing.category, language)}
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {localizedListing.title}
              </h1>
            </div>
          </div>
          <div className="p-5">
            <AudioPreview
              src={localizedListing.audioPreviewUrl}
              title={localizedListing.title}
              markers={localizedListing.markers}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm text-white/48">{t("startingAt")}</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight text-white">
                  {currency(localizedListing.price, language, currencyCode, usdTryRate)}
                </p>
              </div>
              <span className="rounded-full bg-jam-mint px-3 py-1 text-sm font-bold text-black">
                {licenseLabel(localizedListing.licenseType, language)}
              </span>
            </div>
            <div className="mt-4">
              <ShortlistButton listingId={localizedListing.id} />
            </div>
            <p className="mt-5 text-sm leading-7 text-white/62">
              {localizedListing.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {localizedListing.moods.map((mood) => (
                <span
                  key={mood}
                  className="rounded-full border border-jam-blue/20 bg-jam-blue/10 px-3 py-1 text-xs font-semibold text-jam-blue"
                >
                  {moodLabel(mood, language)}
                </span>
              ))}
              {localizedListing.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs font-semibold text-white/58"
                >
                  {usageLabel(useCase, language)}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Meta icon={Tag} label={t("genre")} value={localizedListing.genre} />
              <Meta
                icon={Gauge}
                label={t("bpm")}
                value={localizedListing.bpm ? `${localizedListing.bpm}` : t("bpmOpen")}
              />
              <Meta icon={Clock} label={t("delivery")} value={localizedListing.turnaround} />
              <Meta icon={FileAudio} label={t("preview")} value={t("streamingUrl")} />
            </div>
          </div>

          <StartConversationButton
            artistId={localizedListing.creatorId}
            listingId={localizedListing.id}
            label={localizedListing.licenseType === "Service" ? "offer" : "message"}
          />
          <OrderRequestButton listing={localizedListing} />
          <CreativeBriefBuilder />

          {localizedCreator ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-4">
                <Image
                  src={localizedCreator.avatarUrl}
                  alt={localizedCreator.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div>
                  <Link
                    href={`/creators/${localizedCreator.handle}`}
                    className="flex items-center gap-2 text-lg font-semibold text-white transition hover:text-jam-mint"
                  >
                    {localizedCreator.name}
                    {localizedCreator.verified ? (
                      <BadgeCheck size={17} className="text-jam-blue" />
                    ) : null}
                  </Link>
                  <p className="text-sm text-white/52">{localizedCreator.headline}</p>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <ShieldCheck size={23} className="text-jam-mint" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {t("licenseDelivery")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/58">
            {t("licenseDeliveryCopy")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {localizedListing.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-black/28 px-3 py-1 text-sm text-white/62"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-4">
            <DetailList title={t("deliverables")} items={localizedListing.deliverables} />
            <DetailList title={t("filesIncluded")} items={localizedListing.filesIncluded} />
            <div className="rounded-lg border border-white/10 bg-black/24 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
                {t("revisionPolicy")}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                {localizedListing.revisionPolicy}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <BooleanSignal
                label={t("commercialUse")}
                active={localizedListing.commercialUse}
                status={localizedListing.commercialUse ? t("available") : t("notAvailable")}
              />
              <BooleanSignal
                label={t("exclusiveAvailable")}
                active={localizedListing.exclusiveAvailable}
                status={localizedListing.exclusiveAvailable ? t("available") : t("notAvailable")}
              />
            </div>
          </div>
          <p className="mt-5 text-xs text-white/38">
            {t("published")}: {shortDate(localizedListing.createdAt, language)}
          </p>
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-jam-mint">
                {t("moreFromCreator")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {t("similarItems")}
              </h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {localizedRelatedListings.slice(0, 2).map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/24 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-2 text-sm text-white/64">
            <CheckCircle2 size={15} className="text-jam-mint" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function BooleanSignal({
  label,
  active,
  status
}: {
  label: string;
  active: boolean;
  status: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/24 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
        {label}
      </p>
      <p
        className={`mt-2 inline-flex items-center gap-2 text-sm font-semibold ${
          active ? "text-jam-mint" : "text-white/42"
        }`}
      >
        {active ? <CheckCircle2 size={15} /> : null}
        {status}
      </p>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/24 p-4">
      <Icon size={17} className="text-jam-blue" />
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
