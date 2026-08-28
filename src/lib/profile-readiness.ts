export type ProfileReadinessInput = {
  role: "creator" | "buyer" | string;
  handle: string | null | undefined;
  fullName: string | null | undefined;
  headline: string | null | undefined;
  bio: string | null | undefined;
  avatarUrl: string | null | undefined;
  coverUrl: string | null | undefined;
  location?: string | null | undefined;
  specialties?: readonly string[] | null | undefined;
  socialLinkCount?: number | null | undefined;
  activeListingCount?: number | null | undefined;
};

export type ProfileReadinessCheck = {
  key:
    | "identity"
    | "headline"
    | "bio"
    | "avatar"
    | "cover"
    | "specialties"
    | "social"
    | "creator_listing";
  passed: boolean;
  weight: number;
};

export type ProfileReadiness = {
  score: number;
  level: "empty" | "started" | "ready" | "launch_ready";
  checks: ProfileReadinessCheck[];
  missing: ProfileReadinessCheck["key"][];
};

export function profileReadiness(input: ProfileReadinessInput): ProfileReadiness {
  const role = input.role === "creator" ? "creator" : "buyer";
  const bioLength = normalizedLength(input.bio);
  const specialties = input.specialties?.filter((item) => item.trim().length > 0) ?? [];
  const activeListingCount = Math.max(Number(input.activeListingCount ?? 0), 0);

  const checks: ProfileReadinessCheck[] = [
    {
      key: "identity",
      passed: normalizedLength(input.handle) >= 2 && normalizedLength(input.fullName) >= 2,
      weight: 14
    },
    { key: "headline", passed: normalizedLength(input.headline) >= 12, weight: 12 },
    { key: "bio", passed: bioLength >= 80, weight: 18 },
    { key: "avatar", passed: hasUrl(input.avatarUrl), weight: 12 },
    { key: "cover", passed: hasUrl(input.coverUrl), weight: 10 },
    { key: "specialties", passed: specialties.length >= 3, weight: 14 },
    { key: "social", passed: Number(input.socialLinkCount ?? 0) > 0, weight: 10 }
  ];

  if (role === "creator") {
    checks.push({ key: "creator_listing", passed: activeListingCount > 0, weight: 10 });
  }

  const possible = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  const score = Math.round((earned / possible) * 100);
  const missing = checks.filter((check) => !check.passed).map((check) => check.key);

  return {
    score,
    level: score >= 90 ? "launch_ready" : score >= 70 ? "ready" : score >= 30 ? "started" : "empty",
    checks,
    missing
  };
}

function normalizedLength(value: string | null | undefined) {
  return value?.trim().length ?? 0;
}

function hasUrl(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return text.startsWith("https://") || text.startsWith("http://");
}
