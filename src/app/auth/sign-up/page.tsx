"use client";

import { AuthForm } from "@/components/auth-form";
import { useI18n } from "@/components/language-provider";

export default function SignUpPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex min-h-[72vh] w-full max-w-2xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-white/10 bg-white/[0.055] p-6 shadow-soft sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-jam-mint">
          {t("signUpEyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          {t("signUpTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/56">
          {t("signUpDescription")}
        </p>
        <div className="mt-7">
          <AuthForm mode="sign-up" />
        </div>
      </div>
    </section>
  );
}
