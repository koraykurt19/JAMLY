"use client";

import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Store,
  Upload,
  UserRound
} from "lucide-react";
import { useRef, useState } from "react";
import { JamlyWordmark } from "@/components/jamly-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { MobileNavigationDrawer } from "@/components/mobile-navigation-drawer";
import { useCurrentAccount } from "@/lib/use-current-account";

export function SiteHeader() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const account = useCurrentAccount();
  const navItems = [
    { href: "/marketplace", label: t("navMarketplace") },
    { href: "/jam-match", label: "Jam Match" },
    { href: "/dashboard", label: t("navDashboard") }
  ];
  const accountProfile = account.state.status === "signed-in" ? account.state.profile : null;

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
          {accountProfile ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-3 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/8"
                aria-label={t("accountMenu")}
                aria-expanded={accountMenuOpen}
              >
                <UserRound size={16} className="text-jam-blue" />
                <span className="max-w-28 truncate">{accountProfile.fullName}</span>
                <ChevronDown size={14} className={`text-white/42 transition ${accountMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {accountMenuOpen ? (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-white/10 bg-jam-panel/95 p-1.5 shadow-soft backdrop-blur-xl">
                  <Link
                    href="/dashboard"
                    onClick={() => setAccountMenuOpen(false)}
                    className="focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/8 hover:text-white"
                  >
                    <LayoutDashboard size={16} className="text-jam-blue" />
                    {t("navDashboard")}
                  </Link>
                  <Link
                    href="/dashboard/creator"
                    onClick={() => setAccountMenuOpen(false)}
                    className="focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/8 hover:text-white"
                  >
                    <Store size={16} className="text-jam-blue" />
                    {t("openSellerWorkspace")}
                  </Link>
                  <Link
                    href={`/creators/${accountProfile.handle}`}
                    onClick={() => setAccountMenuOpen(false)}
                    className="focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/8 hover:text-white"
                  >
                    <UserRound size={16} className="text-jam-blue" />
                    {t("navProfile")}
                  </Link>
                  <div className="my-1 h-px bg-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      void account.signOut();
                    }}
                    className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-white/72 transition hover:bg-white/8 hover:text-white"
                  >
                    <LogOut size={16} className="text-jam-blue" />
                    {t("signOut")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/auth/sign-in"
              className="focus-ring inline-flex rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/8"
            >
              {t("navSignIn")}
            </Link>
          )}
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
        account={accountProfile}
        onSignOut={account.signOut}
      />
    </header>
  );
}
