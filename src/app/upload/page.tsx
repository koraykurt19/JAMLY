"use client";

import Link from "next/link";
import { Loader2, LockKeyhole, UserRoundX } from "lucide-react";
import { useEffect, useState } from "react";
import { UploadListingForm } from "@/components/upload-listing-form";
import { SectionHeading } from "@/components/section-heading";
import { useI18n } from "@/components/language-provider";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/supabase-data";

type UploadAccess =
  | { status: "demo" }
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "creator"; creatorId: string }
  | { status: "error"; message: string };

export default function UploadListingPage() {
  const { t } = useI18n();
  const [access, setAccess] = useState<UploadAccess>(() =>
    isSupabaseConfigured() ? { status: "loading" } : { status: "demo" }
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let active = true;
    getCurrentProfile(supabase)
      .then(({ user }) => {
        if (!active) return;
        if (!user) {
          setAccess({ status: "signed-out" });
        } else {
          setAccess({ status: "creator", creatorId: user.id });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          if (isSupabaseRecoverableError(error)) {
            setAccess({ status: "demo" });
            return;
          }
          setAccess({
            status: "error",
            message: error instanceof Error ? error.message : t("unknownError")
          });
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={t("uploadEyebrow")}
        title={t("uploadTitle")}
        description={t("uploadDescription")}
      />

      <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.045] p-5 sm:p-7">
        {access.status === "loading" ? (
          <AccessNotice icon={<Loader2 className="animate-spin" />} title={t("checkingAccount")} />
        ) : null}
        {access.status === "signed-out" ? (
          <AccessNotice
            icon={<LockKeyhole />}
            title={t("uploadSignInTitle")}
            description={t("uploadSignInCopy")}
            action={{ href: "/auth/sign-in", label: t("navSignIn") }}
          />
        ) : null}
        {access.status === "error" ? (
          <AccessNotice icon={<UserRoundX />} title={t("dashboardErrorTitle")} description={access.message} />
        ) : null}
        {access.status === "creator" ? <UploadListingForm creatorId={access.creatorId} /> : null}
        {access.status === "demo" ? <UploadListingForm /> : null}
      </div>
    </section>
  );
}

function AccessNotice({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
      {description ? <p className="mt-2 max-w-lg text-sm leading-6 text-white/54">{description}</p> : null}
      {action ? (
        <Link href={action.href} className="focus-ring mt-5 rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-jam-mint">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
