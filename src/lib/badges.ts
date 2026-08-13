import type { Language } from "@/lib/i18n";

/**
 * Badge presentation. Award rules live in the database (`badge_definitions`
 * plus `evaluate_profile_badges`); this module only maps a badge onto its
 * visual treatment and localized copy.
 */

export type BadgeCategory =
  | "early_access"
  | "verification"
  | "marketplace"
  | "collaboration"
  | "community";

export type BadgeRarity = "common" | "uncommon" | "rare" | "legendary";
export type BadgeTone = "brand" | "success" | "gold" | "coral" | "neutral";

export type ProfileBadge = {
  key: string;
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string;
  tone: BadgeTone;
  awardedAt: string;
  displayOrder: number;
};

type BadgeRow = {
  badge_key: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string;
  tone: string;
  awarded_at: string;
  display_order: number;
};

export function mapBadgeRow(row: BadgeRow): ProfileBadge {
  return {
    key: row.badge_key,
    nameTr: row.name_tr,
    nameEn: row.name_en,
    descriptionTr: row.description_tr,
    descriptionEn: row.description_en,
    category: row.category,
    rarity: row.rarity,
    icon: row.icon,
    tone: isBadgeTone(row.tone) ? row.tone : "neutral",
    awardedAt: row.awarded_at,
    displayOrder: row.display_order
  };
}

function isBadgeTone(value: string): value is BadgeTone {
  return ["brand", "success", "gold", "coral", "neutral"].includes(value);
}

export function badgeName(badge: ProfileBadge, language: Language) {
  return language === "tr" ? badge.nameTr : badge.nameEn;
}

export function badgeDescription(badge: ProfileBadge, language: Language) {
  return language === "tr" ? badge.descriptionTr : badge.descriptionEn;
}

export const badgeCategoryLabels: Record<Language, Record<BadgeCategory, string>> = {
  tr: {
    early_access: "Erken erişim",
    verification: "Doğrulama",
    marketplace: "Pazar yeri",
    collaboration: "İş birliği",
    community: "Topluluk"
  },
  en: {
    early_access: "Early access",
    verification: "Verification",
    marketplace: "Marketplace",
    collaboration: "Collaboration",
    community: "Community"
  }
};

export const badgeRarityLabels: Record<Language, Record<BadgeRarity, string>> = {
  tr: { common: "Yaygın", uncommon: "Az bulunur", rare: "Nadir", legendary: "Efsanevi" },
  en: { common: "Common", uncommon: "Uncommon", rare: "Rare", legendary: "Legendary" }
};

/**
 * Verification badges carry trust weight, so they always sort first regardless
 * of the configured display order.
 */
export function sortBadgesForProfile(badges: ProfileBadge[]) {
  const categoryWeight: Record<BadgeCategory, number> = {
    verification: 0,
    early_access: 1,
    marketplace: 2,
    collaboration: 3,
    community: 4
  };

  return [...badges].sort((a, b) => {
    const byCategory = categoryWeight[a.category] - categoryWeight[b.category];
    if (byCategory !== 0) return byCategory;
    return a.displayOrder - b.displayOrder;
  });
}
