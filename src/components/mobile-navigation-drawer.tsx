"use client";

import Link from "next/link";
import { ArrowRight, LogIn, MessageCircle, Upload, X } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/format";

type NavigationItem = {
  href: string;
  label: string;
};

export function MobileNavigationDrawer({
  open,
  onClose,
  navigationItems,
  triggerRef
}: {
  open: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  triggerRef: RefObject<HTMLButtonElement>;
}) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [present, setPresent] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    if (open) {
      setPresent(true);
      frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    timer = window.setTimeout(() => setPresent(false), 260);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function handleDesktopResize(event: MediaQueryListEvent) {
      if (event.matches) onClose();
    }

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    document.addEventListener("keydown", handleEscape);
    desktopQuery.addEventListener("change", handleDesktopResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      desktopQuery.removeEventListener("change", handleDesktopResize);
      triggerElement?.focus();
    };
  }, [onClose, open, triggerRef]);

  if (!present) return null;

  function keepFocusInside(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusableElements = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] md:hidden" aria-hidden={!open}>
      <div
        data-testid="mobile-navigation-overlay"
        onClick={onClose}
        className={cn(
          "absolute inset-0 cursor-default bg-black/72 backdrop-blur-[2px] transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        id="jamly-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label={t("mobileNavigation")}
        onKeyDown={keepFocusInside}
        className={cn(
          "absolute right-0 top-0 flex h-[100dvh] w-[min(22rem,90vw)] flex-col border-l border-white/10 bg-jam-panel shadow-soft transition-transform duration-300 ease-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <span className="text-lg font-semibold text-white">Jamly</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
            aria-label={t("closeMenu")}
          >
            <X size={21} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5" aria-label={t("mobileNavigation")}>
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="focus-ring flex min-h-14 items-center justify-between rounded-lg border border-transparent px-4 text-base font-semibold text-white/76 transition hover:border-white/10 hover:bg-white/[0.055] hover:text-white"
              >
                {item.label}
                <ArrowRight size={18} className="text-white/32" />
              </Link>
            ))}
          </div>

          <div className="my-5 h-px bg-white/10" />

          <div className="space-y-2">
            <DrawerAction href="/messages" label={t("navMessages")} icon={MessageCircle} onClick={onClose} />
            <DrawerAction href="/upload" label={t("navUpload")} icon={Upload} onClick={onClose} />
            <DrawerAction href="/auth/sign-in" label={t("navSignIn")} icon={LogIn} onClick={onClose} />
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <LanguageToggle />
        </div>
      </aside>
    </div>
  );
}

function DrawerAction({
  href,
  label,
  icon: Icon,
  onClick
}: {
  href: string;
  label: string;
  icon: typeof MessageCircle;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="focus-ring flex min-h-14 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-white/70 transition hover:border-jam-blue/30 hover:bg-jam-blue/10 hover:text-white"
    >
      <Icon size={18} className="text-jam-blue" />
      {label}
    </Link>
  );
}
