"use client";

import Link from "next/link";
import { Menu, MessageCircle, Search, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { JamlyWordmark } from "@/components/jamly-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { MobileNavigationDrawer } from "@/components/mobile-navigation-drawer";

export function SiteHeader() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
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
          <JamlyWordmark />
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

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/marketplace"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
            aria-label={t("searchMarketplace")}
          >
            <Search size={18} />
          </Link>
          <Link
            href="/messages"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
            aria-label={t("navMessages")}
            title={t("navMessages")}
          >
            <MessageCircle size={18} />
          </Link>
          <LanguageToggle />
          <Link
            href="/upload"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-jam-mint"
          >
            <Upload size={16} />
            {t("navUpload")}
          </Link>
          <Link
            href="/auth/sign-in"
            className="focus-ring inline-flex rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/8"
          >
            {t("navSignIn")}
          </Link>
        </div>

        <button
          ref={mobileMenuButtonRef}
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/[0.045] text-white/76 transition hover:border-white/20 hover:bg-white/8 hover:text-white md:hidden"
          aria-label={t("openMenu")}
          aria-expanded={mobileMenuOpen}
          aria-controls="jamly-mobile-navigation"
        >
          <Menu size={21} />
        </button>
      </div>

      <MobileNavigationDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navigationItems={navItems}
        triggerRef={mobileMenuButtonRef}
      />
    </header>
  );
}
