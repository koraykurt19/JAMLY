"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Search,
  Sparkles,
  Star,
  WandSparkles
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { cn, currency } from "@/lib/format";
import type { Language } from "@/lib/i18n";

type LocalizedText = Record<Language, string>;

const copy: Record<
  Language,
  {
    eyebrow: string;
    headline: string;
    subheadline: string;
    promptLabel: string;
    placeholder: string;
    quickCategories: string;
    budget: string;
    deadline: string;
    anyCategory: string;
    briefSettings: string;
    previewTuned: string;
    findMatch: string;
    browseManually: string;
    resultPreview: string;
    resultTitle: string;
    resultHint: string;
    price: string;
    rating: string;
    confidence: string;
    from: string;
  }
> = {
  tr: {
    eyebrow: "Jam Match",
    headline: "Bugün ne üretiyorsun?",
    subheadline:
      "Jam Match'e ihtiyacını anlat. Projene uygun sanatçıları, beat'leri ve hizmetleri birlikte bulalım.",
    promptLabel: "Proje brief'i",
    placeholder:
      "Örnek: Kadın vokal hook'u olan karanlık bir trap beat arıyorum; 140 BPM, bütçe yaklaşık 150 dolar.",
    quickCategories: "Hızlı kategoriler",
    budget: "Bütçe",
    deadline: "Teslim hedefi",
    anyCategory: "Kategori fark etmez",
    briefSettings: "Brief ayarı",
    previewTuned: "Eşleşme önizlemesi netleşti",
    findMatch: "Eşleşmemi bul",
    browseManually: "Elle göz at",
    resultPreview: "Eşleşme önizlemesi",
    resultTitle: "Jam Match projeyi üç güçlü rotaya ayırır.",
    resultHint: "MVP akışı için örnek sonuçlar",
    price: "Fiyat",
    rating: "Puan",
    confidence: "Brief uyumuna göre eşleşme güveni",
    from: "başlangıç"
  },
  en: {
    eyebrow: "Jam Match",
    headline: "What are you creating today?",
    subheadline:
      "Tell Jam Match what you need. We'll find the right artists and listings for your project.",
    promptLabel: "Project prompt",
    placeholder:
      "Example: I need a dark trap beat with a female vocal hook, 140 BPM, around $150.",
    quickCategories: "Quick categories",
    budget: "Budget",
    deadline: "Deadline",
    anyCategory: "Any category",
    briefSettings: "Brief settings",
    previewTuned: "Preview tuned",
    findMatch: "Find My Match",
    browseManually: "Browse manually",
    resultPreview: "Result preview",
    resultTitle: "Three ways Jam Match can route the project.",
    resultHint: "Mock results for the MVP flow",
    price: "Price",
    rating: "Rating",
    confidence: "Match confidence based on brief fit",
    from: "from"
  }
};

const categoryChips: Array<{ id: string; label: LocalizedText }> = [
  { id: "beat", label: { tr: "Beat", en: "Beat" } },
  { id: "vocal", label: { tr: "Vokal", en: "Vocal" } },
  { id: "mix", label: { tr: "Miks", en: "Mix" } },
  { id: "master", label: { tr: "Master", en: "Master" } },
  { id: "guitar", label: { tr: "Gitar", en: "Guitar" } },
  { id: "lyrics", label: { tr: "Söz", en: "Lyrics" } },
  { id: "jingle", label: { tr: "Jingle", en: "Jingle" } },
  { id: "cover-art", label: { tr: "Kapak Görseli", en: "Cover Art" } }
];

const budgetOptions = [
  { id: "50-100", min: 50, max: 100 },
  { id: "100-250", min: 100, max: 250 },
  { id: "250-500", min: 250, max: 500 },
  { id: "500-plus", min: 500 }
];

const deadlineOptions: Array<{ id: string; label: LocalizedText }> = [
  { id: "24h", label: { tr: "24 saat", en: "24h" } },
  { id: "3-days", label: { tr: "3 gün", en: "3 days" } },
  { id: "1-week", label: { tr: "1 hafta", en: "1 week" } },
  { id: "flexible", label: { tr: "Esnek", en: "Flexible" } }
];

