"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Ban, Clock3, KeyRound, Loader2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { PasswordUpdateForm } from "@/components/password-forms";
import { useI18n } from "@/components/language-provider";
import { Pill } from "@/components/ui/surface";
import { useCurrentAccount } from "@/lib/use-current-account";

export default function AccountSettingsPage() {
  const { language, t } = useI18n();
  const account = useCurrentAccount();
  const tr = language === "tr";
  const profile = account.state.status === "signed-in" ? account.state.profile : null;
  const access = accessSummary(profile, account.state.status, language);
  const retention = retentionSummary(profile?.retentionPlan, profile?.retentionMultiplier ?? 1, language);

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
          {access.description}
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

        <div className="mt-6 grid gap-3">
          <AccountSignal
            icon={<ShieldCheck size={16} />}
            label={tr ? "Kapalı beta sonucu" : "Closed beta result"}
            title={access.title}
            detail={access.detail}
            good={access.good}
          />
          <AccountSignal
            icon={<Clock3 size={16} />}
            label={tr ? "Veri saklama" : "Data retention"}
            title={retention.title}
            detail={retention.detail}
            good={profile?.retentionPlan === "premium"}
          />
          <AccountSignal
            icon={profile?.isAdmin ? <KeyRound size={16} /> : <Sparkles size={16} />}
            label={profile?.isAdmin ? "Admin" : tr ? "Ön kayıt" : "Pre-register"}
            title={
              profile?.isAdmin
                ? tr
                  ? "Yönetim konsolu açık"
                  : "Admin console enabled"
                : tr
                  ? "Ön kayıt ürüne giriş değildir"
                  : "Pre-register is not product access"
            }
            detail={
              profile?.isAdmin
                ? tr
                  ? "Hassas işlemler admin audit kaydına yazılır."
                  : "Sensitive actions are written to the admin audit log."
                : tr
                  ? "Kurucu avantajları saklanır; beta açılınca hesaba çevrilebilir."
                  : "Founder benefits are preserved and can be converted when beta access opens."
            }
            good={profile?.isAdmin === true}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {profile?.isAdmin ? (
            <Link
              href="/admin"
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-jam-blue/35 px-3 text-sm font-bold text-jam-mint transition hover:bg-jam-blue/10"
            >
              {tr ? "Admin paneli aç" : "Open admin"}
            </Link>
          ) : null}
          {!profile?.isBetaAllowed ? (
            <Link
              href="https://pre-register.getjamly.com"
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-white/12 px-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              {tr ? "Ön kayıt sayfası" : "Pre-register page"}
            </Link>
          ) : null}
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

function AccountSignal({
  icon,
  label,
  title,
  detail,
  good
}: {
  icon: ReactNode;
  label: string;
  title: string;
  detail: string;
  good?: boolean;
}) {
  return (
    <div
      className={
        good
          ? "border-l-2 border-jam-mint bg-jam-mint/[0.055] px-4 py-3"
          : "border-l border-white/10 bg-white/[0.025] px-4 py-3"
      }
    >
      <div className="flex items-start gap-3">
        <span className={good ? "mt-0.5 text-jam-mint" : "mt-0.5 text-white/42"}>{icon}</span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">{label}</p>
          <p className="mt-1 text-sm font-bold text-white">{title}</p>
          <p className="mt-1 text-[13px] leading-5 text-white/50">{detail}</p>
        </div>
      </div>
    </div>
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

function accessSummary(
  profile:
    | {
        accountStatus: "active" | "suspended" | "banned";
        isAdmin: boolean;
        isBetaAllowed: boolean;
      }
    | null,
  state: string,
  language: "tr" | "en"
) {
  const tr = language === "tr";
  if (!profile) {
    return {
      good: false,
      title: state === "loading" ? (tr ? "Hesap kontrol ediliyor" : "Checking account") : tr ? "Giriş yok" : "Signed out",
      description: tr
        ? "Kapalı beta boyunca app erişimi aktif hesap, admin yetkisi veya beta allowlist ile açılır."
        : "During closed beta, app access requires an active account plus admin access or beta allowlist.",
      detail: tr
        ? "Ön kayıt kaydı tek başına ürün girişini açmaz."
        : "A pre-register entry alone never unlocks the product."
    };
  }

  if (profile.accountStatus !== "active") {
    return {
      good: false,
      title: tr ? "Hesap erişimi durdurulmuş" : "Account access is restricted",
      description: tr
        ? "Bu hesap aktif olmadığı için kapalı beta ürün alanına giremez."
        : "This account cannot enter the closed beta product while it is not active.",
      detail: tr
        ? "Destek veya admin ekibi durum değişikliği yapmadan giriş açılmaz."
        : "Product access stays closed until support or an admin changes the account status."
    };
  }

  if (profile.isBetaAllowed) {
    return {
      good: true,
      title: profile.isAdmin
        ? tr
          ? "Admin beta erişimi açık"
          : "Admin beta access is open"
        : tr
          ? "Beta erişimi açık"
          : "Beta access is open",
      description: tr
        ? "Bu hesap aktif ve kapalı beta kapısından geçebiliyor."
        : "This account is active and can pass the closed beta gate.",
      detail: tr
        ? "Marketplace, dashboard, collab ve ödeme test akışları bu hesapla kullanılabilir."
        : "Marketplace, dashboard, collab, and sandbox payment flows are available to this account."
    };
  }

  return {
    good: false,
    title: tr ? "Ürün erişimi kapalı" : "Product access is closed",
    description: tr
      ? "Ön kayıt hesabı kurucu avantajını saklar; beta/admin izni olmadan ana ürüne girmez."
      : "A pre-register account keeps founder benefits, but cannot enter the main product without beta/admin access.",
    detail: tr
      ? "Bu ayrım pre-register kullanıcılarının yanlışlıkla getjamly.com içine girmesini engeller."
      : "This boundary keeps pre-register users from accidentally entering getjamly.com."
  };
}

function retentionSummary(
  plan: "standard" | "premium" | undefined,
  multiplier: number,
  language: "tr" | "en"
) {
  const tr = language === "tr";
  const days = 30 * multiplier;
  if (plan === "premium") {
    return {
      title: tr ? `${days} gün geçici veri saklama` : `${days}-day ephemeral data window`,
      detail: tr
        ? "Premium plan desteklenen geçici mesaj/listeleme pencerelerini iki kat uzatır; profil ve kalıcı kayıtlar yine korunur."
        : "Premium doubles supported ephemeral message/listing windows while profiles and durable records stay protected."
    };
  }
  return {
    title: tr ? `${days} gün standart pencere` : `${days}-day standard window`,
    detail: tr
      ? "Maliyet kontrolü için geçici veriler süre sonunda temizlenebilir; profil, ödeme, sipariş ve audit kayıtları silinmez."
      : "Ephemeral data can be pruned after the window for cost control; profiles, payments, orders, and audit records are not deleted."
  };
}
