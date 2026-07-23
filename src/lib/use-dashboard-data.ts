"use client";

import { useCallback, useEffect, useState } from "react";
import { creators, getCreatorListings, listings, orderRequests } from "@/lib/data";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import {
  fetchCreatorListings,
  fetchMarketplaceListings,
  fetchOrderSummaries,
  ensureCurrentProfile,
  mapProfileToCreator,
  type OrderSummary
} from "@/lib/supabase-data";
import type { Creator, Listing, Role } from "@/lib/types";

type ReadyDashboard = {
  status: "ready";
  listings: Listing[];
  orders: OrderSummary[];
  isDemo: boolean;
  profile: Creator | null;
};

type DashboardState =
  | ReadyDashboard
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string };

const DASHBOARD_CACHE_TTL_MS = 45_000;
const dashboardCache = new Map<Role, { expiresAt: number; state: ReadyDashboard }>();
let currentProfileRequest:
  | Promise<Awaited<ReturnType<typeof ensureCurrentProfile>>>
  | null = null;

export function useDashboardData(role: Role) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<DashboardState>(() => getInitialState(role));

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setState(getDemoState(role));
      return;
    }

    let active = true;
    const cachedState = getCachedDashboardState(role);
    setState(cachedState ?? { status: "loading" });

    async function load() {
      try {
        const { user, profile } = await getCachedCurrentProfile(client);
        if (!active) return;
        if (!user) {
          dashboardCache.clear();
          setState({ status: "signed-out" });
          return;
        }
        if (!profile) {
          throw new Error("Profile record is missing.");
        }

        const [dashboardListings, orders] = await Promise.all([
          role === "creator"
            ? fetchCreatorListings(client, user.id)
            : fetchMarketplaceListings(client),
          fetchOrderSummaries(client, user.id, role)
        ]);

        if (active) {
          const readyState: ReadyDashboard = {
            status: "ready",
            listings: dashboardListings,
            orders,
            isDemo: false,
            profile: role === "creator" ? mapProfileToCreator(profile) : null
          };
          setCachedDashboardState(role, readyState);
          setState(readyState);
        }
      } catch (error) {
        if (active) {
          if (isSupabaseRecoverableError(error)) {
            setState(getDemoState(role));
            return;
          }
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey, role]);

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);
  return { state, retry };
}

function getInitialState(role: Role): DashboardState {
  return isSupabaseConfigured() ? getCachedDashboardState(role) ?? { status: "loading" } : getDemoState(role);
}

function getCachedDashboardState(role: Role) {
  const cached = dashboardCache.get(role);
  if (!cached || cached.expiresAt < Date.now()) {
    dashboardCache.delete(role);
    return null;
  }

  return cached.state;
}

function setCachedDashboardState(role: Role, state: ReadyDashboard) {
  dashboardCache.set(role, { state, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS });
}

async function getCachedCurrentProfile(client: ReturnType<typeof getSupabaseBrowserClient>) {
  if (!currentProfileRequest) {
    currentProfileRequest = ensureCurrentProfile(client);
  }

  try {
    return await currentProfileRequest;
  } finally {
    window.setTimeout(() => {
      currentProfileRequest = null;
    }, 250);
  }
}

function getDemoState(role: Role): ReadyDashboard {
  const demoCreator = creators[0];
  const demoListings =
    role === "creator" ? getCreatorListings(demoCreator.id) : listings;
  const demoOrders = orderRequests
    .filter((order) => role === "buyer" || order.creatorName === demoCreator.name)
    .map(
      (order): OrderSummary => ({
        ...order,
        buyerId: "demo-buyer",
        creatorId: demoCreator.id,
        brief: "",
        statusCode:
          order.status === "Delivered"
            ? "delivered"
            : order.status === "In Review"
              ? "in_review"
              : "requested"
      })
    );

  return {
    status: "ready",
    listings: demoListings,
    orders: demoOrders,
    isDemo: true,
    profile: role === "creator" ? demoCreator : null
  };
}
