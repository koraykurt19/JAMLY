"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookmarkCheck,
  GitCompareArrows,
  Heart,
  MessageCircle,
  PackageCheck,
  Search,
  Star
} from "lucide-react";
import { CreativeBriefBuilder } from "@/components/creative-brief-builder";
import { SectionHeading } from "@/components/section-heading";
import { ShortlistButton } from "@/components/shortlist-button";
import { StatCard } from "@/components/stat-card";
import { useI18n } from "@/components/language-provider";
import { creators, listings, orderRequests } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";
import { deliverySpeedLabel, orderStatusLabel } from "@/lib/labels";
import { localizeCreator, localizeListing, localizeOrder } from "@/lib/i18n";
import { useShortlist } from "@/lib/use-shortlist";

const DEFAULT_SHORTLIST = ["night-shift-bounce", "velvet-hook-package"];

export default function BuyerDashboardPage() {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const shortlist = useShortlist(DEFAULT_SHORTLIST);
  const buyerOrders = orderRequests.map((order) => localizeOrder(order, language));
  const localizedListings = listings.map((listing) => localizeListing(listing, language));
  const savedListings = localizedListings.filter((listing) =>
    shortlist.ids.includes(listing.id)
  );
  const localizedCreators = creators.map((creator) => localizeCreator(creator, language));

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={t("buyerDashboardEyebrow")}
          title={t("buyerDashboardTitle")}
          description={t("buyerDashboardDescription")}
        />
        <Link
          href="/marketplace"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-jam-mint"
        >
          <Search size={18} />
          {t("findTalent")}
        </Link>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <StatCard label={t("openRequests")} value={buyerOrders.length.toString()} detail={t("demoOrderFlow")} />
        <StatCard label={t("savedListings")} value={savedListings.length.toString()} detail={t("readyCompare")} />
        <StatCard label={t("savedSearches")} value="3" detail={t("jamMatchTitle")} />
        <StatCard label={t("pendingReplies")} value="2" detail={t("avgResponse")} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <StatCard label={t("avgResponse")} value={language === "tr" ? "2 saat" : "2 hours"} detail={t("premiumStandard")} />
        <StatCard label={t("sentBriefs")} value="4" detail={t("briefBuilderTitle")} />
        <StatCard
          label={t("spendPreview")}
          value={currency(499, language, currencyCode, usdTryRate)}
          detail={t("noRealPayment")}
        />
        <StatCard label={t("compareQueue")} value={savedListings.length.toString()} detail={t("buyerComparison")} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/[0.045]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{t("orderRequests")}</h2>
                <p className="mt-1 text-sm text-white/48">{t("requestStateOnly")}</p>
              </div>
              <PackageCheck size={20} className="text-jam-mint" />
            </div>
            <div className="divide-y divide-white/8">
              {buyerOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/listing/${order.listingId}`}
                  className="block p-5 transition hover:bg-white/[0.035]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{order.listingTitle}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {t("creatorLabel")}: {order.creatorName} /{" "}
                        {shortDate(order.createdAt, language)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/62">
                      {orderStatusLabel(order.status, language)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-white/50">
                    <span>{t("budgetIntent")}</span>
                    <span className="font-semibold text-white">
                      {currency(order.price, language, currencyCode, usdTryRate)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <CreativeBriefBuilder />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/[0.045]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{t("savedListingsTitle")}</h2>
                <p className="mt-1 text-sm text-white/48">{t("shortlistHint")}</p>
              </div>
              <Heart size={20} className="text-jam-coral" />
            </div>
            <div className="grid gap-3 p-5">
              {savedListings.length > 0 ? (
                savedListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-black/24 p-3 transition hover:border-white/20 hover:bg-white/[0.035]"
                  >
                    <Image
                      src={listing.coverImageUrl}
                      alt={listing.title}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <Link href={`/listing/${listing.id}`} className="min-w-0">
                      <p className="truncate font-semibold text-white">{listing.title}</p>
                      <p className="mt-1 text-sm text-white/48">
                        {listing.genre} / {listing.creatorName}
                      </p>
                    </Link>
                    <ShortlistButton listingId={listing.id} compact />
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-white/14 p-5 text-sm text-white/46">
                  {t("emptyShortlist")}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{t("buyerComparison")}</h2>
                <p className="mt-1 text-sm text-white/48">{t("buyerComparisonHint")}</p>
              </div>
              <GitCompareArrows size={20} className="text-jam-blue" />
            </div>
            <div className="grid gap-3 p-5">
              {savedListings.slice(0, 3).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="rounded-lg border border-white/10 bg-black/24 p-4 transition hover:bg-white/[0.035]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{listing.title}</p>
                      <p className="mt-1 text-sm text-white/48">{listing.deliverables[0]}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {currency(listing.price, language, currencyCode, usdTryRate)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/52">
                    <span className="rounded-full bg-white/[0.06] px-2 py-1">
                      {listing.turnaround}
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-1">
                      {deliverySpeedLabel(listing.deliverySpeed, language)}
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-1">
                      {listing.filesIncluded[0]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-semibold text-white">{t("creatorsToWatch")}</h2>
            <div className="mt-4 grid gap-3">
              {localizedCreators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/creators/${creator.handle}`}
                  className="flex items-center justify-between rounded-lg bg-black/24 p-3 transition hover:bg-white/[0.035]"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={creator.avatarUrl}
                      alt={creator.name}
                      width={42}
                      height={42}
                      className="h-[42px] w-[42px] rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-white">{creator.name}</p>
                      <p className="text-sm text-white/48">{creator.specialties[0]}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-jam-gold">
                    <Star size={14} />
                    {creator.rating}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <BookmarkCheck size={20} className="text-jam-mint" />
              <p className="mt-3 text-sm font-semibold text-white">{t("savedSearches")}</p>
              <p className="mt-1 text-2xl font-semibold text-white">3</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <MessageCircle size={20} className="text-jam-blue" />
              <p className="mt-3 text-sm font-semibold text-white">{t("pendingReplies")}</p>
              <p className="mt-1 text-2xl font-semibold text-white">2</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
