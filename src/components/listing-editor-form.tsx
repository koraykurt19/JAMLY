"use client";

import { Loader2, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/language-provider";
import { UiSelect } from "@/components/ui-select";
import { getBeatLicenseCopy } from "@/lib/beat-licenses";
import { listingCategories } from "@/lib/data";
import { categoryLabel } from "@/lib/labels";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { updateListingDetails } from "@/lib/supabase-data";
import type { Listing, ListingCategory } from "@/lib/types";

const genreOptions = [
  "Hip-Hop",
  "Trap",
  "Drill",
  "R&B",
  "Pop",
  "Afrobeat",
  "Rock",
  "Electronic",
  "Other"
];

const turnaroundOptions = ["24 saat", "3 gün", "1 hafta", "Esnek"];

type FormState = {
  title: string;
  category: ListingCategory;
  genre: string;
  bpm: string;
  turnaround: string;
  description: string;
  tags: string;
  servicePrice: string;
  nonExclusive: string;
  unlimited: string;
  exclusive: string;
  isActive: boolean;
};

export function ListingEditorForm({
  listing,
  isDemo
}: {
  listing: Listing;
  isDemo: boolean;
}) {
  const { currencyCode, language, usdTryRate } = useI18n();
  const [form, setForm] = useState<FormState>(() => ({
    title: listing.title,
    category: listing.category,
    genre: listing.genre,
    bpm: listing.bpm?.toString() ?? "",
    turnaround: listing.turnaround,
    description: listing.description,
    tags: listing.tags.join(", "),
    servicePrice: toDisplayPrice(listing.price, currencyCode, usdTryRate),
    nonExclusive: toDisplayPrice(listing.licensePrices?.nonExclusive ?? listing.price, currencyCode, usdTryRate),
    unlimited: toDisplayPrice(listing.licensePrices?.unlimited ?? 0, currencyCode, usdTryRate),
    exclusive: toDisplayPrice(listing.licensePrices?.exclusive ?? 0, currencyCode, usdTryRate),
    isActive: listing.isActive
  }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const nextIsBeat = form.category === "Beat";

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setMessage("");
    const title = form.title.trim();
    const genre = form.genre.trim();
    const description = form.description.trim();
    const bpm = form.bpm.trim() ? Number(form.bpm) : null;

    if (!title || !genre || !description) {
      setMessage(language === "tr" ? "Başlık, tür ve açıklama zorunludur." : "Title, genre, and description are required.");
      return;
    }
    if (bpm !== null && (!Number.isFinite(bpm) || bpm < 40 || bpm > 240)) {
      setMessage(language === "tr" ? "BPM değeri 40 ile 240 arasında olmalıdır." : "BPM must be between 40 and 240.");
      return;
    }

    const enteredPrices = nextIsBeat
      ? [Number(form.nonExclusive), Number(form.unlimited), Number(form.exclusive)]
      : [Number(form.servicePrice)];
    if (enteredPrices.some((price) => !Number.isFinite(price) || price <= 0)) {
      setMessage(language === "tr" ? "Tüm fiyat alanları sıfırdan büyük olmalıdır." : "Every price must be greater than zero.");
      return;
    }
    if (listing.exclusiveSold && form.isActive) {
      setMessage(language === "tr" ? "Exclusive satılan ilan yeniden yayına alınamaz." : "An exclusively sold listing cannot be republished.");
      return;
    }
    if (isDemo) {
      setMessage(language === "tr" ? "Demo modunda değişiklikler kaydedilmez." : "Changes are not saved in demo mode.");
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setMessage(language === "tr" ? "Supabase bağlantısı kurulamadı." : "Supabase is not available.");
      return;
    }

    setSaving(true);
    try {
      const [nonExclusive, unlimited, exclusive] = enteredPrices.map((price) =>
        toStoredUsd(price, currencyCode, usdTryRate)
      );
      await updateListingDetails(client, listing.id, {
        title,
        category: form.category,
        genre,
        bpm,
        description,
        turnaround: form.turnaround.trim() || null,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        is_active: listing.exclusiveSold ? false : form.isActive,
        price: nextIsBeat ? nonExclusive : nonExclusive,
        price_non_exclusive: nextIsBeat ? nonExclusive : null,
        price_unlimited: nextIsBeat ? unlimited : null,
        price_exclusive: nextIsBeat ? exclusive : null
      });
      setMessage(language === "tr" ? "İlan güncellendi." : "Listing updated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : language === "tr"
            ? "İlan güncellenemedi."
            : "The listing could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jam-blue">
            {language === "tr" ? "İlan düzenleyici" : "Listing editor"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{listing.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
            {language === "tr"
              ? "Ses önizlemesi, kapak ve teslim dosyaları korunur. Bu ekrandan ilan bilgilerini ve satış ayarlarını güncellersiniz."
              : "Your audio preview, cover, and delivery files stay in place. Update listing details and selling settings here."}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white/62">
          <ShieldCheck size={14} className="text-jam-blue" />
          {listing.exclusiveSold
            ? language === "tr" ? "Exclusive satıldı" : "Exclusive sold"
            : language === "tr" ? "Taslak ve yayın kontrolü" : "Draft and publish control"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <EditorField label={language === "tr" ? "Başlık" : "Title"}>
          <input value={form.title} onChange={(event) => update("title", event.target.value)} className="input-field" />
        </EditorField>
        <EditorField label={language === "tr" ? "Kategori" : "Category"}>
          <UiSelect value={form.category} onChange={(value) => update("category", value as ListingCategory)} ariaLabel={language === "tr" ? "Kategori" : "Category"} options={listingCategories.map((category) => ({ value: category, label: categoryLabel(category, language) }))} />
        </EditorField>
        <EditorField label={language === "tr" ? "Tür" : "Genre"}>
          <UiSelect value={form.genre} onChange={(value) => update("genre", value)} ariaLabel={language === "tr" ? "Tür" : "Genre"} options={genreOptions.map((genre) => ({ value: genre, label: genre }))} />
        </EditorField>
        <EditorField label="BPM">
          <input value={form.bpm} onChange={(event) => update("bpm", event.target.value)} type="number" min="40" max="240" placeholder={language === "tr" ? "Opsiyonel" : "Optional"} className="input-field" />
        </EditorField>
        <EditorField label={language === "tr" ? "Teslim süresi" : "Delivery time"}>
          <UiSelect value={form.turnaround} onChange={(value) => update("turnaround", value)} ariaLabel={language === "tr" ? "Teslim süresi" : "Delivery time"} options={[{ value: "", label: language === "tr" ? "Seçin" : "Select" }, ...turnaroundOptions.map((option) => ({ value: option, label: option }))]} />
        </EditorField>
        <label className="flex min-h-12 items-center gap-3 rounded-md border border-white/10 bg-black/20 px-4 text-sm text-white/74">
          <input type="checkbox" checked={form.isActive} disabled={listing.exclusiveSold} onChange={(event) => update("isActive", event.target.checked)} className="h-4 w-4 accent-jam-blue" />
          {language === "tr" ? "İlanı Jam Alanı'nda yayınla" : "Publish this listing in Jam Alanı"}
        </label>
      </div>

      <EditorField label={language === "tr" ? "Açıklama" : "Description"} className="mt-5">
        <textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={6} className="input-field min-h-36 resize-y py-3" />
      </EditorField>
      <EditorField label={language === "tr" ? "Etiketler" : "Tags"} className="mt-5">
        <input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="Trap, dark, vocal-ready" className="input-field" />
      </EditorField>

      <section className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jam-blue">
          {nextIsBeat ? (language === "tr" ? "Lisans fiyatları" : "License pricing") : (language === "tr" ? "Hizmet fiyatı" : "Service pricing")}
        </p>
        <div className={`mt-4 grid gap-4 ${nextIsBeat ? "lg:grid-cols-3" : "max-w-sm"}`}>
          {nextIsBeat ? ([
            ["nonExclusive", form.nonExclusive],
            ["unlimited", form.unlimited],
            ["exclusive", form.exclusive]
          ] as const).map(([tier, value]) => (
            <PriceField key={tier} label={getBeatLicenseCopy(tier, language).name} value={value} currencyCode={currencyCode} onChange={(next) => update(tier, next)} />
          )) : (
            <PriceField label={language === "tr" ? "Başlangıç fiyatı" : "Starting price"} value={form.servicePrice} currencyCode={currencyCode} onChange={(next) => update("servicePrice", next)} />
          )}
        </div>
        {currencyCode === "TRY" ? <p className="mt-3 text-xs text-white/42">{language === "tr" ? `İlanlar USD olarak saklanır; şu anki görünüm: 1 USD = ${usdTryRate.toFixed(2)} TRY.` : `Listings are stored in USD; current display rate: 1 USD = ${usdTryRate.toFixed(2)} TRY.`}</p> : null}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={save} disabled={saving} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-jam-mint px-5 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-65">
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {language === "tr" ? "Değişiklikleri kaydet" : "Save changes"}
        </button>
        {message ? <p role="status" className="text-sm text-jam-blue">{message}</p> : null}
      </div>
    </div>
  );
}

function EditorField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block space-y-2 ${className}`}><span className="text-sm font-medium text-white/64">{label}</span>{children}</label>;
}

function PriceField({ label, value, currencyCode, onChange }: { label: string; value: string; currencyCode: "USD" | "TRY"; onChange: (value: string) => void }) {
  return <label className="block rounded-md border border-white/10 bg-white/[0.035] p-3"><span className="text-sm font-semibold text-white">{label}</span><div className="relative mt-3"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/42">{currencyCode === "TRY" ? "₺" : "$"}</span><input value={value} onChange={(event) => onChange(event.target.value)} type="number" min="0.01" step="0.01" className="input-field pl-7" /></div></label>;
}

function toStoredUsd(value: number, currencyCode: "USD" | "TRY", usdTryRate: number) {
  return currencyCode === "TRY" ? Number((value / usdTryRate).toFixed(2)) : Number(value.toFixed(2));
}

function toDisplayPrice(value: number, currencyCode: "USD" | "TRY", usdTryRate: number) {
  const converted = currencyCode === "TRY" ? value * usdTryRate : value;
  return Number(converted.toFixed(2)).toString();
}
