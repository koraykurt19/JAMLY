"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  Settings,
  Sparkles,
  Star,
  XCircle
} from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { SocialLinkList } from "@/components/social-link-list";
import { StatCard } from "@/components/stat-card";
import { StartConversationButton } from "@/components/start-conversation-button";
import { useI18n } from "@/components/language-provider";
import { useCurrentAccount } from "@/lib/use-current-account";
import { localizeCreator, localizeListing } from "@/lib/i18n";
import type { Creator, Listing } from "@/lib/types";

type CreatorProfileViewProps = {
  creator: Creator;
  listings: Listing[];
};

export function CreatorProfileView({ creator, listings }: CreatorProfileViewProps) {
  const { language, t } = useI18n();
  const account = useCurrentAccount();
  const localizedCreator = localizeCreator(creator, language);
  const localizedListings = listings.map((listing) => localizeListing(listing, language));
  const accountProfile = account.state.status === "signed-in" ? account.state.profile : null;
  const isOwnProfile =
    accountProfile !== null &&
    (accountProfile.id === localizedCreator.id ||
      accountProfile.handle === localizedCreator.handle ||
      normalizeComparableName(accountProfile.fullName) ===
        normalizeComparableName(localizedCreator.name));
  const isAccountLoading = account.state.status === "loading";
  const hasFitSignals =
    localizedCreator.bestFor.length > 0 || localizedCreator.notBestFor.length > 0;
  const hasWorkflowPanels =
    localizedCreator.workflow.length > 0 || localizedCreator.requirements.length > 0;

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="relative h-[360px]">
          <Image
            src={localizedCreator.coverUrl}
            alt={
              language === "tr"
                ? `${localizedCreator.name} kapak görseli`
                : `${localizedCreator.name} cover image`
            }
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-jam-ink via-black/46 to-black/24" />
        </div>
        <div className="mx-auto -mt-28 w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="relative flex flex-col gap-6 rounded-lg border border-white/10 bg-jam-panel/84 p-5 shadow-soft backdrop-blur-2xl md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <Image
                src={localizedCreator.avatarUrl}
                alt={localizedCreator.name}
                width={128}
                height={128}
                className="h-28 w-28 rounded-lg border-4 border-jam-panel object-cover"
              />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">
                    {localizedCreator.name}
                  </h1>
                  {localizedCreator.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-jam-blue/15 px-3 py-1 text-sm font-semibold text-jam-blue">
                      <BadgeCheck size={15} />
                      {t("verified")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/66">
                  {localizedCreator.headline}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/56">
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} />
                    {localizedCreator.location}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Star size={16} className="text-jam-gold" />
                    {localizedCreator.rating} {t("ratingSuffix")}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} />
                    {t("respondsIn")}: {localizedCreator.responseTime}
                  </span>
                </div>
                <div className="mt-4">
                  <SocialLinkList links={localizedCreator.socialLinks} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isOwnProfile ? (
                <Link
                  href="/dashboard/creator"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-white/12 px-5 py-3 text-sm font-bold text-white/78 transition hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white"
                >
                  <Settings size={17} />
                  {language === "tr" ? "Profili düzenle" : "Edit profile"}
                </Link>
              ) : isAccountLoading ? null : (
                <StartConversationButton
                  artistId={localizedCreator.id}
                  variant="secondary"
                />
              )}
              <Link
                href="/marketplace"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-jam-mint"
              >
                {t("creatorProfileWork")}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <aside className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
            <h2 className="text-lg font-semibold text-white">{t("about")}</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">{localizedCreator.about}</p>
            {localizedCreator.specialties.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {localizedCreator.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-white/62"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {hasFitSignals ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
              {localizedCreator.bestFor.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-jam-mint" />
                    <h2 className="text-lg font-semibold text-white">{t("bestFor")}</h2>
                  </div>
                  <SignalList items={localizedCreator.bestFor} positive />
                </>
              ) : null}
              {localizedCreator.notBestFor.length > 0 ? (
                <>
                  <div className="mt-5 flex items-center gap-2">
                    <XCircle size={18} className="text-jam-coral" />
                    <h2 className="text-lg font-semibold text-white">{t("notBestFor")}</h2>
                  </div>
                  <SignalList items={localizedCreator.notBestFor} />
                </>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
            <h2 className="text-lg font-semibold text-white">{t("trustSignals")}</h2>
            <div className="mt-4 grid gap-3">
              <TrustMeter label={t("repeatBuyerRate")} value={localizedCreator.repeatBuyerRate} />
              <TrustMeter label={t("responseRate")} value={localizedCreator.responseRate} />
              <TrustMeter label={t("profileStrength")} value={localizedCreator.profileStrength} />
            </div>
          </div>
          <div className="grid gap-3">
            <StatCard label={t("completedOrders")} value={`${localizedCreator.completedOrders}+`} />
            <StatCard label={t("averageRating")} value={localizedCreator.rating.toString()} />
            <StatCard label={t("portfolioListings")} value={localizedListings.length.toString()} />
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-jam-mint">
                {t("portfolio")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {t("beatsServices")}
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {localizedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {hasWorkflowPanels ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {localizedCreator.workflow.length > 0 ? (
                <InfoPanel title={t("workflow")} items={localizedCreator.workflow} numbered />
              ) : null}
              {localizedCreator.requirements.length > 0 ? (
                <InfoPanel title={t("requirements")} items={localizedCreator.requirements} />
              ) : null}
            </div>
          ) : null}

          {localizedCreator.faq.length > 0 ? (
            <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.045] p-6">
              <div className="flex items-center gap-2">
                <HelpCircle size={19} className="text-jam-blue" />
                <h2 className="text-xl font-semibold text-white">{t("creatorFaq")}</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {localizedCreator.faq.map((item) => (
                  <div key={item.question} className="rounded-lg border border-white/10 bg-black/24 p-4">
                    <p className="font-semibold text-white">{item.question}</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function normalizeComparableName(value: string) {
  return value.trim().toLowerCase();
}

function SignalList({ items, positive = false }: { items: string[]; positive?: boolean }) {
  return (
    <div className="mt-3 grid gap-2">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-2 text-sm text-white/62">
          {positive ? (
            <CheckCircle2 size={15} className="text-jam-mint" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-white/28" />
          )}
          {item}
        </span>
      ))}
    </div>
  );
}

function TrustMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/24 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-white/58">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-jam-mint" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InfoPanel({
  title,
  items,
  numbered = false
}: {
  title: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <div key={item} className="flex items-start gap-3 rounded-lg bg-black/24 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jam-mint text-xs font-bold text-black">
              {numbered ? index + 1 : <CheckCircle2 size={15} />}
            </span>
            <p className="text-sm leading-6 text-white/64">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