const resultCards = [
  {
    kind: { tr: "Eşleşen sanatçı", en: "Matched Artist" },
    match: 94,
    title: "Kairo Vale",
    category: { tr: "Trap prodüktörü", en: "Trap producer" },
    price: 129,
    startsAt: true,
    rating: "4.95",
    description: {
      tr: "Karanlık, parlatılmış trap ve R&B prodüksiyonları; temiz stemler, hızlı lisanslama ve hook'a hazır aranjmanlar.",
      en: "Dark, polished trap and R&B production with clean stems, fast licensing, and hook-ready arrangements."
    }
  },
  {
    kind: { tr: "Eşleşen ilan", en: "Matched Listing" },
    match: 91,
    title: { tr: "Gece Mesaisi Bounce", en: "Night Shift Bounce" },
    category: { tr: "Beat", en: "Beat" },
    price: 79,
    rating: "4.9",
    description: {
      tr: "Geniş klavyeler, kontrollü 808 hareketi ve trackout stemleriyle 142 BPM trap soul beat.",
      en: "A moody 142 BPM trap soul beat with spacious keys, controlled 808 movement, and trackout stems."
    }
  },
  {
    kind: { tr: "Önerilen hizmet", en: "Recommended Service" },
    match: 88,
    title: { tr: "Velvet Hook Paketi", en: "Velvet Hook Package" },
    category: { tr: "Vokal hook", en: "Vocal hook" },
    price: 240,
    rating: "4.98",
    description: {
      tr: "Daha güçlü bir single fikri için topline melodi, söz yönü, kuru demo vokal ve armoni referansları.",
      en: "Topline melody, lyric direction, dry demo vocal, and harmony references for a stronger single concept."
    }
  }
];

