"use client";

import Image from "next/image";
import { Camera, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { SocialLinkList } from "@/components/social-link-list";
import { UiSelect } from "@/components/ui-select";
import { cn } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ensureCurrentProfile } from "@/lib/supabase-data";
import {
  customSocialLinksFromLinks,
  socialLinkFormValues,
  socialLinkRecordFromForm,
  socialLinksFromRecord,
  socialPlatforms,
  type CustomSocialLink,
  type SocialLinkRecord,
  type SocialLinkPlatform,
  type SocialPlatform
} from "@/lib/social-links";
import type { Creator } from "@/lib/types";

type ProfileFormState = {
  fullName: string;
  handle: string;
  headline: string;
  location: string;
  bio: string;
  specialties: string;
  avatarUrl: string;
  coverUrl: string;
};

type FormStatus =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type MediaState = {
  avatarFile: File | null;
  coverFile: File | null;
  avatarPreviewUrl: string;
  coverPreviewUrl: string;
};

type SocialPickerState = {
  platform: SocialPlatform | "custom";
  label: string;
  url: string;
};

type CreatorProfileEditorProps = {
  creator: Creator;
  isDemo: boolean;
  onSaved?: () => void;
};

const copy = {
  tr: {
    title: "Profil vitrini",
    description:
      "Alıcıların güvenmesi için profil fotoğrafınızı, biyografinizi, uzmanlıklarınızı ve sosyal kanıtlarınızı tek yerden düzenleyin.",
    demo: "Demo modda değişiklikler kaydedilmez. Supabase bağlantısı aktif olduğunda bu alan canlı profile yazılır.",
    identity: "Temel bilgiler",
    visuals: "Görsel vitrin",
    socials: "Sosyal medya",
    addSocial: "Bağlantı ekle",
    socialPlatform: "Platform",
    socialUrl: "Link",
    customSiteName: "Site adı",
    customPlatform: "Diğer",
    emptySocials: "Henüz sosyal medya veya dış vitrin linki eklenmedi.",
    fullName: "Görünen ad",
    handle: "Kullanıcı adı",
    headline: "Kısa başlık",
    location: "Konum",
    bio: "Biyografi",
    specialties: "Uzmanlıklar",
    avatarUrl: "Profil fotoğrafı URL",
    coverUrl: "Kapak görseli URL",
    avatarFile: "Profil fotoğrafı yükle",
    coverFile: "Kapak görseli yükle",
    visualUrlToggle: "URL ile görsel kullan",
    imageHint: "JPG, PNG veya WebP. Dosya seçerseniz URL alanının yerine yüklenen görsel kullanılır.",
    specialtiesHint: "Virgülle ayırın: Trap, Vocal hooks, Mix",
    save: "Profili kaydet",
    saving: "Kaydediliyor",
    saved: "Profil vitrini güncellendi.",
    signIn: "Profili kaydetmek için giriş yapmanız gerekir.",
    ownerOnly: "Bu profil sadece sahibi tarafından düzenlenebilir.",
    error: "Profil kaydedilemedi.",
    handlePolicy: "Kullanıcı adı 30 günde bir değiştirilebilir.",
    handleLocked: "Kullanıcı adını tekrar değiştirebileceğiniz tarih:",
    handleTaken: "Bu kullanıcı adı dolu. Lütfen farklı bir kullanıcı adı seçin.",
    preview: "Profilde görünecek bağlantılar"
  },
  en: {
    title: "Profile storefront",
    description:
      "Edit your photo, bio, specialties, and proof points in one place so buyers can trust your profile faster.",
    demo: "Changes are not saved in demo mode. Once Supabase is connected, this writes to the live profile.",
    identity: "Core details",
    visuals: "Visual storefront",
    socials: "Social media",
    addSocial: "Add link",
    socialPlatform: "Platform",
    socialUrl: "Link",
    customSiteName: "Site name",
    customPlatform: "Other",
    emptySocials: "No social or external storefront links have been added yet.",
    fullName: "Display name",
    handle: "Handle",
    headline: "Short headline",
    location: "Location",
    bio: "Biography",
    specialties: "Specialties",
    avatarUrl: "Profile photo URL",
    coverUrl: "Cover image URL",
    avatarFile: "Upload profile photo",
    coverFile: "Upload cover image",
    visualUrlToggle: "Use image URLs",
    imageHint: "JPG, PNG, or WebP. If you choose a file, the uploaded image replaces the URL field.",
    specialtiesHint: "Separate with commas: Trap, Vocal hooks, Mix",
    save: "Save profile",
    saving: "Saving",
    saved: "Profile storefront updated.",
    signIn: "Sign in to save your profile.",
    ownerOnly: "Only the profile owner can edit this profile.",
    error: "Profile could not be saved.",
    handlePolicy: "Your handle can be changed once every 30 days.",
    handleLocked: "You can change your handle again on:",
    handleTaken: "This handle is already taken. Please choose another one.",
    preview: "Links shown on profile"
  }
} as const;

