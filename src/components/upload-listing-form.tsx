"use client";

/* eslint-disable @next/next/no-img-element -- Local blob previews cannot be optimized by next/image. */

import {
  CheckCircle2,
  FileAudio,
  ImageIcon,
  Loader2,
  UploadCloud
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { listingCategories } from "@/lib/data";
import { categoryLabel, licenseLabel } from "@/lib/labels";
import type { LicenseType, ListingCategory } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

const licenseTypes: LicenseType[] = [
  "Basic Lease",
  "Premium Lease",
  "Exclusive",
  "Service"
];

type FormState = {
  title: string;
  category: ListingCategory;
  genre: string;
  bpm: string;
  price: string;
  description: string;
  licenseType: LicenseType;
  turnaround: string;
  tags: string;
};

type MediaState = {
  audioFile: File | null;
  audioPreviewUrl: string;
  coverFile: File | null;
  coverPreviewUrl: string;
};

type SupabaseBrowserClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>;

const initialState: FormState = {
  title: "",
  category: "Beat",
  genre: "",
  bpm: "",
  price: "",
  description: "",
  licenseType: "Basic Lease",
  turnaround: "",
  tags: ""
};

const initialMediaState: MediaState = {
  audioFile: null,
  audioPreviewUrl: "",
  coverFile: null,
  coverPreviewUrl: ""
};

type UploadListingFormProps = {
  creatorId?: string;
};

export function UploadListingForm({ creatorId }: UploadListingFormProps) {
  const { language, t } = useI18n();
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

    const supabase = getSupabaseBrowserClient();
    let savedRemotely = false;

    try {
      let audioPreviewUrl = media.audioPreviewUrl;
      let coverImageUrl = media.coverPreviewUrl;

      if (supabase) {
        if (creatorId) {
          const uploadedMedia = await uploadListingMedia(
            supabase,
            creatorId,
            media.audioFile,
            media.coverFile
          );

          audioPreviewUrl = uploadedMedia.audioPreviewUrl;
          coverImageUrl = uploadedMedia.coverImageUrl;

          const { error } = await supabase.from("listings").insert({
            creator_id: creatorId,
            title: form.title,
            category: form.category,
            genre: form.genre,
            bpm: form.bpm ? Number(form.bpm) : null,
            price: Number(form.price),
            description: form.description,
            audio_preview_url: audioPreviewUrl,
            cover_image_url: coverImageUrl,
            license_type: form.licenseType,
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
          <select
            value={form.category}
            onChange={(event) => update("category", event.target.value as ListingCategory)}
            className="input-field"
          >
            {listingCategories.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category, language)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("genre")}>
          <input
            value={form.genre}
            onChange={(event) => update("genre", event.target.value)}
            placeholder={t("genrePlaceholder")}
            required
            className="input-field"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
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
          <Field label={t("price")}>
            <input
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              type="number"
              min="0"
              step="1"
              placeholder="120"
              required
              className="input-field"
            />
          </Field>
        </div>

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

        <Field label={t("licenseType")}>
          <select
            value={form.licenseType}
            onChange={(event) => update("licenseType", event.target.value as LicenseType)}
            className="input-field"
          >
            {licenseTypes.map((license) => (
              <option key={license} value={license}>
                {licenseLabel(license, language)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("turnaround")}>
          <input
            value={form.turnaround}
            onChange={(event) => update("turnaround", event.target.value)}
            placeholder={t("turnaroundPlaceholder")}
            className="input-field"
          />
        </Field>
      </div>

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

function safeFileName(fileName: string) {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "") || "upload"
  );
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
  previewType: "audio" | "image";
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
