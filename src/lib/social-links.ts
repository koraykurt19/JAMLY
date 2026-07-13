export const socialPlatforms = [
  {
    id: "spotify",
    label: "Spotify",
    placeholder: "https://open.spotify.com/artist/..."
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/..."
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@..."
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@..."
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    placeholder: "https://soundcloud.com/..."
  },
  {
    id: "website",
    label: "Website",
    placeholder: "https://..."
  }
] as const;

export type SocialPlatform = (typeof socialPlatforms)[number]["id"];
export type SocialLinkPlatform = SocialPlatform | "custom";

export type SocialLink = {
  platform: SocialLinkPlatform;
  label: string;
  url: string;
};

export type SocialLinkRecord = Partial<Record<SocialPlatform, string>>;
export type CustomSocialLink = {
  label: string;
  url: string;
};

export function socialLinksFromRecord(value: unknown): SocialLink[] {
  if (!isRecord(value)) {
    return [];
  }

  const fixedLinks = socialPlatforms.flatMap((platform) => {
    const rawUrl = value[platform.id];
    if (typeof rawUrl !== "string") {
      return [];
    }

    const url = rawUrl.trim();
    return url ? [{ platform: platform.id, label: platform.label, url }] : [];
  });

  const rawCustomLinks = value.custom;
  const customLinks = Array.isArray(rawCustomLinks)
    ? rawCustomLinks.flatMap((item): SocialLink[] => {
        if (!isRecord(item)) {
          return [];
        }
        const label = typeof item.label === "string" ? item.label.trim() : "";
        const url = typeof item.url === "string" ? item.url.trim() : "";
        return label && url ? [{ platform: "custom", label, url }] : [];
      })
    : [];

  return [...fixedLinks, ...customLinks];
}

export function socialLinksToRecord(links: SocialLink[]): Record<string, string> {
  return links.reduce<Record<string, string>>((record, link) => {
    const url = link.url.trim();
    if (url && link.platform !== "custom") {
      record[link.platform] = url;
    }
    return record;
  }, {});
}

export function socialLinkRecordFromForm(
  values: SocialLinkRecord,
  customLinks: CustomSocialLink[] = []
): Record<string, string | CustomSocialLink[]> {
  const record = socialPlatforms.reduce<Record<string, string | CustomSocialLink[]>>((record, platform) => {
    const url = values[platform.id]?.trim();
    if (url) {
      record[platform.id] = url;
    }
    return record;
  }, {});

  const cleanCustomLinks = customLinks
    .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
    .filter((link) => link.label && link.url);

  if (cleanCustomLinks.length > 0) {
    record.custom = cleanCustomLinks;
  }

  return record;
}

export function socialLinkFormValues(links: SocialLink[]): SocialLinkRecord {
  return links.reduce<SocialLinkRecord>((record, link) => {
    if (link.platform !== "custom") {
      record[link.platform] = link.url;
    }
    return record;
  }, {});
}

export function customSocialLinksFromLinks(links: SocialLink[]): CustomSocialLink[] {
  return links
    .filter((link) => link.platform === "custom")
    .map((link) => ({ label: link.label, url: link.url }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
