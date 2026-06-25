"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { creators, getFeaturedListings } from "@/lib/data";
import { localizeCreator, localizeListing } from "@/lib/i18n";
import { useI18n } from "@/components/language-provider";

const heroImage =
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=85";

export default function LandingPage() {
  const { language, t } = useI18n();
  const featuredListings = getFeaturedListings().map((listing) =>
    localizeListing(listing, language)
  );
  const spotlightCreator = localizeCreator(creators[0], language);

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <Image
          src={heroImage}
          alt={language === "tr" ? "Premium stüdyoda kayıt alan sanatçı" : "Artist recording in a premium studio"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/72" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.42),#050608_96%)]" />

        <div className="relative mx-auto flex min-h-[calc(88vh-5rem)] w-full max-w-7xl flex-col justify-end px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="max-w-4xl pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-jam-mint">
              {t("heroEyebrow")}
            </p>
            <h1 className="mt-5 text-6xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              {t("heroDescription")}
            </p>
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

          <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
            <StatCard label={t("statCategories")} value="6" detail={t("statCategoriesDetail")} />
            <StatCard label={t("statOrderFlow")} value={t("statOrderFlowValue")} detail={t("statOrderFlowDetail")} />
            <StatCard label={t("statSupabase")} value="Auth + DB" detail={t("statSupabaseDetail")} />
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
          {featuredListings.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} priority={index === 0} />
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
