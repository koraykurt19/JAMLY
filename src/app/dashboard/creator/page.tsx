"use client";

import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Clock,
  Eye,
  Heart,
  Inbox,
  PlayCircle,
  Plus,
  TrendingUp
} from "lucide-react";
import { CreatorReadiness } from "@/components/creator-readiness";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { useI18n } from "@/components/language-provider";
import { getCreatorListings, orderRequests } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";
import { categoryLabel, licenseLabel, orderStatusLabel } from "@/lib/labels";
import { localizeListing, localizeOrder, splitMessageList } from "@/lib/i18n";

const creatorId = "creator-mira";
const rawCreatorListings = getCreatorListings(creatorId);
const rawCreatorOrders = orderRequests.filter((order) => order.creatorName === "Mira Voss");

export default function CreatorDashboardPage() {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const creatorListings = rawCreatorListings.map((listing) =>
    localizeListing(listing, language)
  );
  const creatorOrders = rawCreatorOrders.map((order) => localizeOrder(order, language));
  const nextTargets = splitMessageList(t("nextBuildTargetItems"));
  const revenue = creatorOrders.reduce((sum, order) => sum + order.price, 0);
  const totalViews = creatorListings.reduce((sum, listing) => sum + listing.analytics.views, 0);
  const totalSaves = creatorListings.reduce((sum, listing) => sum + listing.analytics.saves, 0);
  const totalPlays = creatorListings.reduce((sum, listing) => sum + listing.analytics.plays, 0);
  const averageConversion =
    creatorListings.reduce((sum, listing) => sum + listing.analytics.conversionRate, 0) /
    Math.max(creatorListings.length, 1);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={t("creatorDashboardEyebrow")}
          title={t("creatorDashboardTitle")}
          description={t("creatorDashboardDescription")}
        />
        <Link
          href="/upload"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
        >
          <Plus size={18} />
          {t("newListing")}
        </Link>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <StatCard
          label={t("activeListings")}
          value={creatorListings.length.toString()}
          detail={t("activeListingsDetail")}
        />
        <StatCard
          label={t("openRequests")}
          value={creatorOrders.length.toString()}
          detail={t("demoOrderFlow")}
        />
        <StatCard
          label={t("projectedRevenue")}
          value={currency(revenue, language, currencyCode, usdTryRate)}
          detail={t("fromDemoRequests")}
        />
        <StatCard label={t("responseTarget")} value={language === "tr" ? "2 saat" : "2 hours"} detail={t("premiumStandard")} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <StatCard label={t("listingViews")} value={totalViews.toLocaleString()} detail={t("analytics")} />
        <StatCard label={t("listingSaves")} value={totalSaves.toLocaleString()} detail={t("shortlist")} />
        <StatCard label={t("previewPlays")} value={totalPlays.toLocaleString()} detail={t("preview")} />
        <StatCard
          label={t("conversionRate")}
          value={`${averageConversion.toFixed(1)}%`}
          detail={t("requestOrder")}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045]">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h2 className="text-xl font-semibold text-white">{t("publishedListings")}</h2>
              <p className="mt-1 text-sm text-white/48">{t("inventoryHint")}</p>
            </div>
            <TrendingUp size={20} className="text-jam-mint" />
          </div>
          <div className="divide-y divide-white/8">
            {creatorListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="grid gap-4 p-5 transition hover:bg-white/[0.035] sm:grid-cols-[72px_1fr_auto]"
              >
                <Image
                  src={listing.coverImageUrl}
                  alt={listing.title}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-white">{listing.title}</p>
                  <p className="mt-1 text-sm text-white/50">
                    {categoryLabel(listing.category, language)} / {listing.genre} /{" "}
                    {licenseLabel(listing.licenseType, language)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/52"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/48">
                    <MetricChip icon={Eye} value={listing.analytics.views.toLocaleString()} />
                    <MetricChip icon={Heart} value={listing.analytics.saves.toLocaleString()} />
                    <MetricChip icon={PlayCircle} value={listing.analytics.plays.toLocaleString()} />
                    <MetricChip icon={BarChart3} value={`${listing.analytics.conversionRate}%`} />
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-white">
                    {currency(listing.price, language, currencyCode, usdTryRate)}
                  </p>
                  <p className="mt-1 text-sm text-white/46">{listing.turnaround}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/[0.045]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{t("orderRequests")}</h2>
                <p className="mt-1 text-sm text-white/48">{t("buyerIntent")}</p>
              </div>
              <Inbox size={20} className="text-jam-blue" />
            </div>
            <div className="space-y-3 p-5">
              {creatorOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-white/10 bg-black/24 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{order.listingTitle}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {t("buyer")}: {order.buyerName}
                      </p>
                    </div>
                    <span className="rounded-full bg-jam-gold/15 px-3 py-1 text-xs font-semibold text-jam-gold">
                      {orderStatusLabel(order.status, language)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-white/50">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      {shortDate(order.createdAt, language)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-white">
                      <Banknote size={14} />
                      {currency(order.price, language, currencyCode, usdTryRate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CreatorReadiness />

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-jam-blue" />
              <h2 className="text-xl font-semibold text-white">{t("profileTips")}</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-white/56">
              {[
                t("quickStems"),
                t("audioMarkers"),
                t("revisionPolicy")
              ].map((item) => (
                <div key={item} className="rounded-md bg-black/24 px-3 py-2">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-semibold text-white">{t("nextBuildTargets")}</h2>
            <div className="mt-4 space-y-3 text-sm text-white/56">
              {nextTargets.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-md bg-black/24 px-3 py-2"
                >
                  <span>{item}</span>
                  <ArrowRight size={15} className="text-white/36" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricChip({
  icon: Icon,
  value
}: {
  icon: ElementType;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/24 px-2 py-1">
      <Icon size={13} />
      {value}
    </span>
  );
}
