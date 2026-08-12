"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Upload,
  UserRound
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { JamlyWordmark } from "@/components/jamly-logo";
import { ClientErrorBoundary } from "@/components/client-error-boundary";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { useI18n } from "@/components/language-provider";
import { useCurrentAccount } from "@/lib/use-current-account";

const MobileNavigationDrawer = dynamic(
  () =>
    import("@/components/mobile-navigation-drawer").then(
      (module) => module.MobileNavigationDrawer
    ),
  { ssr: false }
);

export function SiteHeader() {
  const { language, t } = useI18n();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDrawerMounted, setMobileDrawerMounted] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const account = useCurrentAccount();
  const navItems = [
    { href: "/discover", label: language === "tr" ? "Keşfet" : "Discover" },
    { href: "/beats", label: language === "tr" ? "Beatler" : "Beats" },
    {
      href: "/services",
      label: language === "tr" ? "Hizmetler" : "Services"
    },
    {
      href: "/#creators",
      label: language === "tr" ? "Üreticiler" : "Producers"
    },
    { href: "/jam-match", label: "Jam Match" },
    { href: "/collab", label: "Collab" }
  ];
  const accountProfile =
    account.state.status === "signed-in" ? account.state.profile : null;

  useEffect(() => {
    if (!accountMenuOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080a0f] shadow-[0_12px_34px_rgba(0,0,0,0.34)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
        <Link href="/" className="focus-ring shrink-0 rounded-md">
          <JamlyWordmark />
        </Link>

        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label={language === "tr" ? "Ana navigasyon" : "Main navigation"}
        >
          {navItems.map((item) => {
            const basePath = item.href.split("?")[0]?.split("#")[0] ?? item.href;
            const active =
              basePath !== "/" &&
              (pathname === basePath || pathname.startsWith(`${basePath}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring relative rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white/[0.06] text-white"
                    : "text-white/58 hover:bg-white/[0.045] hover:text-white"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-[17px] h-0.5 bg-jam-mint" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Link
            href="/discover"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.09] text-white/62 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
            aria-label={t("searchMarketplace")}
          >
            <Search size={18} />
          </Link>
          <Link
            href="/messages"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.09] text-white/62 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
            aria-label={t("navMessages")}
            title={t("navMessages")}
          >
            <MessageCircle size={18} />
          </Link>
          {accountProfile ? (
            <ClientErrorBoundary label="notification bell">
              <NotificationBell userId={accountProfile.id} />
            </ClientErrorBoundary>
          ) : null}
          <LanguageToggle />
          <Link
            href="/upload"
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md bg-jam-mint px-4 text-sm font-bold text-[#071018] transition hover:bg-white"
          >
            <Upload size={16} />
            {t("navUpload")}
          </Link>
          {accountProfile ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-white/[0.09] px-3 text-sm font-semibold text-white/76 transition hover:border-white/20 hover:bg-white/[0.05]"
                aria-label={t("accountMenu")}
                aria-expanded={accountMenuOpen}
              >
                <UserRound size={16} className="text-jam-blue" />
                <span className="max-w-28 truncate">@{accountProfile.handle}</span>
                <ChevronDown
                  size={14}
                  className={`text-white/42 transition ${
                    accountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {accountMenuOpen ? (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-white/10 bg-[#10151f] p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                  <AccountLink
                    href="/dashboard"
                    label={t("navDashboard")}
                    icon={LayoutDashboard}
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <AccountLink
                    href="/dashboard/creator"
                    label={t("openSellerWorkspace")}
                    icon={Store}
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <AccountLink
                    href="/collab"
                    label="Collab projeleri"
                    icon={FolderKanban}
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <AccountLink
                    href={`/creators/${accountProfile.handle}`}
                    label={t("navProfile")}
                    icon={UserRound}
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <AccountLink
                    href="/account/profile"
                    label={t("profileSettings")}
                    icon={Settings}
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <AccountLink
                    href="/account/settings"
                    label={t("accountSecurity")}
                    icon={ShieldCheck}
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  {accountProfile.isAdmin ? (
                    <AccountLink
                      href="/admin"
                      label={language === "tr" ? "Admin" : "Admin"}
                      icon={ShieldCheck}
                      onClick={() => setAccountMenuOpen(false)}
                    />
                  ) : null}
                  <div className="my-1 h-px bg-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      void account.signOut();
                    }}
                    className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-white/66 transition hover:bg-white/[0.06] hover:text-white"
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
              className="focus-ring inline-flex min-h-10 items-center rounded-md border border-white/[0.09] px-4 text-sm font-semibold text-white/76 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              {t("navSignIn")}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          {accountProfile ? (
            <ClientErrorBoundary label="mobile notification bell">
              <NotificationBell userId={accountProfile.id} />
            </ClientErrorBoundary>
          ) : null}
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => {
              setMobileDrawerMounted(true);
              setMobileMenuOpen(true);
            }}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-md border border-white/[0.09] bg-white/[0.035] text-white/76 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            aria-label={t("openMenu")}
            aria-expanded={mobileMenuOpen}
            aria-controls="jamly-mobile-navigation"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>

      {mobileDrawerMounted ? (
        <MobileNavigationDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          navigationItems={navItems}
          triggerRef={mobileMenuButtonRef}
          account={accountProfile}
          onSignOut={account.signOut}
        />
      ) : null}
    </header>
  );
}

function AccountLink({
  href,
  label,
  icon: Icon,
  onClick
}: {
  href: string;
  label: string;
  icon: typeof UserRound;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white/66 transition hover:bg-white/[0.06] hover:text-white"
    >
      <Icon size={16} className="text-jam-blue" />
      {label}
    </Link>
  );
}
