"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Crown,
  FileAudio,
  Layers3,
  Loader2,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/language-provider";
import {
  beatLicenseTiers,
  getBeatLicenseCopy,
  getBeatLicensePrice,
  isBeatLicenseListing,
  licenseLegalNotice
} from "@/lib/beat-licenses";
import { currency } from "@/lib/format";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { getCurrentProfile, purchaseBeatLicense } from "@/lib/supabase-data";
import type { BeatLicenseTier, Listing } from "@/lib/types";

type AccountState = "checking" | "demo" | "signed-out" | "ready" | "own-listing";
type PurchaseState = "idle" | "loading" | "success" | "error";

const tierIcons: Record<BeatLicenseTier, ElementType> = {
  nonExclusive: FileAudio,
  unlimited: Layers3,
  exclusive: Crown
};

export function LicenseCheckout({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const [selectedTier, setSelectedTier] = useState<BeatLicenseTier>("nonExclusive");
  const [accountState, setAccountState] = useState<AccountState>(() =>
    isSupabaseConfigured() && isUuid(listing.id) ? "checking" : "demo"
  );
  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  const available =
    isBeatLicenseListing(listing) && listing.isActive && !listing.exclusiveSold;
  const selectedCopy = getBeatLicenseCopy(selectedTier, language);
  const selectedPrice = getBeatLicensePrice(listing, selectedTier);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !isUuid(listing.id)) return;

    let active = true;
    getCurrentProfile(client)
      .then(({ user }) => {
        if (!active) return;
        if (!user) {
          setAccountState("signed-out");
        } else if (user.id === listing.creatorId) {
          setAccountState("own-listing");
        } else {
          setAccountState("ready");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isSupabaseRecoverableError(error)) {
          setAccountState("demo");
          return;
        }
        setAccountState("signed-out");
        setMessage(error instanceof Error ? error.message : t("unknownError"));
      });

    return () => {
      active = false;
    };
  }, [listing.creatorId, listing.id, t]);

  async function completePurchase() {
    if (!available || purchaseState === "loading") return;

    if (accountState === "demo") {
      setPurchaseState("success");
      setMessage(t("mockPurchaseCopy"));
      return;
    }

    if (accountState !== "ready") return;

    const client = getSupabaseBrowserClient();
    if (!client || !isUuid(listing.id)) {
      setPurchaseState("error");
      setMessage(t("purchaseFailed"));
      return;
    }

    setPurchaseState("loading");
    setMessage("");
    try {
      const createdOrderId = await purchaseBeatLicense(
        client,
        listing.id,
        selectedTier,
        `${listing.title} - ${selectedCopy.name}`
      );
      setOrderId(createdOrderId);
      setPurchaseState("success");
      setMessage(t("licensePurchaseRecorded"));
      router.prefetch(`/orders/${createdOrderId}`);
    } catch (error) {
      if (isSupabaseRecoverableError(error)) {
        setAccountState("demo");
        setPurchaseState("success");
        setMessage(t("mockPurchaseCopy"));
        return;
      }
      setPurchaseState("error");
      setMessage(
        `${t("purchaseFailed")}: ${
          error instanceof Error ? error.message : t("unknownError")
        }`
      );
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/listing/${listing.id}`}
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/68 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
      >
        <ArrowLeft size={16} />
        {t("backToListing")}
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-jam-blue">
              {t("checkoutEyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              {t("checkoutTitle")}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/56 sm:text-base">
              {t("checkoutDescription")}
            </p>
          </div>

          {!available ? (
            <div className="mt-8 rounded-lg border border-jam-gold/25 bg-jam-gold/10 p-5">
              <h2 className="font-semibold text-jam-gold">
                {listing.exclusiveSold ? t("exclusiveSoldTitle") : t("checkoutUnavailable")}
              </h2>
              {listing.exclusiveSold ? (
                <p className="mt-2 text-sm leading-6 text-white/58">
                  {t("exclusiveSoldCopy")}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {beatLicenseTiers.map((tier) => (
              <LicenseCard
                key={tier}
                tier={tier}
                listing={listing}
                language={language}
                currencyCode={currencyCode}
                usdTryRate={usdTryRate}
                selected={selectedTier === tier}
                disabled={!available || purchaseState === "success"}
                onSelect={() => setSelectedTier(tier)}
              />
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-white/48">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-jam-blue" />
            <span>{licenseLegalNotice[language]}</span>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-white/10 bg-white/[0.055] p-5 lg:sticky lg:top-24">
          <div className="grid grid-cols-[64px_1fr] gap-4 border-b border-white/10 pb-5">
            <Image
              src={listing.coverImageUrl}
              alt={listing.title}
              width={64}
              height={64}
              className="h-16 w-16 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{listing.title}</p>
              <p className="mt-1 text-sm text-white/46">
                {listing.creatorName} / {listing.bpm ? `${listing.bpm} BPM` : listing.genre}
              </p>
            </div>
          </div>

          <div className="py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
              {t("selectedLicense")}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{selectedCopy.name}</p>
            <p className="mt-1 text-sm text-jam-blue">{selectedCopy.qualifier}</p>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
              {t("includedFiles")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCopy.files.map((file) => (
                <span
                  key={file}
                  className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-xs text-white/62"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-5">
            <span className="text-sm text-white/48">{t("orderTotal")}</span>
            <span className="text-2xl font-semibold text-white">
              {currency(selectedPrice, language, currencyCode, usdTryRate)}
            </span>
          </div>

          <CheckoutAction
            accountState={accountState}
            purchaseState={purchaseState}
            available={available}
            orderId={orderId}
            onPurchase={completePurchase}
          />

          {selectedTier === "exclusive" && available ? (
            <p className="mt-3 text-xs leading-5 text-jam-gold">
              {t("exclusiveRemovesListing")}
            </p>
          ) : null}
          {message ? (
            <p
              className={`mt-3 text-sm leading-6 ${
                purchaseState === "error" ? "text-red-300" : "text-jam-mint"
              }`}
            >
              {message}
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function LicenseCard({
  tier,
  listing,
  language,
  currencyCode,
  usdTryRate,
  selected,
  disabled,
  onSelect
}: {
  tier: BeatLicenseTier;
  listing: Listing;
  language: "tr" | "en";
  currencyCode: "USD" | "TRY";
  usdTryRate: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  const copy = getBeatLicenseCopy(tier, language);
  const Icon = tierIcons[tier];

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`focus-ring flex min-h-[430px] flex-col rounded-lg border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
        selected
          ? "border-jam-blue/70 bg-jam-blue/10 shadow-soft"
          : "border-white/10 bg-white/[0.045] hover:border-white/22 hover:bg-white/[0.065]"
      }`}
    >
      <span className="flex w-full items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-black/25 text-jam-blue">
          <Icon size={20} />
        </span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            selected ? "border-jam-blue bg-jam-blue text-black" : "border-white/20"
          }`}
        >
          {selected ? <Check size={15} /> : null}
        </span>
      </span>

      <span className="mt-5 text-lg font-semibold text-white">{copy.name}</span>
      <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-jam-blue">
        {copy.qualifier}
      </span>
      <span className="mt-4 text-2xl font-semibold text-white">
        {currency(getBeatLicensePrice(listing, tier), language, currencyCode, usdTryRate)}
      </span>
      <span className="mt-3 text-sm leading-6 text-white/52">{copy.summary}</span>

      <span className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/36">
        {t("licenseTerms")}
      </span>
      <span className="mt-3 grid gap-2">
        {copy.terms.map((term) => (
          <span key={term} className="flex items-start gap-2 text-sm leading-5 text-white/62">
            <Check size={14} className="mt-0.5 shrink-0 text-jam-mint" />
            {term}
          </span>
        ))}
      </span>

      <span className="mt-auto pt-5 text-sm font-semibold text-jam-blue">
        {selected ? t("selectedLicense") : t("chooseLicense")}
      </span>
    </button>
  );
}

