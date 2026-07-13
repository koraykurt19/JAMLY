"use client";

import {
  ArrowDownUp,
  BadgeCheck,
  BriefcaseBusiness,
  Crown,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { UiSelect } from "@/components/ui-select";
import { creators, listingCategories } from "@/lib/data";
import { currency } from "@/lib/format";
import { categoryLabel, localizedGenres } from "@/lib/i18n";
import {
  deliverySpeedLabel,
  moodLabel,
  usageLabel
} from "@/lib/labels";
import type { DeliverySpeed, Listing, ListingMood, ListingUseCase } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

const ALL_FILTER = "All";
type SortMode = "recommended" | "low-price" | "high-price" | "newest";
type QuickFilter = "instant" | "verified" | "stems" | "commercial" | "exclusive";

const moods: ListingMood[] = ["Dark", "Bright", "Smooth", "Club", "Cinematic", "Warm"];
const useCases: ListingUseCase[] = ["Single", "YouTube", "TikTok", "Sync", "Podcast", "Ad"];
const deliverySpeeds: DeliverySpeed[] = ["instant", "fast", "standard"];

type MarketplaceBrowserProps = {
  listings: Listing[];
};

export function MarketplaceBrowser({ listings }: MarketplaceBrowserProps) {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_FILTER);
  const [genre, setGenre] = useState(ALL_FILTER);
  const [mood, setMood] = useState(ALL_FILTER);
  const [useCase, setUseCase] = useState(ALL_FILTER);
  const [deliverySpeed, setDeliverySpeed] = useState(ALL_FILTER);
  const [maxPrice, setMaxPrice] = useState("500");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const genreOptions = localizedGenres(language);

  const filteredListings = useMemo(() => {
    const search = query.trim().toLowerCase();
    const priceLimit = Number(maxPrice);

    const filtered = listings.filter((listing) => {
      const creator = creators.find((item) => item.id === listing.creatorId);
      const hasInstantDelivery =
        listing.turnaround.toLowerCase().includes("instant") ||
        listing.turnaround.toLowerCase().includes("anında");
      const hasStems = listing.tags.some((tag) => tag.toLowerCase().includes("stem"));
      const matchesSearch =
        !search ||
        [
          listing.title,
          listing.creatorName,
          listing.genre,
          listing.category,
          categoryLabel(listing.category, language),
          listing.description,
          ...listing.tags
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesCategory = category === ALL_FILTER || listing.category === category;
      const matchesGenre = genre === ALL_FILTER || listing.genre === genre;
      const matchesMood =
        mood === ALL_FILTER || listing.moods.includes(mood as ListingMood);
      const matchesUseCase =
        useCase === ALL_FILTER || listing.useCases.includes(useCase as ListingUseCase);
      const matchesDeliverySpeed =
        deliverySpeed === ALL_FILTER || listing.deliverySpeed === deliverySpeed;
      const matchesPrice = listing.price <= priceLimit;
      const matchesInstant = !quickFilters.includes("instant") || hasInstantDelivery;
      const matchesVerified = !quickFilters.includes("verified") || Boolean(creator?.verified);
      const matchesStems = !quickFilters.includes("stems") || hasStems;
      const matchesCommercial =
        !quickFilters.includes("commercial") || listing.commercialUse;
      const matchesExclusive =
        !quickFilters.includes("exclusive") || listing.exclusiveAvailable;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGenre &&
        matchesMood &&
        matchesUseCase &&
        matchesDeliverySpeed &&
        matchesPrice &&
        matchesInstant &&
        matchesVerified &&
        matchesStems &&
        matchesCommercial &&
        matchesExclusive
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "low-price") {
        return a.price - b.price;
      }
      if (sortMode === "high-price") {
        return b.price - a.price;
      }
      if (sortMode === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return Number(b.featured ?? false) - Number(a.featured ?? false) || a.price - b.price;
    });
  }, [
    category,
    deliverySpeed,
    genre,
    language,
    listings,
    maxPrice,
    mood,
    query,
    quickFilters,
    sortMode,
    useCase
  ]);

  const jamMatches = useMemo(() => {
    const selectedMood = mood === ALL_FILTER ? "Dark" : mood;
    const selectedUseCase = useCase === ALL_FILTER ? "Single" : useCase;

    return listings
      .map((listing) => {
        const creator = creators.find((item) => item.id === listing.creatorId);
        const score =
          (listing.moods.includes(selectedMood as ListingMood) ? 34 : 0) +
          (listing.useCases.includes(selectedUseCase as ListingUseCase) ? 30 : 0) +
          (listing.price <= Number(maxPrice) ? 14 : 0) +
          (creator?.verified ? 10 : 0) +
          Math.round(listing.analytics.conversionRate);

        return { listing, score, creatorVerified: Boolean(creator?.verified) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [listings, maxPrice, mood, useCase]);

  function resetFilters() {
    setQuery("");
    setCategory(ALL_FILTER);
    setGenre(ALL_FILTER);
    setMood(ALL_FILTER);
    setUseCase(ALL_FILTER);
    setDeliverySpeed(ALL_FILTER);
    setMaxPrice("500");
    setQuickFilters([]);
    setSortMode("recommended");
  }

  function toggleQuickFilter(filter: QuickFilter) {
    setQuickFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-jam-mint text-black">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-jam-mint">
                {t("jamMatchTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/58">{t("jamMatchCopy")}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-white/58">
            <span className="inline-flex items-center gap-2 rounded-md bg-black/24 px-3 py-2">
              <Sparkles size={15} className="text-jam-blue" />
              {t("matchReasonMood")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-black/24 px-3 py-2">
              <BriefcaseBusiness size={15} className="text-jam-blue" />
              {t("matchReasonUseCase")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-black/24 px-3 py-2">
              <BadgeCheck size={15} className="text-jam-blue" />
              {t("matchReasonTrust")}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-xl font-semibold text-white">{t("jamMatchBest")}</h2>
          <div className="mt-4 grid gap-3">
            {jamMatches.map(({ listing, score }) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="grid gap-3 rounded-lg border border-white/10 bg-black/24 p-3 transition hover:border-white/20 hover:bg-white/[0.035] sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold text-white">{listing.title}</p>
                  <p className="mt-1 text-sm text-white/48">
                    {moodLabel(listing.moods[0], language)} /{" "}
                    {usageLabel(listing.useCases[0], language)} / {listing.creatorName}
                  </p>
                </div>
                <span className="self-start rounded-full bg-jam-mint px-3 py-1 text-xs font-bold text-black">
                  {Math.min(score, 99)}% {t("matchScore")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.35fr_0.72fr_0.72fr_0.8fr_0.76fr_auto]">
          <label className="relative block">
            <span className="sr-only">{t("searchMarketplace")}</span>
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/42"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="focus-ring h-12 w-full rounded-full border border-white/10 bg-black/35 pl-11 pr-4 text-sm text-white placeholder:text-white/36"
            />
          </label>

          <label>
            <span className="sr-only">{t("category")}</span>
            <UiSelect
              value={category}
              onChange={setCategory}
              ariaLabel={t("category")}
              variant="pill"
              options={[
                { value: ALL_FILTER, label: t("all") },
                ...listingCategories.map((item) => ({
                  value: item,
                  label: categoryLabel(item, language)
                }))
              ]}
            />
          </label>

          <label>
            <span className="sr-only">{t("genre")}</span>
            <UiSelect
              value={genre}
              onChange={setGenre}
              ariaLabel={t("genre")}
              variant="pill"
              options={[
                { value: ALL_FILTER, label: t("all") },
                ...genreOptions.map((item) => ({ value: item, label: item }))
              ]}
            />
          </label>

          <label>
            <span className="sr-only">{t("mood")}</span>
            <UiSelect
              value={mood}
              onChange={setMood}
              ariaLabel={t("mood")}
              variant="pill"
              options={[
                { value: ALL_FILTER, label: t("selectMood") },
                ...moods.map((item) => ({ value: item, label: moodLabel(item, language) }))
              ]}
            />
          </label>

          <label>
            <span className="sr-only">{t("useCase")}</span>
            <UiSelect
              value={useCase}
              onChange={setUseCase}
              ariaLabel={t("useCase")}
              variant="pill"
              options={[
                { value: ALL_FILTER, label: t("selectUseCase") },
                ...useCases.map((item) => ({ value: item, label: usageLabel(item, language) }))
              ]}
            />
          </label>

          <label>
            <span className="sr-only">{t("deliverySpeed")}</span>
            <UiSelect
              value={deliverySpeed}
              onChange={setDeliverySpeed}
              ariaLabel={t("deliverySpeed")}
              variant="pill"
              options={[
                { value: ALL_FILTER, label: t("selectDelivery") },
                ...deliverySpeeds.map((item) => ({
                  value: item,
                  label: deliverySpeedLabel(item, language)
                }))
              ]}
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.8fr_0.76fr_auto]">
          <label className="flex h-12 items-center gap-3 rounded-full border border-white/10 bg-black/35 px-4">
            <SlidersHorizontal size={18} className="text-white/45" />
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="w-full accent-jam-mint"
            />
            <span className="w-20 text-right text-sm text-white/62">
              {currency(Number(maxPrice), language, currencyCode, usdTryRate)}
            </span>
          </label>

          <label className="flex h-12 items-center gap-3 rounded-full border border-white/10 bg-black/35 px-4">
            <ArrowDownUp size={17} className="text-white/45" />
            <span className="sr-only">{t("sort")}</span>
            <UiSelect
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
              ariaLabel={t("sort")}
              variant="ghost"
              className="min-w-0 flex-1"
              options={[
                { value: "recommended", label: t("sortRecommended") },
                { value: "low-price", label: t("sortLowPrice") },
                { value: "high-price", label: t("sortHighPrice") },
                { value: "newest", label: t("sortNewest") }
              ]}
            />
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            <X size={16} />
            {t("reset")}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/38">
            {t("quickFilters")}
          </span>
          {[
            { key: "instant" as QuickFilter, label: t("quickInstant"), icon: Zap },
            { key: "verified" as QuickFilter, label: t("quickVerified"), icon: ShieldCheck },
            { key: "stems" as QuickFilter, label: t("quickStems"), icon: SlidersHorizontal },
            { key: "commercial" as QuickFilter, label: t("quickCommercial"), icon: BriefcaseBusiness },
            { key: "exclusive" as QuickFilter, label: t("quickExclusive"), icon: Crown }
          ].map((filter) => {
            const Icon = filter.icon;
            const active = quickFilters.includes(filter.key);
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => toggleQuickFilter(filter.key)}
                className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-jam-mint bg-jam-mint text-black"
                    : "border-white/10 bg-black/24 text-white/60 hover:border-white/20 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/56">
          {filteredListings.length} {t("listingsFound")}
        </p>
        <p className="hidden text-sm text-white/42 sm:block">
          {t("marketplaceHint")}
        </p>
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} priority={index < 3} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.035] p-10 text-center">
          <p className="text-lg font-semibold text-white">{t("noListings")}</p>
          <p className="mt-2 text-sm text-white/54">
            {t("noListingsHint")}
          </p>
        </div>
      )}
    </div>
  );
}
