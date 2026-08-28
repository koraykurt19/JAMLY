"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JamlyWordmark } from "@/components/jamly-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { createMailto, JAMLY_EMAILS } from "@/lib/jamly-contacts";

export function PreRegisterHeader() {
  const { language } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080a0f]/94 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1160px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring shrink-0 rounded-md" aria-label="Jamly">
          <JamlyWordmark />
        </Link>
        <nav className="flex items-center gap-2" aria-label={language === "tr" ? "Ön kayıt" : "Pre-register"}>
          <a
            href="#features"
            className="focus-ring hidden rounded-md px-3 py-2 text-sm font-semibold text-white/62 transition hover:bg-white/[0.05] hover:text-white sm:inline-flex"
          >
            {language === "tr" ? "Avantajlar" : "Benefits"}
          </a>
          <a
            href="#join"
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-jam-blue px-4 text-sm font-bold text-white transition hover:bg-jam-blue/88"
          >
            {language === "tr" ? "Ön kayıt" : "Pre-register"}
          </a>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}

export function PreRegisterFooter() {
  const { language } = useI18n();

  return (
    <footer className="border-t border-white/[0.08] bg-[#080a0f]">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <JamlyWordmark />
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/48">
            {language === "tr"
              ? "Jamly kapalı beta sürecinde. Bu alan yalnızca ön kayıt ve erken erişim avantajları içindir."
              : "Jamly is in closed beta. This area is only for pre-registration and early-access benefits."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={createMailto(JAMLY_EMAILS.support, {
              subject: language === "tr" ? "Jamly ön kayıt desteği" : "Jamly pre-register support"
            })}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-white/62 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
          >
            {language === "tr" ? "Destek" : "Support"}
            <ArrowUpRight size={15} />
          </Link>
          <Link
            href="https://getjamly.com/auth/sign-in"
            prefetch={false}
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-white/10 px-3 text-sm font-semibold text-white/62 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
          >
            {language === "tr" ? "Admin / beta girişi" : "Admin / beta sign-in"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