export function CreatorProfileEditor({ creator, isDemo, onSaved }: CreatorProfileEditorProps) {
  const { language } = useI18n();
  const text = copy[language];
  const [form, setForm] = useState<ProfileFormState>(() => profileToForm(creator));
  const [socialValues, setSocialValues] = useState<SocialLinkRecord>(() =>
    socialLinkFormValues(creator.socialLinks)
  );
  const [customSocialLinks, setCustomSocialLinks] = useState<CustomSocialLink[]>(() =>
    customSocialLinksFromLinks(creator.socialLinks)
  );
  const [socialPicker, setSocialPicker] = useState<SocialPickerState>({
    platform: "spotify",
    label: "",
    url: ""
  });
  const [media, setMedia] = useState<MediaState>({
    avatarFile: null,
    coverFile: null,
    avatarPreviewUrl: "",
    coverPreviewUrl: ""
  });
  const [saving, setSaving] = useState(false);
  const socialUrlInputRef = useRef<HTMLInputElement>(null);
  const customLabelInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message: isDemo ? text.demo : ""
  });

  useEffect(() => {
    setForm(profileToForm(creator));
    setSocialValues(socialLinkFormValues(creator.socialLinks));
    setCustomSocialLinks(customSocialLinksFromLinks(creator.socialLinks));
    setStatus({ type: "idle", message: isDemo ? text.demo : "" });
  }, [creator, isDemo, text.demo]);

  useEffect(() => {
    return () => {
      revokePreview(media.avatarPreviewUrl);
      revokePreview(media.coverPreviewUrl);
    };
  }, [media.avatarPreviewUrl, media.coverPreviewUrl]);

  const previewSocialLinks = useMemo(
    () => socialLinksFromRecord(socialLinkRecordFromForm(socialValues, customSocialLinks)),
    [customSocialLinks, socialValues]
  );
  const previewAvatar = media.avatarPreviewUrl || form.avatarUrl || creator.avatarUrl;
  const previewCover = media.coverPreviewUrl || form.coverUrl || creator.coverUrl;
  const nextHandleChangeDate = getNextHandleChangeDate(creator.handleUpdatedAt);
  const handleLocked = Boolean(nextHandleChangeDate && nextHandleChangeDate > new Date());

  function updateField<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateSocialPicker<K extends keyof SocialPickerState>(
    key: K,
    value: SocialPickerState[K]
  ) {
    setSocialPicker((current) => ({ ...current, [key]: value }));
  }

  function selectSocialPlatform(value: SocialPickerState["platform"]) {
    setSocialPicker((current) => ({ ...current, platform: value }));
    window.requestAnimationFrame(() => {
      if (value === "custom") {
        customLabelInputRef.current?.focus();
        return;
      }

      socialUrlInputRef.current?.focus();
    });
  }

  function addSocialLink() {
    const url = socialPicker.url.trim();
    if (!url) return;

    if (socialPicker.platform === "custom") {
      const label = socialPicker.label.trim();
      if (!label) return;
      setCustomSocialLinks((current) => [...current, { label, url }]);
      setSocialPicker((current) => ({ ...current, label: "", url: "" }));
      return;
    }

    setSocialValues((current) => ({ ...current, [socialPicker.platform]: url }));
    setSocialPicker((current) => ({ ...current, url: "" }));
  }

  function removeSocialLink(platform: SocialLinkPlatform, index: number) {
    if (platform === "custom") {
      setCustomSocialLinks((current) => current.filter((_, itemIndex) => itemIndex !== index));
      return;
    }

    setSocialValues((current) => {
      const next = { ...current };
      delete next[platform];
      return next;
    });
  }

  function updateMedia(kind: "avatar" | "cover", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const previewUrl = file ? URL.createObjectURL(file) : "";

    setMedia((current) => {
      revokePreview(kind === "avatar" ? current.avatarPreviewUrl : current.coverPreviewUrl);
      return kind === "avatar"
        ? { ...current, avatarFile: file, avatarPreviewUrl: previewUrl }
        : { ...current, coverFile: file, coverPreviewUrl: previewUrl };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isDemo) {
      setStatus({ type: "success", message: text.demo });
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setStatus({ type: "error", message: text.signIn });
      return;
    }

    setSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      const { user, profile } = await ensureCurrentProfile(client);
      if (!user) {
        throw new Error(text.signIn);
      }
      if (user.id !== creator.id) {
        throw new Error(text.ownerOnly);
      }

      const [avatarUrl, coverUrl] = await Promise.all([
        media.avatarFile
          ? uploadProfileImage(client, user.id, "avatar", media.avatarFile)
          : Promise.resolve(form.avatarUrl.trim() || null),
        media.coverFile
          ? uploadProfileImage(client, user.id, "cover", media.coverFile)
          : Promise.resolve(form.coverUrl.trim() || null)
      ]);

      const nextHandle = normalizeHandle(form.handle);
      if (nextHandle.length < 2) {
        throw new Error(text.handlePolicy);
      }
      if (profile && nextHandle !== profile.handle && !canChangeHandle(profile.handle_updated_at)) {
        throw new Error(
          `${text.handleLocked} ${formatHandleDate(getNextHandleChangeDate(profile.handle_updated_at), language)}`
        );
      }

      const { error } = await client
        .from("profiles")
        .update({
          full_name: form.fullName.trim(),
          handle: nextHandle,
          headline: form.headline.trim() || null,
          location: form.location.trim() || null,
          bio: form.bio.trim() || null,
          specialties: splitSpecialties(form.specialties),
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          social_links: socialLinkRecordFromForm(socialValues, customSocialLinks)
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setStatus({ type: "success", message: text.saved });
      setMedia({
        avatarFile: null,
        coverFile: null,
        avatarPreviewUrl: "",
        coverPreviewUrl: ""
      });
      onSaved?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : text.error;
      setStatus({
        type: "error",
        message: isUniqueHandleError(message) ? text.handleTaken : message
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-jam-blue" />
            <h2 className="text-xl font-semibold text-white">{text.title}</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{text.description}</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-jam-blue px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {saving ? text.saving : text.save}
        </button>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="self-start rounded-lg border border-white/10 bg-black/24 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jam-blue">
            {text.visuals}
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/24">
            <div className="relative h-32">
              <Image src={previewCover} alt="" fill sizes="480px" className="object-cover" />
            </div>
            <div className="-mt-9 px-4 pb-4">
              <Image
                src={previewAvatar}
                alt=""
                width={88}
                height={88}
                className="relative h-[88px] w-[88px] rounded-lg border-4 border-jam-panel object-cover"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FileControl
              label={text.avatarFile}
              hint={text.imageHint}
              onChange={(event) => updateMedia("avatar", event)}
            />
            <FileControl
              label={text.coverFile}
              hint={text.imageHint}
              onChange={(event) => updateMedia("cover", event)}
            />
          </div>

          <details className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-white/46 transition hover:text-white">
              {text.visualUrlToggle}
            </summary>
            <div className="mt-4 grid gap-3">
              <Field label={text.avatarUrl}>
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={(event) => updateField("avatarUrl", event.target.value)}
                  className="input-field"
                />
              </Field>
              <Field label={text.coverUrl}>
                <input
                  type="url"
                  value={form.coverUrl}
                  onChange={(event) => updateField("coverUrl", event.target.value)}
                  className="input-field"
                />
              </Field>
            </div>
          </details>
        </section>

        <section className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-black/24 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jam-blue">
              {text.identity}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={text.fullName}>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  required
                  className="input-field"
                />
              </Field>
              <Field label={text.handle}>
                <input
                  value={form.handle}
                  onChange={(event) => updateField("handle", normalizeHandle(event.target.value))}
                  required
                  disabled={handleLocked}
                  className="input-field"
                />
                <span className="mt-2 block text-xs leading-5 text-white/38">
                  {handleLocked
                    ? `${text.handleLocked} ${formatHandleDate(nextHandleChangeDate, language)}`
                    : text.handlePolicy}
                </span>
              </Field>
              <Field label={text.headline}>
                <input
                  value={form.headline}
                  onChange={(event) => updateField("headline", event.target.value)}
                  className="input-field"
                />
              </Field>
              <Field label={text.location}>
                <input
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  className="input-field"
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label={text.bio}>
                <textarea
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={5}
                  className="input-field min-h-32 resize-y py-3"
                />
              </Field>
              <Field label={text.specialties}>
                <input
                  value={form.specialties}
                  onChange={(event) => updateField("specialties", event.target.value)}
                  placeholder={text.specialtiesHint}
                  className="input-field"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/24 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jam-blue">
              {text.socials}
            </p>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr_auto]">
                <Field label={text.socialPlatform}>
                  <UiSelect
                    value={socialPicker.platform}
                    onChange={selectSocialPlatform}
                    ariaLabel={text.socialPlatform}
                    restoreFocusOnSelect={false}
                    options={[
                      ...socialPlatforms.map((platform) => ({
                        value: platform.id,
                        label: platform.label
                      })),
                      { value: "custom", label: text.customPlatform }
                    ]}
                  />
                </Field>
                <Field label={text.socialUrl}>
                  <input
                    ref={socialUrlInputRef}
                    type="url"
                    value={socialPicker.url}
                    onChange={(event) => updateSocialPicker("url", event.target.value)}
                    placeholder={getSocialPlaceholder(socialPicker.platform)}
                    className="input-field"
                  />
                </Field>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="focus-ring mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-5 text-sm font-bold text-white/76 transition hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white md:mt-6"
                >
                  <Plus size={17} />
                  {text.addSocial}
                </button>
              </div>
              {socialPicker.platform === "custom" ? (
                <div className="mt-3">
                  <Field label={text.customSiteName}>
                    <input
                      ref={customLabelInputRef}
                      value={socialPicker.label}
                      onChange={(event) => updateSocialPicker("label", event.target.value)}
                      placeholder="Bandcamp, Linktree, Portfolio..."
                      className="input-field"
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2">
              {previewSocialLinks.length > 0 ? (
                previewSocialLinks.map((link, index) => {
                  const removeIndex =
                    link.platform === "custom"
                      ? previewSocialLinks
                          .slice(0, index)
                          .filter((item) => item.platform === "custom").length
                      : index;

                  return (
                    <div
                      key={`${link.platform}-${link.label}-${link.url}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{link.label}</p>
                        <p className="truncate text-xs text-white/42">{link.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSocialLink(link.platform, removeIndex)}
                        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-jam-coral/40 hover:bg-jam-coral/10 hover:text-jam-coral"
                        aria-label={`${link.label} remove`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-lg border border-dashed border-white/12 px-3 py-4 text-sm text-white/42">
                  {text.emptySocials}
                </p>
              )}
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/36">
                {text.preview}
              </p>
              {previewSocialLinks.length > 0 ? (
                <SocialLinkList links={previewSocialLinks} compact />
              ) : (
                <p className="text-sm text-white/42">-</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {status.message ? (
        <p
          className={cn(
            "mt-5 text-sm leading-6",
            status.type === "success"
              ? "text-jam-blue"
              : status.type === "error"
                ? "text-jam-coral"
                : "text-white/42"
          )}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/38">
        {label}
      </span>
      {children}
    </label>
  );
}

function FileControl({
  label,
  hint,
  onChange
}: {
  label: string;
  hint: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-lg border border-dashed border-white/14 bg-white/[0.035] p-4 transition hover:border-jam-blue/40 hover:bg-jam-blue/5">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        className="sr-only"
      />
      <span className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-jam-blue/15 text-jam-blue">
          <Camera size={18} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">{label}</span>
          <span className="mt-1 block text-xs leading-5 text-white/44">{hint}</span>
        </span>
      </span>
    </label>
  );
}

async function uploadProfileImage(
  client: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
  kind: "avatar" | "cover",
  file: File
) {
  const path = `${userId}/${kind}-${Date.now()}-${safeFileName(file.name)}`;
  const buckets = ["profile-media", "listing-covers"] as const;
  let lastError = "";

  for (const bucket of buckets) {
    const { error } = await client.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true
    });

    if (!error) {
      return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }

    lastError = error.message;
  }

  throw new Error(lastError);
}

function profileToForm(creator: Creator): ProfileFormState {
  return {
    fullName: creator.name,
    handle: creator.handle,
    headline: creator.headline,
    location: creator.location,
    bio: creator.about,
    specialties: creator.specialties.join(", "),
    avatarUrl: creator.avatarUrl,
    coverUrl: creator.coverUrl
  };
}

function splitSpecialties(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSocialPlaceholder(platform: SocialLinkPlatform) {
  if (platform === "custom") {
    return "https://...";
  }

  return socialPlatforms.find((item) => item.id === platform)?.placeholder ?? "https://...";
}

function normalizeHandle(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "jamly"
  );
}

function getNextHandleChangeDate(value?: string | null) {
  if (!value) return null;
  const changedAt = new Date(value);
  if (Number.isNaN(changedAt.getTime())) return null;
  return new Date(changedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
}

function canChangeHandle(value?: string | null) {
  const nextDate = getNextHandleChangeDate(value);
  return !nextDate || nextDate <= new Date();
}

function formatHandleDate(value: Date | null, language: "tr" | "en") {
  if (!value) return "";
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
    dateStyle: "medium"
  }).format(value);
}

function isUniqueHandleError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("duplicate key") ||
    normalized.includes("unique constraint") ||
    normalized.includes("profiles_handle_key")
  );
}

function safeFileName(fileName: string) {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "") || "profile"
  );
}

function revokePreview(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
