import type { Language } from "@/lib/i18n";
import type {
  BeatLicenseTier,
  Listing,
  OrderLicenseTier
} from "@/lib/types";

export const STANDARD_LICENSE_VERSION = "2026-07-07";
export const MP3_DISTRIBUTION_LIMIT = 2_500;

export const beatLicenseTiers: BeatLicenseTier[] = [
  "nonExclusive",
  "unlimited",
  "exclusive"
];

type LocalizedLicenseCopy = {
  name: string;
  qualifier: string;
  summary: string;
  files: string[];
  terms: string[];
  deliveryLabel: string;
};

type BeatLicenseDefinition = {
  id: BeatLicenseTier;
  databaseValue: "non_exclusive" | "unlimited" | "exclusive";
  deliveryFolder: "mp3" | "unlimited" | "exclusive";
  removesFromMarket: boolean;
  copy: Record<Language, LocalizedLicenseCopy>;
};

export const beatLicenses: Record<BeatLicenseTier, BeatLicenseDefinition> = {
  nonExclusive: {
    id: "nonExclusive",
    databaseValue: "non_exclusive",
    deliveryFolder: "mp3",
    removesFromMarket: false,
    copy: {
      tr: {
        name: "MP3 Lisansı",
        qualifier: "Non-Exclusive",
        summary: `${MP3_DISTRIBUTION_LIMIT.toLocaleString("tr-TR")} stream veya kopyaya kadar temel yayın lisansı.`,
        files: ["MP3"],
        terms: [
          `${MP3_DISTRIBUTION_LIMIT.toLocaleString("tr-TR")} stream / ${MP3_DISTRIBUTION_LIMIT.toLocaleString("tr-TR")} kopya`,
          "1 monetize edilmemiş video",
          "Radyo yayınına kapalı",
          "Non-exclusive kullanım",
          "Kredi zorunlu: Prod. by [Üretici adı]"
        ],
        deliveryLabel: "MP3 teslim paketi"
      },
      en: {
        name: "MP3 License",
        qualifier: "Non-Exclusive",
        summary: `Entry license for up to ${MP3_DISTRIBUTION_LIMIT.toLocaleString("en-US")} streams or copies.`,
        files: ["MP3"],
        terms: [
          `${MP3_DISTRIBUTION_LIMIT.toLocaleString("en-US")} streams / ${MP3_DISTRIBUTION_LIMIT.toLocaleString("en-US")} copies`,
          "1 non-monetized video",
          "No radio use",
          "Non-exclusive use",
          "Credit required: Prod. by [Creator name]"
        ],
        deliveryLabel: "MP3 delivery package"
      }
    }
  },
  unlimited: {
    id: "unlimited",
    databaseValue: "unlimited",
    deliveryFolder: "unlimited",
    removesFromMarket: false,
    copy: {
      tr: {
        name: "WAV + Trackout Lisansı",
        qualifier: "Unlimited",
        summary: "Sınırsız dijital dağıtım ve profesyonel miks için trackout erişimi.",
        files: ["WAV", "MP3", "Trackout ZIP"],
        terms: [
          "Sınırsız stream ve kopya",
          "Monetize video serbest",
          "Sınırlı radyo hakkı",
          "Non-exclusive kullanım",
          "Kredi opsiyonel"
        ],
        deliveryLabel: "WAV + MP3 + Trackout paketi"
      },
      en: {
        name: "WAV + Trackout License",
        qualifier: "Unlimited",
        summary: "Unlimited digital distribution with trackouts for a professional mix.",
        files: ["WAV", "MP3", "Trackout ZIP"],
        terms: [
          "Unlimited streams and copies",
          "Monetized video allowed",
          "Limited radio rights",
          "Non-exclusive use",
          "Credit optional"
        ],
        deliveryLabel: "WAV + MP3 + Trackout package"
      }
    }
  },
  exclusive: {
    id: "exclusive",
    databaseValue: "exclusive",
    deliveryFolder: "exclusive",
    removesFromMarket: true,
    copy: {
      tr: {
        name: "Exclusive Lisans",
        qualifier: "Tam Haklar",
        summary: "Tüm teslim dosyaları, sınırsız kullanım ve ilanın satıştan kaldırılması.",
        files: ["WAV", "MP3", "Trackout ZIP", "Varsa proje dosyası"],
        terms: [
          "Sınırsız kullanım ve dağıtım",
          "Tüm mevcut prodüksiyon dosyaları",
          "Satıştan sonra ilan kapanır",
          "Diğer lisans satışları durur",
          "Kredi opsiyonel"
        ],
        deliveryLabel: "Exclusive tam dosya paketi"
      },
      en: {
        name: "Exclusive License",
        qualifier: "Full Rights",
        summary: "Every available production file, unlimited use, and marketplace removal.",
        files: ["WAV", "MP3", "Trackout ZIP", "Project file when available"],
        terms: [
          "Unlimited use and distribution",
          "All available production files",
          "Listing closes after purchase",
          "All other license sales stop",
          "Credit optional"
        ],
        deliveryLabel: "Exclusive full-file package"
      }
    }
  }
};

export const licenseLegalNotice: Record<Language, string> = {
  tr: "Lisans şartları standart şablon niteliğindedir; nihai kullanım için hukuki inceleme önerilir.",
  en: "License terms are provided as a standard template; legal review is recommended for final use."
};

export function getBeatLicenseCopy(tier: BeatLicenseTier, language: Language) {
  return beatLicenses[tier].copy[language];
}

export function getBeatLicensePrice(listing: Listing, tier: BeatLicenseTier) {
  return listing.licensePrices?.[tier] ?? listing.price;
}

export function getBeatDeliveryPath(listing: Listing, tier: BeatLicenseTier) {
  return listing.deliveryFiles?.[tier] ?? null;
}

export function isBeatLicenseListing(listing: Listing) {
  return listing.category === "Beat" && listing.licensePrices !== null;
}

export function toDatabaseLicenseTier(tier: BeatLicenseTier) {
  return beatLicenses[tier].databaseValue;
}

export function fromDatabaseLicenseTier(
  tier: "non_exclusive" | "unlimited" | "exclusive" | "service"
): OrderLicenseTier {
  return tier === "non_exclusive" ? "nonExclusive" : tier;
}

export function getDeliveryFolder(tier: BeatLicenseTier) {
  return beatLicenses[tier].deliveryFolder;
}
