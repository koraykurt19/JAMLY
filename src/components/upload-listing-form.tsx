"use client";

/* eslint-disable @next/next/no-img-element -- Local blob previews cannot be optimized by next/image. */

import {
  CheckCircle2,
  FileArchive,
  FileAudio,
  ImageIcon,
  Info,
  Loader2,
  UploadCloud
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { listingCategories } from "@/lib/data";
import {
  beatLicenseTiers,
  getBeatLicenseCopy,
  getDeliveryFolder,
  licenseLegalNotice
} from "@/lib/beat-licenses";
import { categoryLabel } from "@/lib/labels";
import type { BeatLicenseTier, ListingCategory } from "@/lib/types";
import { useI18n } from "@/components/language-provider";
import { UiSelect } from "@/components/ui-select";
import { currency } from "@/lib/format";

type FormState = {
  title: string;
  category: ListingCategory;
  genre: string;
  bpm: string;
  servicePrice: string;
  priceNonExclusive: string;
  priceUnlimited: string;
  priceExclusive: string;
  description: string;
  turnaround: string;
  tags: string;
};

type MediaState = {
  audioFile: File | null;
  audioPreviewUrl: string;
  coverFile: File | null;
  coverPreviewUrl: string;
  deliveryMp3File: File | null;
  deliveryUnlimitedFile: File | null;
  deliveryExclusiveFile: File | null;
};

type SupabaseBrowserClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>;

const initialState: FormState = {
  title: "",
  category: "Beat",
  genre: "",
  bpm: "",
  servicePrice: "",
  priceNonExclusive: "",
  priceUnlimited: "",
  priceExclusive: "",
  description: "",
  turnaround: "",
  tags: ""
};

const initialMediaState: MediaState = {
  audioFile: null,
  audioPreviewUrl: "",
  coverFile: null,
  coverPreviewUrl: "",
  deliveryMp3File: null,
  deliveryUnlimitedFile: null,
  deliveryExclusiveFile: null
};

const priceFieldByTier: Record<
  BeatLicenseTier,
  "priceNonExclusive" | "priceUnlimited" | "priceExclusive"
> = {
  nonExclusive: "priceNonExclusive",
  unlimited: "priceUnlimited",
  exclusive: "priceExclusive"
};

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

type UploadListingFormProps = {
  creatorId?: string;
};

export function UploadListingForm({ creatorId }: UploadListingFormProps) {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const [form, setForm] = useState<FormState>(initialState);
  const [media, setMedia] = useState<MediaState>(initialMediaState);
  const [fileInputVersion, setFileInputVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const objectUrlsRef = useRef<string[]>([]);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function registerPreviewUrl(file: File) {
    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(previewUrl);
    return previewUrl;
  }

  function revokePreviewUrl(previewUrl: string) {
    if (!previewUrl.startsWith("blob:")) {
      return;
    }

    URL.revokeObjectURL(previewUrl);
    objectUrlsRef.current = objectUrlsRef.current.filter((item) => item !== previewUrl);
  }

  function updateMedia(kind: "audio" | "cover", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const nextPreviewUrl = file ? registerPreviewUrl(file) : "";

    setMedia((current) => {
      const previousPreviewUrl =
        kind === "audio" ? current.audioPreviewUrl : current.coverPreviewUrl;

      revokePreviewUrl(previousPreviewUrl);

      if (kind === "audio") {
        return {
          ...current,
          audioFile: file,
          audioPreviewUrl: nextPreviewUrl
        };
      }

      return {
        ...current,
        coverFile: file,
        coverPreviewUrl: nextPreviewUrl
      };
    });
  }

  function updateDeliveryFile(
    kind: "deliveryMp3File" | "deliveryUnlimitedFile" | "deliveryExclusiveFile",
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;
    setMedia((current) => ({ ...current, [kind]: file }));
  }

  function resetForm() {
    setForm(initialState);
    setMedia((current) => {
      revokePreviewUrl(current.audioPreviewUrl);
      revokePreviewUrl(current.coverPreviewUrl);
      return initialMediaState;
    });
    setFileInputVersion((current) => current + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!media.audioFile || !media.coverFile) {
      setLoading(false);
      setMessage(`${t("listingError")}: ${t("missingMediaFiles")}`);
      return;
    }

    if (!form.genre.trim()) {
      setLoading(false);
      setMessage(`${t("listingError")}: ${t("genrePlaceholder")}`);
      return;
    }

    const isBeat = form.category === "Beat";
    const licenseInputPrices = {
      nonExclusive: Number(form.priceNonExclusive),
      unlimited: Number(form.priceUnlimited),
      exclusive: Number(form.priceExclusive)
    };
    const licensePrices = {
      nonExclusive: convertInputPriceToUsd(licenseInputPrices.nonExclusive, currencyCode, usdTryRate),
      unlimited: convertInputPriceToUsd(licenseInputPrices.unlimited, currencyCode, usdTryRate),
      exclusive: convertInputPriceToUsd(licenseInputPrices.exclusive, currencyCode, usdTryRate)
    };

    if (
      isBeat &&
      beatLicenseTiers.some(
        (tier) => !Number.isFinite(licenseInputPrices[tier]) || licenseInputPrices[tier] <= 0
      )
    ) {
      setLoading(false);
      setMessage(`${t("listingError")}: ${t("invalidLicensePrices")}`);
      return;
    }

    if (
      isBeat &&
      (!media.deliveryMp3File ||
        !media.deliveryUnlimitedFile ||
        !media.deliveryExclusiveFile)
    ) {
      setLoading(false);
      setMessage(`${t("listingError")}: ${t("missingLicenseFiles")}`);
      return;
    }

    const servicePrice = Number(form.servicePrice);
    const servicePriceUsd = convertInputPriceToUsd(servicePrice, currencyCode, usdTryRate);
    if (!isBeat && (!Number.isFinite(servicePrice) || servicePrice <= 0)) {
      setLoading(false);
      setMessage(`${t("listingError")}: ${t("invalidServicePrice")}`);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let savedRemotely = false;

    try {
      let audioPreviewUrl = media.audioPreviewUrl;
      let coverImageUrl = media.coverPreviewUrl;

      if (supabase) {
        if (creatorId) {
          const listingId = createUuid();
          const [uploadedMedia, deliveryFiles] = await Promise.all([
            uploadListingMedia(
              supabase,
              creatorId,
              media.audioFile,
              media.coverFile
            ),
            isBeat &&
            media.deliveryMp3File &&
            media.deliveryUnlimitedFile &&
            media.deliveryExclusiveFile
              ? uploadLicensePackages(supabase, creatorId, listingId, {
                  nonExclusive: media.deliveryMp3File,
                  unlimited: media.deliveryUnlimitedFile,
                  exclusive: media.deliveryExclusiveFile
                })
              : Promise.resolve(null)
          ]);

          audioPreviewUrl = uploadedMedia.audioPreviewUrl;
          coverImageUrl = uploadedMedia.coverImageUrl;

          const { error } = await supabase.from("listings").insert({
            id: listingId,
            creator_id: creatorId,
            title: form.title,
            category: form.category,
            genre: form.genre,
            bpm: form.bpm ? Number(form.bpm) : null,
            price: isBeat ? licensePrices.nonExclusive : servicePriceUsd,
            price_non_exclusive: isBeat ? licensePrices.nonExclusive : null,
            price_unlimited: isBeat ? licensePrices.unlimited : null,
            price_exclusive: isBeat ? licensePrices.exclusive : null,
            description: form.description,
            audio_preview_url: audioPreviewUrl,
            cover_image_url: coverImageUrl,
            delivery_mp3_path: deliveryFiles?.nonExclusive ?? null,
            delivery_unlimited_path: deliveryFiles?.unlimited ?? null,
            delivery_exclusive_path: deliveryFiles?.exclusive ?? null,
            license_type: isBeat ? "Basic Lease" : "Service",
            turnaround: form.turnaround,
            tags: form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          });

          if (error) {
            throw new Error(error.message);
          }

          savedRemotely = true;
        } else {
          throw new Error(t("creatorSessionRequired"));
        }
      }

      window.setTimeout(() => {
        setLoading(false);
        setMessage(savedRemotely ? t("listingSaved") : t("listingStaged"));
        resetForm();
      }, 450);
    } catch (error) {
      setLoading(false);
      setMessage(
        `${t("listingError")}: ${error instanceof Error ? error.message : t("unknownError")}`
      );
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {!configured ? (
        <div className="rounded-lg border border-jam-blue/30 bg-jam-blue/10 p-4 text-sm leading-6 text-jam-blue">
          {t("formDemoMode")}
        </div>
      ) : null}

      <FormStep title={t("listingBasicsStep")} description={t("listingBasicsCopy")} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label={t("title")}>
          <input
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder={t("uploadTitlePlaceholder")}
            required
            className="input-field"
          />
        </Field>

        <Field label={t("category")}>
          <UiSelect
            value={form.category}
            onChange={(value) => update("category", value as ListingCategory)}
            ariaLabel={t("category")}
            options={listingCategories.map((category) => ({
              value: category,
              label: categoryLabel(category, language)
            }))}
          />
        </Field>

        <Field label={t("genre")}>
          <UiSelect
            value={form.genre}
            onChange={(value) => update("genre", value)}
            ariaLabel={t("genre")}
            placeholder={t("genrePlaceholder")}
            options={[
              { value: "", label: t("genrePlaceholder"), disabled: true },
              ...genreOptions.map((genre) => ({ value: genre, label: genre }))
            ]}
          />
        </Field>

        <Field label="BPM">
          <input
            value={form.bpm}
            onChange={(event) => update("bpm", event.target.value)}
            type="number"
            min="40"
            max="240"
            placeholder={t("optional")}
            className="input-field"
          />
        </Field>

        <Field label={t("turnaround")}>
          <UiSelect
            value={form.turnaround}
            onChange={(value) => update("turnaround", value)}
            ariaLabel={t("turnaround")}
            placeholder={t("turnaroundPlaceholder")}
            options={[
              { value: "", label: t("turnaroundPlaceholder") },
              ...turnaroundOptions.map((option) => ({ value: option, label: option }))
            ]}
          />
        </Field>
      </div>

      <FormStep title={t("listingMediaStep")} description={t("listingMediaCopy")} />

      <div className="grid gap-5 lg:grid-cols-2">
        {form.category !== "Beat" ? (
          <Field label={`${t("price")} (${currencyCode})`}>
            <input
              value={form.servicePrice}
              onChange={(event) => update("servicePrice", event.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              placeholder={currencyCode === "TRY" ? "3500" : "120"}
              required
              className="input-field"
            />
            <PriceHelper
              value={form.servicePrice}
              currencyCode={currencyCode}
              language={language}
              usdTryRate={usdTryRate}
              convertedLabel={t("convertedPriceHint")}
              inputLabel={t("priceCurrencyHint")}
            />
          </Field>
        ) : null}

        <FileUploadField
          key={`audio-${fileInputVersion}`}
          label={t("audioPreviewFile")}
          hint={t("audioPreviewFileHint")}
          accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a"
          file={media.audioFile}
          icon={<FileAudio size={20} />}
          previewType="audio"
          previewUrl={media.audioPreviewUrl}
          chooseLabel={media.audioFile ? t("replaceFile") : t("chooseFile")}
          selectedLabel={t("selectedFile")}
          readyLabel={t("mediaReady")}
          onChange={(event) => updateMedia("audio", event)}
        />

        <FileUploadField
          key={`cover-${fileInputVersion}`}
          label={t("coverImageFile")}
          hint={t("coverImageFileHint")}
          accept="image/jpeg,image/png,image/webp"
          file={media.coverFile}
          icon={<ImageIcon size={20} />}
          previewType="image"
          previewUrl={media.coverPreviewUrl}
          chooseLabel={media.coverFile ? t("replaceFile") : t("chooseFile")}
          selectedLabel={t("selectedFile")}
          readyLabel={t("mediaReady")}
          onChange={(event) => updateMedia("cover", event)}
        />
      </div>

      <FormStep title={t("listingDeliveryStep")} description={t("listingDeliveryCopy")} />

      {form.category === "Beat" ? (
        <>
          <section className="rounded-lg border border-white/10 bg-black/24 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jam-blue">
                  {t("beatLicensePricing")}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {t("setThreeLicensePrices")}
                </h2>
              </div>
              <p className="text-xs text-white/42">{t("pricesStoredInUsd")}</p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {beatLicenseTiers.map((tier) => {
                const field = priceFieldByTier[tier];
                return (
                  <LicensePriceCard
                    key={tier}
                    tier={tier}
                    language={language}
                    value={form[field]}
                    currencyCode={currencyCode}
                    usdTryRate={usdTryRate}
                    convertedLabel={t("convertedPriceHint")}
                    inputLabel={t("priceCurrencyHint")}
                    onChange={(value) => update(field, value)}
                  />
                );
              })}
            </div>

            <p className="mt-4 text-xs leading-5 text-white/42">
              {licenseLegalNotice[language]}
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-black/24 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jam-blue">
              {t("licenseDeliveryPackages")}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {t("uploadBuyerFiles")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/48">
              {t("privateDeliveryFilesHint")}
            </p>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <FileUploadField
                key={`delivery-mp3-${fileInputVersion}`}
                label={getBeatLicenseCopy("nonExclusive", language).deliveryLabel}
                hint={t("deliveryMp3Hint")}
                accept="audio/mpeg,.mp3"
                file={media.deliveryMp3File}
                icon={<FileAudio size={20} />}
                previewType="none"
                previewUrl=""
                chooseLabel={media.deliveryMp3File ? t("replaceFile") : t("chooseFile")}
                selectedLabel={t("selectedFile")}
                readyLabel={t("deliveryReady")}
                onChange={(event) => updateDeliveryFile("deliveryMp3File", event)}
              />
              <FileUploadField
                key={`delivery-unlimited-${fileInputVersion}`}
                label={getBeatLicenseCopy("unlimited", language).deliveryLabel}
                hint={t("deliveryUnlimitedHint")}
                accept="application/zip,application/x-zip-compressed,.zip"
                file={media.deliveryUnlimitedFile}
                icon={<FileArchive size={20} />}
                previewType="none"
                previewUrl=""
                chooseLabel={media.deliveryUnlimitedFile ? t("replaceFile") : t("chooseFile")}
                selectedLabel={t("selectedFile")}
                readyLabel={t("deliveryReady")}
                onChange={(event) => updateDeliveryFile("deliveryUnlimitedFile", event)}
              />
              <FileUploadField
                key={`delivery-exclusive-${fileInputVersion}`}
                label={getBeatLicenseCopy("exclusive", language).deliveryLabel}
                hint={t("deliveryExclusiveHint")}
                accept="application/zip,application/x-zip-compressed,.zip"
                file={media.deliveryExclusiveFile}
                icon={<FileArchive size={20} />}
                previewType="none"
                previewUrl=""
                chooseLabel={media.deliveryExclusiveFile ? t("replaceFile") : t("chooseFile")}
                selectedLabel={t("selectedFile")}
                readyLabel={t("deliveryReady")}
                onChange={(event) => updateDeliveryFile("deliveryExclusiveFile", event)}
              />
            </div>
          </section>
        </>
      ) : null}

      <Field label={t("description")}>
        <textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          rows={5}
          required
          placeholder={t("listingDescriptionPlaceholder")}
          className="input-field min-h-32 resize-y py-3"
        />
      </Field>

      <Field label={t("tags")}>
        <input
          value={form.tags}
          onChange={(event) => update("tags", event.target.value)}
          placeholder={t("tagsPlaceholder")}
          className="input-field"
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-jam-mint px-6 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
        {t("uploadListing")}
      </button>

      {message ? <p className="text-sm text-jam-mint">{message}</p> : null}
    </form>
  );
}

async function uploadListingMedia(
  supabase: SupabaseBrowserClient,
  userId: string,
  audioFile: File,
  coverFile: File
) {
  const [audioPreviewUrl, coverImageUrl] = await Promise.all([
    uploadPublicFile(supabase, "audio-previews", userId, audioFile),
    uploadPublicFile(supabase, "listing-covers", userId, coverFile)
  ]);

  return { audioPreviewUrl, coverImageUrl };
}

async function uploadLicensePackages(
  supabase: SupabaseBrowserClient,
  userId: string,
  listingId: string,
  files: Record<BeatLicenseTier, File>
) {
  const uploaded = await Promise.all(
    beatLicenseTiers.map(async (tier) => {
      const file = files[tier];
      const path = `${userId}/${listingId}/${getDeliveryFolder(tier)}/${Date.now()}-${randomId()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage
        .from("license-deliverables")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      return [tier, path] as const;
    })
  );

  return Object.fromEntries(uploaded) as Record<BeatLicenseTier, string>;
}

async function uploadPublicFile(
  supabase: SupabaseBrowserClient,
  bucket: "audio-previews" | "listing-covers",
  userId: string,
  file: File
) {
  const path = `${userId}/${Date.now()}-${randomId()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function randomId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function safeFileName(fileName: string) {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "") || "upload"
  );
}

function convertInputPriceToUsd(value: number, displayCurrency: "USD" | "TRY", usdTryRate: number) {
  if (!Number.isFinite(value)) return value;
  if (displayCurrency === "TRY") return Number((value / usdTryRate).toFixed(2));
  return Number(value.toFixed(2));
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploadField({
  label,
  hint,
  accept,
  file,
  icon,
  previewType,
  previewUrl,
  chooseLabel,
  selectedLabel,
  readyLabel,
  onChange
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  icon: ReactNode;
  previewType: "audio" | "image" | "none";
  previewUrl: string;
  chooseLabel: string;
  selectedLabel: string;
  readyLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-white/64">{label}</span>
      <label className="block cursor-pointer rounded-lg border border-dashed border-white/14 bg-black/24 p-4 transition hover:border-jam-blue/45 hover:bg-jam-blue/5 focus-within:ring-2 focus-within:ring-jam-blue/40">
        <input
          type="file"
          accept={accept}
          required={!file}
          onChange={onChange}
          className="sr-only"
        />
        <span className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] text-jam-blue">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">{chooseLabel}</span>
              {file ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-jam-blue/12 px-2.5 py-1 text-xs font-bold text-jam-blue">
                  <CheckCircle2 size={13} />
                  {readyLabel}
                </span>
              ) : null}
            </span>
            <span className="mt-1 block text-sm leading-6 text-white/46">{hint}</span>
            {file ? (
              <span className="mt-3 block rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-white/70">
                {selectedLabel}: <span className="font-semibold text-white">{file.name}</span>{" "}
                <span className="text-white/38">({formatFileSize(file.size)})</span>
              </span>
            ) : null}
          </span>
        </span>
      </label>

      {previewUrl && previewType === "image" ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/24">
          <img src={previewUrl} alt="" className="h-44 w-full object-cover" />
        </div>
      ) : null}

      {previewUrl && previewType === "audio" ? (
        <div className="rounded-lg border border-white/10 bg-black/24 p-3">
          <audio src={previewUrl} controls className="w-full" />
        </div>
      ) : null}
    </div>
  );
}

function LicensePriceCard({
  tier,
  language,
  value,
  currencyCode,
  usdTryRate,
  convertedLabel,
  inputLabel,
  onChange
}: {
  tier: BeatLicenseTier;
  language: "tr" | "en";
  value: string;
  currencyCode: "USD" | "TRY";
  usdTryRate: number;
  convertedLabel: string;
  inputLabel: string;
  onChange: (value: string) => void;
}) {
  const copy = getBeatLicenseCopy(tier, language);

  return (
    <div className="relative rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex min-h-12 items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{copy.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-jam-blue">
            {copy.qualifier}
          </p>
        </div>
        <div className="group relative shrink-0">
          <button
            type="button"
            aria-label={`${copy.name} info`}
            title={copy.summary}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/48 transition hover:border-jam-blue/40 hover:text-jam-blue"
          >
            <Info size={16} />
          </button>
          <div className="pointer-events-none absolute right-0 top-11 z-20 hidden w-64 rounded-md border border-white/10 bg-jam-panel p-3 text-xs leading-5 text-white/68 shadow-soft group-hover:block group-focus-within:block">
            {copy.summary}
          </div>
        </div>
      </div>

      <p className="mt-3 min-h-12 text-sm leading-6 text-white/52">{copy.summary}</p>
      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
          {currencyCode}
        </span>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/42">
            {currencyCode === "TRY" ? "₺" : "$"}
          </span>
          <input
            type="number"
            aria-label={`${copy.name} ${language === "tr" ? "fiyatı" : "price"} (${currencyCode})`}
            min="0.01"
            step="0.01"
            required
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={
              currencyCode === "TRY"
                ? tier === "exclusive"
                  ? "60000"
                  : tier === "unlimited"
                    ? "8000"
                    : "3000"
                : tier === "exclusive"
                  ? "1500"
                  : tier === "unlimited"
                    ? "199"
                    : "79"
            }
            className="input-field pl-8"
          />
        </div>
        <PriceHelper
          value={value}
          currencyCode={currencyCode}
          language={language}
          usdTryRate={usdTryRate}
          convertedLabel={convertedLabel}
          inputLabel={inputLabel}
        />
      </label>
    </div>
  );
}

function FormStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-white/50">{description}</p>
    </div>
  );
}

function PriceHelper({
  value,
  currencyCode,
  language,
  usdTryRate,
  convertedLabel,
  inputLabel
}: {
  value: string;
  currencyCode: "USD" | "TRY";
  language: "tr" | "en";
  usdTryRate: number;
  convertedLabel: string;
  inputLabel: string;
}) {
  const numericValue = Number(value);
  if (!value || !Number.isFinite(numericValue) || numericValue <= 0) {
    return <p className="mt-2 text-xs text-white/38">{inputLabel}: {currencyCode}</p>;
  }

  if (currencyCode === "USD") {
    return <p className="mt-2 text-xs text-white/38">{inputLabel}: USD</p>;
  }

  const usdValue = convertInputPriceToUsd(numericValue, currencyCode, usdTryRate);
  return (
    <p className="mt-2 text-xs text-white/42">
      {convertedLabel}: {currency(usdValue, language, "USD", usdTryRate)}
    </p>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-white/64">{label}</span>
      {children}
    </label>
  );
}
