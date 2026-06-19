"use client";

import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { SectionHeading } from "@/components/section-heading";
import { useI18n } from "@/components/language-provider";
import { listings } from "@/lib/data";
import { localizeListing } from "@/lib/i18n";

export default function MarketplacePage() {
  const { language, t } = useI18n();
  const localizedListings = listings.map((listing) => localizeListing(listing, language));

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={t("marketplaceEyebrow")}
          title={t("marketplaceTitle")}
          description={t("marketplaceDescription")}
        />
        <div className="rounded-lg border border-white/10 bg-white/[0.045] px-5 py-4 text-sm text-white/58">
          <span className="font-semibold text-white">{localizedListings.length}</span>{" "}
          {t("demoListingsReady")}
        </div>
      </div>

      <MarketplaceBrowser listings={localizedListings} />
    </section>
  );
}