function CheckoutAction({
  accountState,
  purchaseState,
  available,
  orderId,
  onPurchase
}: {
  accountState: AccountState;
  purchaseState: PurchaseState;
  available: boolean;
  orderId: string | null;
  onPurchase: () => void;
}) {
  const { t } = useI18n();

  if (orderId) {
    return (
      <Link
        href={`/orders/${orderId}`}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
      >
        {t("viewOrder")}
      </Link>
    );
  }

  if (accountState === "signed-out") {
    return (
      <div className="mt-5">
        <Link
          href="/auth/sign-in"
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-jam-mint"
        >
          <LockKeyhole size={17} />
          {t("navSignIn")}
        </Link>
        <p className="mt-3 text-xs leading-5 text-white/46">
          {t("livePurchaseRequiresAuth")}
        </p>
      </div>
    );
  }

  if (accountState === "own-listing") {
    return <p className="mt-5 text-sm leading-6 text-jam-gold">{t("ownListingPurchaseBlocked")}</p>;
  }

  return (
    <div className="mt-5">
      {accountState === "demo" ? (
        <p className="mb-3 rounded-md border border-jam-blue/20 bg-jam-blue/10 p-3 text-xs leading-5 text-jam-blue">
          {purchaseState === "success" ? t("mockPurchaseComplete") : t("demoCheckoutNotice")}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onPurchase}
        disabled={
          !available ||
          accountState === "checking" ||
          purchaseState === "loading" ||
          purchaseState === "success"
        }
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
      >
        {accountState === "checking" || purchaseState === "loading" ? (
          <Loader2 size={17} className="animate-spin" />
        ) : null}
        {purchaseState === "loading" ? t("completingPurchase") : t("purchaseLicense")}
      </button>
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
