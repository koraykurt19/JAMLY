"use client";

import Link from "next/link";
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import type { Role } from "@/lib/types";

type DashboardStateProps = {
  status: "loading" | "signed-out" | "wrong-role" | "error";
  actualRole?: Role;
  message?: string;
  onRetry?: () => void;
};

export function DashboardState({
  status,
  actualRole,
  message,
  onRetry
}: DashboardStateProps) {
  const { t } = useI18n();
  const loading = status === "loading";
  const signedOut = status === "signed-out";
  const wrongRole = status === "wrong-role";
  const title = loading
    ? t("dashboardLoading")
    : signedOut
      ? t("dashboardSignInTitle")
      : wrongRole
        ? t("wrongDashboardTitle")
        : t("dashboardErrorTitle");
  const description = signedOut
    ? t("dashboardSignInCopy")
    : wrongRole
      ? actualRole === "creator"
        ? t("wrongDashboardCreator")
        : t("wrongDashboardBuyer")
      : message;

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-3xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-lg border border-white/10 bg-white/[0.045] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">
          {loading ? <Loader2 className="animate-spin" /> : signedOut ? <LockKeyhole /> : <AlertCircle />}
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>
        {description ? <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/54">{description}</p> : null}
        {signedOut ? (
          <Link href="/auth/sign-in" className="focus-ring mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-jam-mint">
            {t("navSignIn")}
          </Link>
        ) : null}
        {wrongRole && actualRole ? (
          <Link href={`/dashboard/${actualRole}`} className="focus-ring mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-jam-mint">
            {t("openCorrectDashboard")}
          </Link>
        ) : null}
        {status === "error" && onRetry ? (
          <button type="button" onClick={onRetry} className="focus-ring mt-6 rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white hover:bg-white/8">
            {t("dashboardRetry")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
