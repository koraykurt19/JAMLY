"use client";

import { Ban, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { PasswordUpdateForm } from "@/components/password-forms";
import { useI18n } from "@/components/language-provider";
import { Pill } from "@/components/ui/surface";
import { useCurrentAccount } from "@/lib/use-current-account";

export default function AccountSettingsPage() {
  const { language, t } = useI18n();
  const account = useCurrentAccount();
  const tr = language === "tr";
  const profile = account.state.status === "signed-in" ? account.state.profile : null;

  return (
    <section className="mx-auto grid min-h-[72vh] w-full max-w-5xl gap-4 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8">
      <div className="rounded-lg border border-white/10 bg-white/[0.055] p-6 shadow-soft sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-jam-mint/20 bg-jam-mint/10 text-jam-mint">
          {account.state.status === "loading" ? <Loader2 size={21} className="animate-spin" /> : <UserRound size={21} />}
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-jam-mint">
          {tr ? "Erisim durumu" : "Access status"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          {profile ? `@${profile.handle}` : tr ? "Hesap kontrolu" : "Account check"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/56">
          {tr
            ? "Kapali beta boyunca app erisimi aktif hesap, admin yetkisi veya beta allowlist ile acilir. On kayit hesabi tek basina urune giris vermez."
            : "During closed beta, app access requires an active account plus admin access or beta allowlist. A pre-register entry alone never unlocks the product."}
        </p>

        <div className="mt-6 grid gap-2">
          <AccessRow
            label={tr ? "Hesap" : "Account"}
            value={profile ? statusLabel(profile.accountStatus, language) : statusFallback(account.state.status, language)}
            good={profile?.accountStatus === "active"}
          />
          <AccessRow
            label={tr ? "Beta kapisi" : "Beta gate"}
            value={profile?.isBetaAllowed ? (tr ? "Acik" : "Open") : tr ? "Kapali" : "Closed"}
            good={profile?.isBetaAllowed === true}
          />
          <AccessRow
            label="Admin"
            value={profile?.isAdmin ? profile.adminRole ?? "admin" : tr ? "Yok" : "None"}
            good={profile?.isAdmin === true}
          />
          <AccessRow
            label={tr ? "Veri plani" : "Data plan"}
            value={profile ? retentionLabel(profile.retentionPlan, profile.retentionMultiplier, language) : "-"}
            good={profile?.retentionPlan === "premium"}
          />
        </div>
      </div>

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

function AccessRow({
  label,
  value,
  good
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-white/8 bg-black/20 px-3">
      <span className="text-sm font-semibold text-white/58">{label}</span>
      <Pill tone={good ? "success" : "neutral"} icon={good ? <ShieldCheck size={13} /> : <Ban size={13} />}>
        {value}
      </Pill>
    </div>
  );
}

function statusLabel(status: "active" | "suspended" | "banned", language: "tr" | "en") {
  if (language === "en") return status;
  if (status === "active") return "Aktif";
  if (status === "suspended") return "Askida";
  return "Yasakli";
}

function statusFallback(status: string, language: "tr" | "en") {
  if (status === "loading") return language === "tr" ? "Kontrol ediliyor" : "Checking";
  if (status === "signed-out") return language === "tr" ? "Giris yok" : "Signed out";
  if (status === "demo") return "Demo";
  return language === "tr" ? "Bilinmiyor" : "Unknown";
}

function retentionLabel(plan: "standard" | "premium", multiplier: number, language: "tr" | "en") {
  const label = language === "tr" ? (plan === "premium" ? "Premium" : "Standart") : plan;
  return `${label} x${multiplier}`;
}
