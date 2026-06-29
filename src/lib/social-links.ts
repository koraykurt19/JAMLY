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

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  url: string;
};

export type SocialLinkRecord = Partial<Record<SocialPlatform, string>>;

export function socialLinksFromRecord(value: unknown): SocialLink[] {
  if (!isRecord(value)) {
    return [];
  }

  return socialPlatforms.flatMap((platform) => {
    const rawUrl = value[platform.id];
    if (typeof rawUrl !== "string") {
      return [];
    }

    const url = rawUrl.trim();
    return url ? [{ platform: platform.id, label: platform.label, url }] : [];
  });
}

export function socialLinksToRecord(links: SocialLink[]): Record<string, string> {
  return links.reduce<Record<string, string>>((record, link) => {
    const url = link.url.trim();
    if (url) {
      record[link.platform] = url;
    }
    return record;
  }, {});
}

export function socialLinkRecordFromForm(values: SocialLinkRecord): Record<string, string> {
  return socialPlatforms.reduce<Record<string, string>>((record, platform) => {
    const url = values[platform.id]?.trim();
    if (url) {
      record[platform.id] = url;
    }
    return record;
  }, {});
}

export function socialLinkFormValues(links: SocialLink[]): SocialLinkRecord {
  return links.reduce<SocialLinkRecord>((record, link) => {
    record[link.platform] = link.url;
    return record;
  }, {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
