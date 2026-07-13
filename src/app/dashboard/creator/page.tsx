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
import { CreatorProfileEditor } from "@/components/creator-profile-editor";
import { CreatorReadiness } from "@/components/creator-readiness";
import { DashboardState } from "@/components/dashboard-state";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { useI18n } from "@/components/language-provider";
import { currency, shortDate } from "@/lib/format";
import { categoryLabel, licenseLabel, orderStatusLabel } from "@/lib/labels";
import { localizeListing, localizeOrder, splitMessageList } from "@/lib/i18n";
import { useDashboardData } from "@/lib/use-dashboard-data";
import { getBeatLicenseCopy, isBeatLicenseListing } from "@/lib/beat-licenses";

export default function CreatorDashboardPage() {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const dashboard = useDashboardData("creator");

  if (dashboard.state.status !== "ready") {
    return (
      <DashboardState
        status={dashboard.state.status}
        message={dashboard.state.status === "error" ? dashboard.state.message : undefined}
        onRetry={dashboard.retry}
      />
    );
  }

  const creatorListings = dashboard.state.listings.map((listing) =>
    localizeListing(listing, language)
  );
  const creatorOrders = dashboard.state.orders.map((order) => localizeOrder(order, language));
  const isDemo = dashboard.state.isDemo;
  const creatorProfile = dashboard.state.profile;
  const nextTargets = splitMessageList(t("nextBuildTargetItems"));
  const revenue = creatorOrders.reduce((sum, order) => sum + order.price, 0);
  const totalViews = creatorListings.reduce((sum, listing) => sum + listing.analytics.views, 0);
  const totalSaves = creatorListings.reduce((sum, listing) => sum + listing.analytics.saves, 0);
  const totalPlays = creatorListings.reduce((sum, listing) => sum + listing.analytics.plays, 0);
  const averageConversion =
    creatorListings.reduce((sum, listing) => sum + listing.analytics.conversionRate, 0) /
    Math.max(creatorListings.length, 1);
  const activeListingCount = creatorListings.filter((listing) => listing.isActive).length;
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US").format(value);

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

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
        {isDemo ? t("demoData") : t("liveData")}
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <StatCard
          label={t("activeListings")}
          value={activeListingCount.toString()}
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
        <StatCard label={t("listingViews")} value={formatNumber(totalViews)} detail={t("analytics")} />
        <StatCard label={t("listingSaves")} value={formatNumber(totalSaves)} detail={t("shortlist")} />
        <StatCard label={t("previewPlays")} value={formatNumber(totalPlays)} detail={t("preview")} />
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
            {creatorListings.length > 0 ? creatorListings.map((listing) => (
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{listing.title}</p>
                    {listing.exclusiveSold ? (
                      <span className="rounded-full bg-jam-gold/15 px-2.5 py-1 text-[11px] font-semibold text-jam-gold">
                        {t("exclusiveSold")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-white/50">
                    {categoryLabel(listing.category, language)} / {listing.genre} /{" "}
                    {isBeatLicenseListing(listing)
                      ? t("threeLicenseOptions")
                      : licenseLabel(listing.licenseType, language)}
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
                    <MetricChip icon={Eye} value={formatNumber(listing.analytics.views)} />
                    <MetricChip icon={Heart} value={formatNumber(listing.analytics.saves)} />
                    <MetricChip icon={PlayCircle} value={formatNumber(listing.analytics.plays)} />
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
            )) : (
              <div className="p-6 text-center">
                <p className="font-semibold text-white">{t("noCreatorListings")}</p>
                <p className="mt-2 text-sm text-white/48">{t("noCreatorListingsCopy")}</p>
                <Link href="/upload" className="focus-ring mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-jam-mint">
                  {t("newListing")}
                </Link>
              </div>
            )}
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
              {creatorOrders.length > 0 ? creatorOrders.map((order) => (
                <Link
                  key={order.id}
                  href={isDemo ? `/listing/${order.listingId}` : `/orders/${order.id}`}
                  className="block rounded-lg border border-white/10 bg-black/24 p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{order.listingTitle}</p>
                      {order.licenseTier !== "service" ? (
                        <p className="mt-1 text-xs font-semibold text-jam-blue">
                          {getBeatLicenseCopy(order.licenseTier, language).name}
                        </p>
                      ) : null}
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
                </Link>
              )) : (
                <div className="rounded-lg border border-dashed border-white/14 p-5 text-center">
                  <p className="font-semibold text-white">{t("noOrderRequests")}</p>
                  <p className="mt-2 text-sm leading-6 text-white/48">{t("noOrderRequestsCopy")}</p>
                </div>
              )}
            </div>
          </div>

          <CreatorReadiness />

          {creatorProfile ? (
            <CreatorProfileEditor
              creator={creatorProfile}
              isDemo={isDemo}
              onSaved={dashboard.retry}
            />
          ) : null}

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
