"use client";

import Link from "next/link";
import { useI18n } from "@/components/language-provider";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/8 bg-black/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-white/52 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>{t("footerText")}</p>
        <div className="flex flex-wrap gap-4">
          <Link className="transition hover:text-white" href="/marketplace">
            {t("footerMarketplace")}
          </Link>
          <Link className="transition hover:text-white" href="/upload">
            {t("footerUpload")}
          </Link>
          <Link className="transition hover:text-white" href="/dashboard">
            {t("footerAccount")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
