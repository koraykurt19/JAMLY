"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const CORE_ROUTES = [
  "/",
  "/marketplace",
  "/jam-match",
  "/dashboard",
  "/dashboard/creator",
  "/dashboard/buyer",
  "/upload",
  "/messages",
  "/auth/sign-in"
];

const PREFETCHABLE_PATHS = new Set(CORE_ROUTES.filter((route) => route !== "/"));

export function NavigationPerformance() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const prefetchedRoutes = useRef(new Set<string>());
  const revealTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);

  const prefetchRoute = useCallback(
    (route: string) => {
      if (prefetchedRoutes.current.has(route)) return;
      prefetchedRoutes.current.add(route);
      router.prefetch(route);
    },
    [router]
  );

  useEffect(() => {
    function prefetchCoreRoutes() {
      for (const route of CORE_ROUTES) {
        prefetchRoute(route);
      }
    }

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchCoreRoutes, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchCoreRoutes, 900);
    return () => globalThis.clearTimeout(timeoutId);
  }, [prefetchRoute]);

  useEffect(() => {
    function handleIntent(event: Event) {
      const link = getInternalLink(event.target);
      if (!link) return;
      const route = getPrefetchRoute(link);
      if (route) prefetchRoute(route);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = getInternalLink(event.target);
      if (!link || link.target) return;

      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}${url.search}` === `${window.location.pathname}${window.location.search}`) {
        return;
      }

      if (revealTimer.current) window.clearTimeout(revealTimer.current);
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current);

      revealTimer.current = window.setTimeout(() => setPending(true), 90);
      safetyTimer.current = window.setTimeout(() => setPending(false), 5000);
    }

    document.addEventListener("pointerover", handleIntent, { capture: true, passive: true });
    document.addEventListener("touchstart", handleIntent, { capture: true, passive: true });
    document.addEventListener("focusin", handleIntent, { capture: true });
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("pointerover", handleIntent, { capture: true });
      document.removeEventListener("touchstart", handleIntent, { capture: true });
      document.removeEventListener("focusin", handleIntent, { capture: true });
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [prefetchRoute]);

  useEffect(() => {
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    setPending(false);
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className={`fixed left-0 top-0 z-[100] h-0.5 origin-left bg-gradient-to-r from-jam-mint via-jam-blue to-white shadow-[0_0_24px_rgba(88,197,255,0.55)] transition-all duration-500 ${
        pending ? "w-4/5 opacity-100" : "w-0 opacity-0"
      }`}
    />
  );
}

function getInternalLink(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link) return null;

  try {
    const url = new URL(link.href);
    return url.origin === window.location.origin ? link : null;
  } catch {
    return null;
  }
}

function getPrefetchRoute(link: HTMLAnchorElement) {
  const url = new URL(link.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname.startsWith("/listing/") || url.pathname.startsWith("/creators/")) {
    return `${url.pathname}${url.search}`;
  }
  if (!PREFETCHABLE_PATHS.has(url.pathname)) return null;
  return `${url.pathname}${url.search}`;
}