export function JamMatchEntry() {
  const { currencyCode, language, usdTryRate } = useI18n();
  const text = copy[language];
  const [prompt, setPrompt] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["beat"]);
  const [budgetId, setBudgetId] = useState("100-250");
  const [deadlineId, setDeadlineId] = useState("1-week");
  const [submitted, setSubmitted] = useState(false);

  const briefSummary = useMemo(() => {
    const categoryText = selectedCategories.length
      ? selectedCategories
          .map((id) => categoryChips.find((item) => item.id === id)?.label[language])
          .filter(Boolean)
          .join(", ")
      : text.anyCategory;
    const selectedBudget = budgetOptions.find((item) => item.id === budgetId) ?? budgetOptions[1];
    const selectedDeadline =
      deadlineOptions.find((item) => item.id === deadlineId) ?? deadlineOptions[2];

    return `${categoryText} / ${formatBudget(selectedBudget, language, currencyCode, usdTryRate)} / ${selectedDeadline.label[language]}`;
  }, [budgetId, currencyCode, deadlineId, language, selectedCategories, text.anyCategory, usdTryRate]);

  function toggleCategory(categoryId: string) {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId]
    );
  }

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[linear-gradient(180deg,rgba(88,197,255,0.16),rgba(5,6,8,0))]" />
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-jam-mint">
            <WandSparkles size={14} />
            {text.eyebrow}
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            {text.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/64 sm:text-lg">
            {text.subheadline}
          </p>
        </div>

        <div className="mx-auto mt-10 w-full max-w-5xl rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-soft backdrop-blur-2xl sm:p-5">
          <label className="block">
            <span className="sr-only">{text.promptLabel}</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={text.placeholder}
              className="focus-ring min-h-44 w-full resize-none rounded-lg border border-white/10 bg-black/38 p-5 text-lg leading-8 text-white placeholder:text-white/35"
            />
          </label>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
            <PreferenceGroup label={text.quickCategories}>
              {categoryChips.map((category) => (
                <ChoiceChip
                  key={category.id}
                  active={selectedCategories.includes(category.id)}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.label[language]}
                </ChoiceChip>
              ))}
            </PreferenceGroup>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <PreferenceGroup label={text.budget}>
                {budgetOptions.map((option) => (
                  <ChoiceChip
                    key={option.id}
                    active={budgetId === option.id}
                    onClick={() => setBudgetId(option.id)}
                  >
                    {formatBudget(option, language, currencyCode, usdTryRate)}
                  </ChoiceChip>
                ))}
              </PreferenceGroup>

              <PreferenceGroup label={text.deadline}>
                {deadlineOptions.map((option) => (
                  <ChoiceChip
                    key={option.id}
                    active={deadlineId === option.id}
                    onClick={() => setDeadlineId(option.id)}
                  >
                    {option.label[language]}
                  </ChoiceChip>
                ))}
              </PreferenceGroup>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 text-sm text-white/48">
              <Sparkles size={17} className="shrink-0 text-jam-blue" />
              <span className="truncate">
                {submitted ? text.previewTuned : text.briefSettings}: {briefSummary}
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-jam-mint px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
              >
                {text.findMatch}
                <ArrowRight size={18} />
              </button>
              <Link
                href="/marketplace"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3 text-sm font-bold text-white/76 transition hover:border-white/24 hover:bg-white/8 hover:text-white"
              >
                {text.browseManually}
                <Search size={17} />
              </Link>
            </div>
          </div>
        </div>

        <section className="mx-auto mt-10 w-full max-w-6xl">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-jam-mint">
                {text.resultPreview}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {text.resultTitle}
              </h2>
            </div>
            <p className="text-sm text-white/42">{text.resultHint}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {resultCards.map((card) => (
              <ResultPreviewCard
                key={`${card.match}-${getLocalizedText(card.title, language)}`}
                kind={card.kind[language]}
                match={card.match}
                title={getLocalizedText(card.title, language)}
                category={card.category[language]}
                price={formatResultPrice(card.price, Boolean(card.startsAt), language, currencyCode, usdTryRate)}
                rating={card.rating}
                description={card.description[language]}
                labels={text}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function formatBudget(
  option: { min: number; max?: number },
  language: Language,
  displayCurrency: "USD" | "TRY",
  usdTryRate: number
) {
  const min = currency(option.min, language, displayCurrency, usdTryRate);

  if (!option.max) {
    return `${min}+`;
  }

  return `${min}-${currency(option.max, language, displayCurrency, usdTryRate)}`;
}

function formatResultPrice(
  value: number,
  startsAt: boolean,
  language: Language,
  displayCurrency: "USD" | "TRY",
  usdTryRate: number
) {
  const amount = currency(value, language, displayCurrency, usdTryRate);

  if (!startsAt) {
    return amount;
  }

  return language === "tr" ? `${amount} başlangıç` : `${copy.en.from} ${amount}`;
}

function getLocalizedText(value: string | LocalizedText, language: Language) {
  return typeof value === "string" ? value : value[language];
}

function PreferenceGroup({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChoiceChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-jam-mint bg-jam-mint text-black"
          : "border-white/10 bg-black/28 text-white/62 hover:border-white/22 hover:bg-white/8 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function ResultPreviewCard({
  kind,
  match,
  title,
  category,
  price,
  rating,
  description,
  labels
}: {
  kind: string;
  match: number;
  title: string;
  category: string;
  price: string;
  rating: string;
  description: string;
  labels: (typeof copy)[Language];
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] p-5 shadow-soft transition hover:-translate-y-1 hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-jam-blue/25 bg-jam-blue/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-jam-blue">
          <BriefcaseBusiness size={13} />
          {kind}
        </span>
        <span className="rounded-full bg-jam-mint px-3 py-1 text-xs font-bold text-black">
          {match}%
        </span>
      </div>

      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-sm font-semibold text-white/48">{category}</p>
      <p className="mt-4 text-sm leading-6 text-white/62">{description}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-white/10 bg-black/24 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/34">{labels.price}</p>
          <p className="mt-1 font-semibold text-white">{price}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/24 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/34">{labels.rating}</p>
          <p className="mt-1 inline-flex items-center gap-1 font-semibold text-white">
            <Star size={14} className="text-jam-gold" fill="currentColor" />
            {rating}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white/58">
        <BadgeCheck size={16} className="text-jam-blue" />
        {labels.confidence}
      </div>
    </article>
  );
}
