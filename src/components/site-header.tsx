"use client";

import Link from "next/link";
import { LayoutDashboard, Search, Upload } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-end justify-center gap-[3px] rounded-lg border border-white/12 bg-white/[0.06] px-2 pb-2">
        {[11, 17, 8, 22].map((height, index) => (
          <span
            key={height}
            className="w-[3px] rounded-full bg-jam-mint"
            style={{
              height,
              opacity: index === 2 ? 0.65 : 1
            }}
          />
        ))}
      </span>
      <span className="text-lg font-semibold tracking-tight">Jamly</span>
    </div>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const navItems = [
    { href: "/marketplace", label: t("navMarketplace") },
    { href: "/jam-match", label: "Jam Match" },
    { href: "/dashboard/creator", label: t("navCreator") },
    { href: "/dashboard/buyer", label: t("navBuyer") }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-jam-ink/82 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring rounded-lg">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded-full px-4 py-2 text-sm font-medium text-white/68 transition hover:bg-white/8 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/marketplace"
            className="focus-ring hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:bg-white/8 hover:text-white sm:flex"
            aria-label={t("searchMarketplace")}
          >
            <Search size={18} />
          </Link>
          <LanguageToggle />
          <Link
            href="/upload"
            className="focus-ring hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-jam-mint md:inline-flex"
          >
            <Upload size={16} />
            {t("navUpload")}
          </Link>
          <Link
            href="/auth/sign-in"
            className="focus-ring hidden rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/8 sm:inline-flex"
          >
            {t("navSignIn")}
          </Link>
          <Link
            href="/dashboard/buyer"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:bg-white/8 hover:text-white md:hidden"
            aria-label={t("navDashboard")}
          >
            <LayoutDashboard size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
