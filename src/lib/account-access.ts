import { betaAllowedHandleSet } from "@/lib/beta-access";

export type AccountAccessProfile = {
  id: string;
  handle: string;
  fullName: string;
  isAdmin: boolean;
  adminRole: string | null;
  accountStatus: "active" | "suspended" | "banned";
  isBetaHandleAllowed: boolean;
  isBetaDirectAllowed: boolean;
  isBetaAllowed: boolean;
  retentionPlan: "standard" | "premium";
  retentionMultiplier: number;
};

export function resolveBetaAccess({
  accountStatus,
  handle,
  isAdmin,
  isBetaDirectAllowed,
  allowedHandlesCsv
}: {
  accountStatus: "active" | "suspended" | "banned";
  handle: string;
  isAdmin: boolean;
  isBetaDirectAllowed: boolean;
  allowedHandlesCsv?: string;
}) {
  const isBetaHandleAllowed = betaAllowedHandleSet(allowedHandlesCsv).has(handle.toLowerCase());
  return {
    isBetaHandleAllowed,
    isBetaAllowed: accountStatus === "active" && (isAdmin || isBetaDirectAllowed || isBetaHandleAllowed)
  };
}
