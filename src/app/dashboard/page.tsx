"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck, Search, Sparkles, Store, Upload } from "lucide-react";
import { DashboardState } from "@/components/dashboard-state";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { useI18n } from "@/components/language-provider";
import { currency } from "@/lib/format";
import { useDashboardData } from "@/lib/use-dashboard-data";

export default function DashboardPage() {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const selling = useDashboardData("creator");
  const buying = useDashboardData("buyer");

  if (selling.state.status === "signed-out" || buying.state.status === "signed-out") {
    return <DashboardState status="signed-out" />;
  }

  if (selling.state.status === "loading" || buying.state.status === "loading") {
    return <DashboardState status="loading" />;
  }

  if (selling.state.status === "error" && buying.state.status === "error") {
    return (
      <DashboardState
        status="error"
        message={selling.state.message}
        onRetry={() => {
          selling.retry();
          buying.retry();
        }}
      />
    );
  }

  const sellingReady = selling.state.status === "ready" ? selling.state : null;
  const buyingReady = buying.state.status === "ready" ? buying.state : null;
  const listedCount = sellingReady?.listings.length ?? 0;
  const soldRequestCount = sellingReady?.orders.length ?? 0;
  const buyingRequestCount = buyingReady?.orders.length ?? 0;
  const revenuePreview =
    sellingReady?.orders.reduce((sum, order) => sum + order.price, 0) ?? 0;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_18%_10%,rgba(88,197,255,0.20),transparent_22rem),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-soft sm:p-8">
        <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-full border border-jam-blue/20 bg-jam-blue/10 blur-2xl sm:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={t("accountDashboardEyebrow")}
          title={t("accountDashboardTitle")}
          description={t("accountDashboardDescription")}
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/76 transition hover:bg-white/8 hover:text-white"
          >
            <Search size={18} />
            {t("findTalent")}
          </Link>
          <Link
            href="/upload"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
          >
            <Upload size={18} />
            {t("newListing")}
          </Link>
        </div>
      </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <StatCard label={t("activeListings")} value={listedCount.toString()} detail={t("profileStorefront")} />
        <StatCard label={t("openRequests")} value={soldRequestCount.toString()} detail={t("sellerRequests")} />
        <StatCard label={t("sentBriefs")} value={buyingRequestCount.toString()} detail={t("buyerWorkspace")} />
        <StatCard
          label={t("projectedRevenue")}
          value={currency(revenuePreview, language, currencyCode, usdTryRate)}
          detail={t("noRealPayment")}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard
          icon={<Store size={22} />}
          accent={<Sparkles size={18} />}
          title={t("sellerModeTitle")}
          description={t("sellerModeCopy")}
          href="/dashboard/creator"
          action={t("openSellerWorkspace")}
        />
        <DashboardCard
          icon={<PackageCheck size={22} />}
          accent={<Search size={18} />}
          title={t("buyerModeTitle")}
          description={t("buyerModeCopy")}
          href="/dashboard/buyer"
          action={t("openBuyerWorkspace")}
        />
      </div>
    </section>
  );
}

function DashboardCard({
  icon,
  accent,
  title,
  description,
  href,
  action
}: {
  icon: React.ReactNode;
  accent: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="focus-ring group relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.032))] p-6 shadow-soft transition hover:-translate-y-1 hover:border-jam-blue/40 hover:bg-jam-blue/10"
    >
      <span className="absolute right-4 top-4 text-jam-blue/35 transition group-hover:scale-110 group-hover:text-jam-blue">
        {accent}
      </span>
      <span className="flex h-12 w-12 items-center justify-center rounded-md border border-jam-blue/20 bg-jam-blue/15 text-jam-blue">
        {icon}
      </span>
      <h2 className="mt-5 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-white/54">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-jam-blue">
        {action}
        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
