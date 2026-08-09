import type { SocialLink } from "@/lib/social-links";
import type {
  deliverySpeeds,
  listingCategories,
  listingMoods,
  listingUseCases
} from "@/lib/marketplace-config";

export type Role = "creator" | "buyer";

export type ListingCategory = (typeof listingCategories)[number];

export type LicenseType =
  | "Basic Lease"
  | "Premium Lease"
  | "Exclusive"
  | "Service";

export type BeatLicenseTier = "nonExclusive" | "unlimited" | "exclusive";

export type OrderLicenseTier = BeatLicenseTier | "service";

export type BeatLicensePrices = Record<BeatLicenseTier, number>;

export type BeatDeliveryFiles = Record<BeatLicenseTier, string | null>;

export type ListingMood = (typeof listingMoods)[number];

export type ListingUseCase =
  (typeof listingUseCases)[number];

export type DeliverySpeed = (typeof deliverySpeeds)[number];

export type AudioMarker = {
  label: string;
  time: number;
};

export type ListingAnalytics = {
  views: number;
  saves: number;
  plays: number;
  conversionRate: number;
};

export type Creator = {
  id: string;
  handle: string;
  handleUpdatedAt?: string | null;
  name: string;
  role: "creator";
  headline: string;
  location: string;
  avatarUrl: string;
  coverUrl: string;
  rating: number;
  completedOrders: number;
  responseTime: string;
  verified: boolean;
  specialties: string[];
  about: string;
  bestFor: string[];
  notBestFor: string[];
  workflow: string[];
  requirements: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  repeatBuyerRate: number;
  responseRate: number;
  profileStrength: number;
  socialLinks: SocialLink[];
};

export type Listing = {
  id: string;
  creatorId: string;
  creatorHandle: string;
  creatorName: string;
  creatorAvatarUrl: string;
  title: string;
  category: ListingCategory;
  genre: string;
  bpm: number | null;
  price: number;
  description: string;
  audioPreviewUrl: string;
  coverImageUrl: string;
  licenseType: LicenseType;
  turnaround: string;
  tags: string[];
  moods: ListingMood[];
  useCases: ListingUseCase[];
  deliverySpeed: DeliverySpeed;
  deliverables: string[];
  filesIncluded: string[];
  revisionPolicy: string;
  markers: AudioMarker[];
  licensePrices: BeatLicensePrices | null;
  deliveryFiles: BeatDeliveryFiles | null;
  exclusiveSold: boolean;
  isActive: boolean;
  exclusiveAvailable: boolean;
  commercialUse: boolean;
  analytics: ListingAnalytics;
  createdAt: string;
  featured?: boolean;
};

export type OrderRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerName: string;
  creatorName: string;
  price: number;
  licenseTier: OrderLicenseTier;
  licenseTermsVersion: string | null;
  status: "Draft" | "Requested" | "In Review" | "Delivered" | "Cancelled";
  createdAt: string;
};
