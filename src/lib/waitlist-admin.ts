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
