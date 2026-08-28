import type { Database } from "@/lib/database.types";

export type WaitlistStatus = Database["public"]["Enums"]["waitlist_status"];

export const waitlistStatuses = [
  "pending",
  "verified",
  "invited",
  "converted",
  "suppressed",
  "blocked"
] as const satisfies readonly WaitlistStatus[];

export const adminMutableWaitlistStatuses = [
  "verified",
  "invited",
  "suppressed",
  "blocked"
] as const satisfies readonly WaitlistStatus[];

export function isAdminMutableWaitlistStatus(value: string): value is WaitlistStatus {
  return (adminMutableWaitlistStatuses as readonly string[]).includes(value);
}

export function allowedWaitlistTransitions(status: WaitlistStatus) {
  switch (status) {
    case "pending":
      return ["verified", "suppressed", "blocked"] as const;
    case "verified":
      return ["invited", "suppressed", "blocked"] as const;
    case "invited":
      return ["verified", "suppressed", "blocked"] as const;
    case "suppressed":
      return ["verified", "blocked"] as const;
    case "blocked":
      return ["verified"] as const;
    case "converted":
      return [] as const;
    default:
      return [] as const;
  }
}

export function canTransitionWaitlistStatus(from: WaitlistStatus, to: WaitlistStatus) {
  return (allowedWaitlistTransitions(from) as readonly string[]).includes(to);
}

export type WaitlistIntentInput = {
  status: WaitlistStatus;
  persona: "creator" | "buyer" | "both" | string;
  referral_count: number | null;
  risk_flags: readonly string[] | null;
  verified_at: string | null;
  launch_signal?: {
    priority?: string;
    beatScore?: number;
    challengeTier?: string;
    completedChallenges?: readonly string[];
  } | null;
};

export function waitlistIntentScore(entry: WaitlistIntentInput) {
  let score = 0;

  if (entry.status === "verified") score += 35;
  if (entry.status === "invited") score += 25;
  if (entry.verified_at) score += 10;
  if (entry.persona === "both") score += 20;
  if (entry.persona === "creator") score += 12;
  if (entry.launch_signal?.priority === "A") score += 18;
  if (entry.launch_signal?.priority === "B") score += 10;
  if (entry.launch_signal?.challengeTier === "alpha") score += 16;
  if (entry.launch_signal?.challengeTier === "priority") score += 12;
  if (entry.launch_signal?.challengeTier === "warm") score += 8;
  if (Number(entry.launch_signal?.beatScore ?? 0) >= 120) score += 10;
  if ((entry.launch_signal?.completedChallenges?.length ?? 0) >= 3) score += 8;

  const referrals = Math.max(Number(entry.referral_count ?? 0), 0);
  score += Math.min(referrals * 8, 32);

  if ((entry.risk_flags?.length ?? 0) > 0) score -= 45;
  if (entry.status === "blocked" || entry.status === "suppressed") score -= 60;
  if (entry.status === "converted") score -= 15;

  return Math.max(0, Math.min(100, score));
}

export function waitlistIntentBucket(score: number) {
  if (score >= 70) return "high" as const;
  if (score >= 35) return "warm" as const;
  if (score > 0) return "watch" as const;
  return "cold" as const;
}
