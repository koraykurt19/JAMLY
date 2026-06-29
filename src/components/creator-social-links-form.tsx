"use client";

import { useEffect, useState } from "react";
import { Save, Sparkles } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { SocialLinkList } from "@/components/social-link-list";
import { cn } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/supabase-data";
import {
  socialLinkFormValues,
  socialLinkRecordFromForm,
  socialLinksFromRecord,
  socialPlatforms,
  type SocialLinkRecord,
  type SocialPlatform
} from "@/lib/social-links";
import type { Creator } from "@/lib/types";

const copy = {
  tr: {
    title: "Sosyal medya bağlantıları",
    description:
      "Spotify, Instagram ve diğer vitrinlerini ekle; alıcılar profilinde seni daha hızlı doğrulayabilsin.",
    demo: "Demo modda bu alan kaydedilmez. Supabase bağlandığında canlı profile yazılır.",
    save: "Bağlantıları kaydet",
    saving: "Kaydediliyor",
    saved: "Bağlantılar profile kaydedildi.",
    signIn: "Kaydetmek için üretici hesabıyla giriş yapmak gerekir.",
    creatorOnly: "Bu alan yalnızca üretici hesapları için kaydedilebilir.",
    error: "Bağlantılar kaydedilemedi.",
    preview: "Profilde görünecek bağlantılar"
  },
  en: {
    title: "Social profile links",
    description:
      "Add Spotify, Instagram, and your other storefronts so buyers can validate your profile faster.",
    demo: "This does not save in demo mode. Once Supabase is connected, it writes to the live profile.",
    save: "Save links",
    saving: "Saving",
    saved: "Links were saved to your profile.",
    signIn: "Sign in with a creator account to save links.",
    creatorOnly: "Only creator accounts can save this section.",
    error: "Links could not be saved.",
    preview: "Links shown on profile"
  }
} as const;

type FormStatus =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type CreatorSocialLinksFormProps = {
  creator: Creator;
  isDemo: boolean;
};

export function CreatorSocialLinksForm({ creator, isDemo }: CreatorSocialLinksFormProps) {
  const { language } = useI18n();
  const text = copy[language];
  const [values, setValues] = useState<SocialLinkRecord>(() =>
    socialLinkFormValues(creator.socialLinks)
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message: isDemo ? text.demo : ""
  });

  useEffect(() => {
    setValues(socialLinkFormValues(creator.socialLinks));
    setStatus({ type: "idle", message: isDemo ? text.demo : "" });
  }, [creator.socialLinks, isDemo, text.demo]);

  const previewLinks = socialLinksFromRecord(values);

  function updateValue(platform: SocialPlatform, value: string) {
    setValues((current) => ({ ...current, [platform]: value }));
  }

  async function saveLinks() {
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
      const { user, profile } = await getCurrentProfile(client);
      if (!user) {
        throw new Error(text.signIn);
      }
      if (profile?.role !== "creator") {
        throw new Error(text.creatorOnly);
      }

      const { error } = await client
        .from("profiles")
        .update({ social_links: socialLinkRecordFromForm(values) })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setStatus({ type: "success", message: text.saved });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : text.error
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-jam-blue" />
            <h2 className="text-xl font-semibold text-white">{text.title}</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/50">{text.description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {socialPlatforms.map((platform) => (
          <label key={platform.id} className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
              {platform.label}
            </span>
            <input
              type="url"
              value={values[platform.id] ?? ""}
              onChange={(event) => updateValue(platform.id, event.target.value)}
              placeholder={platform.placeholder}
              className="focus-ring w-full rounded-lg border border-white/10 bg-black/28 px-4 py-3 text-sm text-white placeholder:text-white/28"
            />
          </label>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-black/24 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/36">
          {text.preview}
        </p>
        {previewLinks.length > 0 ? (
          <SocialLinkList links={previewLinks} compact />
        ) : (
          <p className="text-sm text-white/42">-</p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            "text-sm leading-6",
            status.type === "success"
              ? "text-jam-blue"
              : status.type === "error"
                ? "text-jam-coral"
                : "text-white/42"
          )}
        >
          {status.message}
        </p>
        <button
          type="button"
          onClick={() => void saveLinks()}
          disabled={saving}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-jam-blue px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save size={17} />
          {saving ? text.saving : text.save}
        </button>
      </div>
    </div>
  );
}
