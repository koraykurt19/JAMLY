"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waves
} from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { SectionHeading } from "@/components/section-heading";
import { creators, getFeaturedListings } from "@/lib/data";
import { localizeCreator, localizeListing } from "@/lib/i18n";
import { useI18n } from "@/components/language-provider";
import {
  fetchMarketplaceListings
} from "@/lib/supabase-data";
import {
  getSupabaseBrowserClient,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import type { Listing } from "@/lib/types";

const heroImage =
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=85";

export default function LandingPage() {
  const { language, t } = useI18n();
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");
  const [showcaseSeed] = useState(() => Math.random());
  const [showcaseListings, setShowcaseListings] = useState<Listing[]>(() =>
    getFeaturedListings()
  );
  const featuredListings = showcaseListings.map((listing) =>
    localizeListing(listing, language)
  );
  const showcaseListing = useMemo(
    () => chooseShowcaseListing(featuredListings, showcaseSeed),
    [featuredListings, showcaseSeed]
  );
  const spotlightCreator = localizeCreator(creators[0], language);
  const heroCategories = [
    { label: language === "tr" ? "Beat" : "Beats", query: "beat", icon: Waves },
    { label: language === "tr" ? "Vokal" : "Vocals", query: "vocal", icon: Headphones },
    { label: "Mix/Master", query: "mix master", icon: Radar },
    { label: "Jam Match", query: "custom producer", icon: Sparkles }
  ];

  function submitHeroSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = heroSearch.trim();
    router.push(query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace");
  }

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    fetchMarketplaceListings(client)
      .then((liveListings) => {
        if (!active) return;
        const activeListings = liveListings.filter((listing) => listing.isActive);
        setShowcaseListings(activeListings.length > 0 ? activeListings : getFeaturedListings());
      })
      .catch((error: unknown) => {
        if (!active || !isSupabaseRecoverableError(error)) return;
        setShowcaseListings(getFeaturedListings());
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-white/8">
        <Image
          src={heroImage}
          alt={language === "tr" ? "Premium stüdyoda kayıt alan sanatçı" : "Artist recording in a premium studio"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/68" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(88,197,255,0.28),transparent_26rem),radial-gradient(circle_at_80%_18%,rgba(122,167,255,0.22),transparent_24rem),linear-gradient(180deg,rgba(5,6,8,0.18),#050608_96%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jam-mint/80 to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(90vh-5rem)] w-full max-w-7xl items-end gap-10 px-4 pb-14 pt-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="pb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-jam-mint/25 bg-jam-mint/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-jam-mint">
              <span className="h-2 w-2 rounded-full bg-jam-mint shadow-[0_0_20px_rgba(88,197,255,0.8)]" />
              {t("heroEyebrow")}
            </div>
            <h1 className="mt-6 max-w-4xl text-6xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/74">
              {t("heroDescription")}
            </p>

            <form
              onSubmit={submitHeroSearch}
              className="mt-8 flex min-h-16 max-w-3xl flex-col gap-3 rounded-lg border border-white/12 bg-white/95 p-2 shadow-[0_24px_90px_rgba(0,0,0,0.42)] sm:flex-row sm:items-center"
            >
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t("searchMarketplace")}</span>
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/42"
                />
                <input
                  value={heroSearch}
                  onChange={(event) => setHeroSearch(event.target.value)}
                  placeholder={
                    language === "tr"
                      ? "Trap beat, vokal hook, mix/master veya özel üretici ara"
                      : "Search trap beats, vocal hooks, mix/master, or custom producers"
                  }
                  className="h-12 w-full rounded-md bg-transparent pl-12 pr-3 text-base font-medium text-black outline-none placeholder:text-black/46"
                />
              </label>
              <button
                type="submit"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md bg-black px-5 text-sm font-bold text-white transition hover:bg-jam-blue hover:text-black"
              >
                {language === "tr" ? "Ara" : "Search"}
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {heroCategories.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={`/marketplace?q=${encodeURIComponent(item.query)}`}
                    className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/28 px-4 py-2 text-sm font-semibold text-white/70 backdrop-blur transition hover:border-jam-blue/45 hover:bg-jam-blue/12 hover:text-white"
                  >
                    <Icon size={16} className="text-jam-mint" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/marketplace"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-jam-mint px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
              >
                {t("heroPrimary")}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/upload"
                className="focus-ring inline-flex items-center justify-center rounded-full border border-white/14 px-6 py-3 text-sm font-bold text-white transition hover:border-white/28 hover:bg-white/8"
              >
                {t("heroSecondary")}
              </Link>
            </div>
          </div>

          <div className="jamly-float hidden pb-8 lg:block">
            <div className="rounded-lg border border-white/12 bg-black/42 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
              <div className="relative overflow-hidden rounded-lg border border-white/10">
                <Link href={`/listing/${showcaseListing?.id ?? ""}`} className="block">
                  <Image
                    src={showcaseListing?.coverImageUrl ?? heroImage}
                    alt={showcaseListing?.title ?? "Jamly"}
                    width={760}
                    height={520}
                    className="h-[360px] w-full object-cover transition duration-700 hover:scale-[1.025]"
                    sizes="(min-width: 1024px) 45vw, 0px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent" />
                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black">
                      {language === "tr" ? "Canlı vitrin" : "Live storefront"}
                    </span>
                    <span className="rounded-full border border-jam-mint/35 bg-jam-mint/15 px-3 py-1 text-xs font-bold text-jam-mint">
                      {showcaseListing?.genre ?? "Jamly"}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-jam-mint">
                      {language === "tr" ? "Revaçtaki iş" : "Trending pick"}
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {showcaseListing?.title ?? t("featuredTitle")}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-white/70">
                      <span className="rounded-full border border-white/10 bg-black/32 px-3 py-1">
                        @{showcaseListing?.creatorHandle ?? "jamly"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/32 px-3 py-1">
                        {formatCompact(showcaseListing?.analytics.plays ?? 0, language)}{" "}
                        {language === "tr" ? "dinleme" : "plays"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/32 px-3 py-1">
                        {formatCompact(showcaseListing?.analytics.saves ?? 0, language)}{" "}
                        {language === "tr" ? "kayıt" : "saves"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {[0, 1, 2, 3].map((item) => (
                        <span
                          key={item}
                          className="jamly-pulse-line h-2 rounded-full bg-gradient-to-r from-jam-mint via-jam-blue to-transparent"
                          style={{ animationDelay: `${item * 0.22}s`, width: `${92 - item * 13}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow={t("featuredEyebrow")}
            title={t("featuredTitle")}
            description={t("featuredDescription")}
          />
          <Link
            href="/marketplace"
            className="focus-ring inline-flex items-center gap-2 self-start rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/78 transition hover:border-white/24 hover:bg-white/8 hover:text-white"
          >
            {t("viewAll")}
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.035]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionHeading
              eyebrow={t("creatorSpotlight")}
              title={spotlightCreator.name}
              description={spotlightCreator.headline}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {spotlightCreator.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-white/64"
                >
                  {specialty}
                </span>
              ))}
            </div>
            <p className="mt-6 text-base leading-8 text-white/64">{spotlightCreator.about}</p>
            <Link
              href={`/creators/${spotlightCreator.handle}`}
              className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-jam-mint"
            >
              {t("openProfile")}
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/10">
            <Image
              src={spotlightCreator.coverUrl}
              alt={
                language === "tr"
                  ? `${spotlightCreator.name} stüdyo alanı`
                  : `${spotlightCreator.name} studio workspace`
              }
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/24 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: BadgeCheck, label: t("verified"), value: t("creatorLabel") },
                  { icon: TrendingUp, label: t("orders"), value: `${spotlightCreator.completedOrders}+` },
                  { icon: ShieldCheck, label: t("rating"), value: spotlightCreator.rating.toString() }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-white/10 bg-black/42 p-4 backdrop-blur"
                    >
                      <Icon size={18} className="text-jam-mint" />
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/42">
                        {item.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow={t("workflowEyebrow")}
          title={t("workflowTitle")}
          description={t("workflowDescription")}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: t("workflowPublishTitle"),
              copy: t("workflowPublishCopy"),
              icon: Sparkles
            },
            {
              title: t("workflowFilterTitle"),
              copy: t("workflowFilterCopy"),
              icon: TrendingUp
            },
            {
              title: t("workflowRequestTitle"),
              copy: t("workflowRequestCopy"),
              icon: ShieldCheck
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
                <Icon size={22} className="text-jam-blue" />
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/56">{item.copy}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function chooseShowcaseListing(listings: Listing[], seed: number) {
  const activeListings = listings.filter((listing) => listing.isActive && !listing.exclusiveSold);
  const candidates = (activeListings.length > 0 ? activeListings : listings)
    .map((listing) => ({
      listing,
      score: getShowcaseScore(listing)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, item) => sum + item.score, 0);
  let cursor = seed * totalWeight;

  for (const candidate of candidates) {
    cursor -= candidate.score;
    if (cursor <= 0) return candidate.listing;
  }

  return candidates[candidates.length - 1]?.listing ?? null;
}

function getShowcaseScore(listing: Listing) {
  const creator = creators.find((item) => item.id === listing.creatorId);
  const trendScore =
    listing.analytics.views * 0.24 +
    listing.analytics.plays * 0.36 +
    listing.analytics.saves * 6 +
    listing.analytics.conversionRate * 70;
  const creatorFitScore =
    (creator?.profileStrength ?? 70) * 4 +
    (creator?.responseRate ?? 80) * 2 +
    (creator?.repeatBuyerRate ?? 40) * 2;
  const availabilityScore =
    (listing.featured ? 420 : 0) +
    (listing.deliverySpeed === "instant" ? 180 : 0) +
    (listing.commercialUse ? 120 : 0) +
    (listing.exclusiveAvailable ? 80 : 0);

  return Math.max(1, trendScore + creatorFitScore + availabilityScore);
}

function formatCompact(value: number, language: "tr" | "en") {
  return new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}
