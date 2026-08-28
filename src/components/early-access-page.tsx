"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  ListChecks,
  Music4,
  Rocket,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  Wallet
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { EarlyAccessForm } from "@/components/early-access-form";
import { JamlyWordmark } from "@/components/jamly-logo";
import { Card, Pill } from "@/components/ui/surface";
import { getEarlyAccessCopy } from "@/lib/early-access-copy";
import { cn } from "@/lib/format";

const featureIcons = {
  music: Music4,
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  users: Users,
  shield: Shield,
  wallet: Wallet
} as const;

type WaitlistStats = {
  configured: boolean;
  total: number;
  verified: number;
  creators: number;
};

export function EarlyAccessPage() {
  const { language } = useI18n();
  const copy = getEarlyAccessCopy(language);
  const [stats, setStats] = useState<WaitlistStats | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/waitlist")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: WaitlistStats | null) => {
        if (active && data) setStats(data);
      })
      .catch(() => {
        // The counter is decoration; a failure must not break the page.
      });
    return () => {
      active = false;
    };
  }, []);

  const locale = language === "tr" ? "tr-TR" : "en-US";

  return (
    <main className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgb(var(--c-blue)/0.16),transparent_70%)]"
        />
        <div className="relative mx-auto w-full max-w-[1160px] px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <JamlyWordmark />
            <Pill tone="brand" className="mt-7">
              {copy.badge}
            </Pill>
            <h1 className="mt-5 max-w-3xl text-balance text-[2.15rem] font-bold leading-[1.08] tracking-tight text-white sm:text-[3.1rem] lg:text-[3.6rem]">
              {copy.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-white/68 sm:text-[17px]">
              {copy.heroSubtitle}
            </p>

            <WaitlistCounter stats={stats} copy={copy} locale={locale} />

            <LaunchPass language={language} />

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a
                href="#join"
                className="focus-ring inline-flex min-h-control-lg items-center justify-center rounded-md bg-jam-blue px-6 text-[15px] font-bold text-white transition hover:bg-jam-blue/88"
              >
                {copy.heroCta}
              </a>
              <a
                href="#features"
                className="focus-ring inline-flex min-h-control-lg items-center justify-center gap-2 rounded-md border border-white/12 px-6 text-[15px] font-semibold text-white/78 transition hover:bg-white/[0.06] hover:text-white"
              >
                {copy.heroSecondary}
                <ChevronDown size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-b border-white/8 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
          <header className="max-w-2xl">
            <h2 className="text-[1.7rem] font-bold tracking-tight text-white sm:text-[2.1rem]">
              {copy.valueTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-white/62">{copy.valueSubtitle}</p>
          </header>

          <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.features.map((feature) => {
              const Icon = featureIcons[feature.icon as keyof typeof featureIcons] ?? Sparkles;
              return (
                <li key={feature.title}>
                  <Card className="h-full">
                    <span className="inline-flex size-10 items-center justify-center rounded-md bg-jam-blue/12 text-jam-mint">
                      <Icon size={19} />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-6 text-white/62">{feature.body}</p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Audiences */}
      <section className="border-b border-white/8 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-[1.7rem] font-bold tracking-tight text-white sm:text-[2.1rem]">
            {copy.audienceTitle}
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {copy.audiences.map((audience) => (
              <Card key={audience.key} className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{audience.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-6 text-white/64">{audience.body}</p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {audience.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2 text-[13px] font-medium text-white/72"
                    >
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-jam-mint" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works + form */}
      <section id="join" className="scroll-mt-16 border-b border-white/8 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-[1160px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,26rem)] lg:gap-12 lg:px-8">
          <div>
            <h2 className="text-[1.7rem] font-bold tracking-tight text-white sm:text-[2.1rem]">
              {copy.howTitle}
            </h2>
            <ol className="mt-8 flex flex-col gap-6">
              {copy.howSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-jam-blue/32 bg-jam-blue/10 text-[13px] font-bold text-jam-mint"
                  >
                    {index + 1}
                  </span>
                  <div className="pt-0.5">
                    <h3 className="text-[15px] font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-6 text-white/62">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <EarlyAccessForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-white/8 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[820px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-[1.7rem] font-bold tracking-tight text-white sm:text-[2.1rem]">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 flex flex-col gap-3">
            {copy.faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-white/8 bg-jam-surface/72 px-5 py-4 [&[open]]:bg-jam-surface"
              >
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-white marker:hidden">
                  {item.q}
                  <ChevronDown
                    aria-hidden
                    size={17}
                    className="shrink-0 text-white/40 transition group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-[13.5px] leading-6 text-white/64">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[820px] px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-[1.7rem] font-bold tracking-tight text-white sm:text-[2.1rem]">
            {copy.finalTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-white/62">
            {copy.finalBody}
          </p>
          <a
            href="#join"
            className="focus-ring mt-7 inline-flex min-h-control-lg items-center justify-center rounded-md bg-jam-blue px-7 text-[15px] font-bold text-white transition hover:bg-jam-blue/88"
          >
            {copy.heroCta}
          </a>
          <p className="mt-8 text-[13px] text-white/40">
            <Link
              href="https://getjamly.com/auth/sign-in"
              prefetch={false}
              className="focus-ring rounded underline-offset-4 hover:underline"
            >
              {language === "tr" ? "Admin / beta girişi" : "Admin / beta sign-in"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function LaunchPass({ language }: { language: "tr" | "en" }) {
  const tr = language === "tr";
  const [role, setRole] = useState("both");
  const [need, setNeed] = useState("beats");
  const [readiness, setReadiness] = useState("ready");

  const score =
    (role === "both" ? 35 : 28) +
    (need === "collab" ? 24 : need === "services" ? 22 : 20) +
    (readiness === "ready" ? 36 : readiness === "soon" ? 28 : 18);
  const priority = score >= 88 ? "A" : score >= 72 ? "B" : "C";

  return (
    <div className="mt-8 w-full max-w-3xl rounded-lg border border-white/10 bg-black/24 p-4 text-left shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-jam-mint">
            <Rocket size={15} />
            Launch Pass
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {tr ? "Ön kayıt avantajını netleştir" : "Tune your pre-register edge"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-white/58">
            {tr
              ? "Üç seçimle beta önceliğini ve sana uygun açılış avantajını gör."
              : "Pick three signals and see the launch benefit that fits you."}
          </p>
        </div>
        <div className="rounded-md border border-jam-blue/28 bg-jam-blue/12 px-3 py-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/42">
            {tr ? "Öncelik" : "Priority"}
          </p>
          <p className="text-2xl font-bold text-jam-mint">{priority}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <LaunchPassGroup
          icon={<Users size={15} />}
          label={tr ? "Rol" : "Role"}
          value={role}
          onChange={setRole}
          options={[
            ["creator", tr ? "Üretici" : "Creator"],
            ["buyer", tr ? "Alıcı" : "Buyer"],
            ["both", tr ? "İkisi" : "Both"]
          ]}
        />
        <LaunchPassGroup
          icon={<Target size={15} />}
          label={tr ? "İhtiyaç" : "Need"}
          value={need}
          onChange={setNeed}
          options={[
            ["beats", tr ? "Beat" : "Beats"],
            ["services", tr ? "Hizmet" : "Services"],
            ["collab", "Collab"]
          ]}
        />
        <LaunchPassGroup
          icon={<ListChecks size={15} />}
          label={tr ? "Hazırlık" : "Readiness"}
          value={readiness}
          onChange={setReadiness}
          options={[
            ["ready", tr ? "Hazırım" : "Ready"],
            ["soon", tr ? "Yakında" : "Soon"],
            ["explore", tr ? "Bakıyorum" : "Exploring"]
          ]}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-md border border-white/8 bg-white/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <BadgeCheck size={17} className="mt-0.5 shrink-0 text-jam-mint" />
          <p className="text-sm leading-6 text-white/68">
            {tr
              ? priority === "A"
                ? "Açılışta hızlı beta değerlendirmesi ve kurucu rozet avantajı için güçlü adaysın."
                : priority === "B"
                  ? "Ön kayıt tamamlanınca doğru beta dalgasına alınman kolaylaşır."
                  : "Ön kayıtla ilgini bırak; Jamly uygun açılış segmentini sana e-postayla bildirir."
              : priority === "A"
                ? "You are a strong fit for fast beta review and founding badge benefits."
                : priority === "B"
                  ? "Pre-registering helps place you in the right beta wave."
                  : "Leave your intent and Jamly will email the right launch segment."}
          </p>
        </div>
        <a
          href="#join"
          className="focus-ring inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-jam-mint px-4 text-sm font-bold text-black transition hover:bg-white"
        >
          {tr ? "Ön kayda geç" : "Continue"}
        </a>
      </div>
    </div>
  );
}

function LaunchPassGroup({
  icon,
  label,
  value,
  options,
  onChange
}: {
  icon: ReactNode;
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
        {icon}
        {label}
      </p>
      <div className="grid gap-1.5">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={value === optionValue}
            className={cn(
              "focus-ring min-h-9 rounded-md border px-3 text-left text-xs font-semibold transition",
              value === optionValue
                ? "border-jam-blue/44 bg-jam-blue/14 text-white"
                : "border-white/10 bg-black/20 text-white/58 hover:border-white/20 hover:text-white"
            )}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function WaitlistCounter({
  stats,
  copy,
  locale
}: {
  stats: WaitlistStats | null;
  copy: ReturnType<typeof getEarlyAccessCopy>;
  locale: string;
}) {
  // Never invent social proof: until the real number arrives we show nothing,
  // and a configured-but-empty list says so honestly.
  if (!stats?.configured) return null;

  if (stats.total === 0) {
    return (
      <p className="mt-7 text-[13px] font-semibold uppercase tracking-wide text-jam-mint">
        {copy.counterEmpty}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "mt-7 inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2",
        "rounded-pill border border-white/10 bg-black/28 px-5 py-2.5"
      )}
    >
      <span className="flex items-baseline gap-2">
        <span className="text-xl font-bold tabular-nums text-white">
          {stats.total.toLocaleString(locale)}
        </span>
        <span className="text-[13px] font-medium text-white/60">{copy.counterLabel}</span>
      </span>
      {stats.verified > 0 ? (
        <span className="text-[13px] font-medium text-white/48">
          {stats.verified.toLocaleString(locale)} {copy.counterVerified}
        </span>
      ) : null}
      {stats.creators > 0 ? (
        <span className="text-[13px] font-medium text-white/48">
          {stats.creators.toLocaleString(locale)} {copy.counterCreators}
        </span>
      ) : null}
    </div>
  );
}
