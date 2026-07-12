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
  getCurrentProfile,
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
    setState({ status: "loading" });

    async function load() {
      try {
        const { user, profile } = await getCurrentProfile(client);
        if (!active) return;
        if (!user) {
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
          setState({
            status: "ready",
            listings: dashboardListings,
            orders,
            isDemo: false,
            profile: role === "creator" ? mapProfileToCreator(profile) : null
          });
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
  return isSupabaseConfigured() ? { status: "loading" } : getDemoState(role);
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
