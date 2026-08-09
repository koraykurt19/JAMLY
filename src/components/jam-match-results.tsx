"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Star,
  type LucideIcon
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { StartConversationButton } from "@/components/start-conversation-button";
import { categoryLabel } from "@/lib/labels";
import type { JamMatchResult } from "@/lib/jam-match";
import {
  formatJamMatchResultPrice,
  jamMatchCopy,
  type JamMatchAnswers,
  type JamMatchStep
} from "@/lib/jam-match-onboarding";
import type { Listing } from "@/lib/types";

export function JamMatchResults({
  answers,
  steps,
  matches,
  dataLabel,
  isLoading,
  onBack,
  onEditStep,
  onRestart
}: {
  answers: JamMatchAnswers;
  steps: JamMatchStep[];
  matches: JamMatchResult[];
  dataLabel: string;
  isLoading: boolean;
  onBack: () => void;
  onEditStep: (index: number) => void;
  onRestart: () => void;
}) {
  const { currencyCode, language, usdTryRate } = useI18n();
  const text = jamMatchCopy[language];

  return (
    <section>
      <div className="flex flex-col gap-4 border-y border-white/10 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const selected = step.options.find((option) => option.id === answers[step.id]);
            return selected ? (
              <button
                key={step.id}
                type="button"
                onClick={() => onEditStep(index)}
                className="focus-ring rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-white/66 transition hover:border-jam-blue/40 hover:text-white"
              >
                {selected.label}
              </button>
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/68 transition hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft size={16} />
            {text.editAnswers}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="focus-ring inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white/48 transition hover:bg-white/8 hover:text-white"
          >
            <RotateCcw size={16} />
            {text.startOver}
          </button>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-white/62">
          {matches.length} {text.resultCount}
        </p>
        <p className="inline-flex items-center gap-2 text-xs text-white/40">
          {isLoading ? <Loader2 size={13} className="animate-spin text-jam-blue" /> : null}
          {dataLabel}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[32rem] animate-pulse rounded-lg border border-white/8 bg-white/[0.04]"
            />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-white/14 bg-white/[0.035] px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/12 text-jam-blue">
            <SlidersHorizontal size={22} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">{text.noResultsTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/52">
            {text.noResultsCopy}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
            >
              {text.adjustAnswers}
              <SlidersHorizontal size={16} />
            </button>
            <Link
              href="/marketplace"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-white/12 px-5 py-3 text-sm font-bold text-white/72 transition hover:bg-white/8 hover:text-white"
            >
              {text.browseManually}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((result, index) => (
            <MatchResultCard
              key={`${result.kind}-${result.kind === "artist" ? result.artistHref : result.listingHref}`}
              result={result}
              priority={index === 0}
              price={formatJamMatchResultPrice(
                result.price,
                result.startsAt,
                language,
                currencyCode,
                usdTryRate
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchResultCard({
  result,
  price,
  priority
}: {
  result: JamMatchResult;
  price: string;
  priority: boolean;
}) {
  const { language } = useI18n();
  const text = jamMatchCopy[language];
  const isArtist = result.kind === "artist";
  const href = isArtist ? result.artistHref : result.listingHref;
  const cta = isArtist ? text.viewArtist : text.requestOffer;
  const kind =
    result.kind === "artist"
      ? text.matchedArtist
      : result.kind === "service"
        ? text.recommendedService
        : text.matchedListing;

  return (
    <article className="flex overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-soft transition hover:-translate-y-1 hover:border-white/20">
      <div className="flex w-full flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.04]">
          <Image
            src={result.coverImageUrl}
            alt={result.listingTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <span className="rounded-md border border-white/14 bg-black/60 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              {kind}
            </span>
            <span className="rounded-md bg-jam-mint px-2.5 py-1.5 text-xs font-bold text-black">
              {result.match}% {text.match}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-3">
            <Image
              src={result.artistAvatarUrl}
              alt={result.artistName}
              width={38}
              height={38}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <Link
                href={result.artistHref}
                className="block truncate text-sm font-semibold text-white transition hover:text-jam-mint"
              >
                {result.artistName}
              </Link>
              <p className="mt-0.5 truncate text-xs text-white/42">
                {categoryLabel(result.category as Listing["category"], language)} / {result.genre}
              </p>
            </div>
          </div>

          <h2 className="mt-4 line-clamp-2 text-xl font-semibold text-white">
            {result.listingTitle}
          </h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/56">{result.description}</p>

          <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/8 py-4">
            <ResultMetric icon={CircleDollarSign} label={text.startingPrice} value={price} />
            <ResultMetric icon={Clock3} label={text.delivery} value={result.deliveryTime} />
            <ResultMetric
              icon={Star}
              label={text.rating}
              value={result.rating.toFixed(1)}
              highlight
            />
          </div>

          {result.reasons.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-white/34">{text.fitSignals}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.reasons.slice(0, 3).map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-xs font-semibold text-white/50"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {isArtist ? (
            <Link
              href={href}
              className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-jam-mint px-4 py-3 text-sm font-bold text-black transition hover:bg-white"
            >
              {cta}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <StartConversationButton
              artistId={result.artistId}
              listingId={result.listingId}
              label="offer"
              className="mt-5"
            />
          )}
        </div>
      </div>
    </article>
  );
}

function ResultMetric({
  icon: Icon,
  label,
  value,
  highlight = false
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1 text-[11px] text-white/34">
        <Icon size={12} className={highlight ? "text-jam-gold" : "text-white/38"} />
        <span className="truncate">{label}</span>
      </span>
      <p className="mt-1 truncate text-xs font-bold text-white sm:text-sm">{value}</p>
    </div>
  );
}
