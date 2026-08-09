"use client";

import { ShieldCheck } from "lucide-react";
import { PasswordUpdateForm } from "@/components/password-forms";
import { useI18n } from "@/components/language-provider";

export default function AccountSettingsPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex min-h-[72vh] w-full max-w-xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-white/10 bg-white/[0.055] p-6 shadow-soft sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-jam-blue/20 bg-jam-blue/10 text-jam-blue">
          <ShieldCheck size={21} />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-jam-blue">{t("accountSecurity")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{t("changePassword")}</h1>
        <p className="mt-3 text-sm leading-6 text-white/56">{t("accountSecurityDescription")}</p>
        <div className="mt-7">
          <PasswordUpdateForm mode="settings" />
        </div>
      </div>
    </section>
  );
}
