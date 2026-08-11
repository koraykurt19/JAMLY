"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type FollowState = {
  followerCount: number;
  isFollowing: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

type ToggleResult = "updated" | "auth-required" | "owner";

const DEMO_STORAGE_KEY = "jamly-demo-creator-follows";

export function useCreatorFollow({
  creatorId,
  viewerId
}: {
  creatorId: string;
  viewerId: string | null;
}) {
  const isDemo = !isSupabaseConfigured() || !isUuid(creatorId);
  const [state, setState] = useState<FollowState>({
    followerCount: 0,
    isFollowing: false,
    loading: true,
    saving: false,
    error: null
  });

  useEffect(() => {
    let active = true;

    async function load() {
      if (isDemo) {
        const followedCreators = readDemoFollows();
        if (active) {
          setState({
            followerCount: followedCreators.has(creatorId) ? 1 : 0,
            isFollowing: followedCreators.has(creatorId),
            loading: false,
            saving: false,
            error: null
          });
        }
        return;
      }

      const client = getSupabaseBrowserClient();
      if (!client) return;

      const countRequest = client
        .from("profile_follows")
        .select("following_id", { count: "exact", head: true })
        .eq("following_id", creatorId);
      const relationshipRequest = viewerId
        ? client
            .from("profile_follows")
            .select("following_id")
            .eq("follower_id", viewerId)
            .eq("following_id", creatorId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null });

      const [countResult, relationshipResult] = await Promise.all([
        countRequest,
        relationshipRequest
      ]);

      if (!active) return;
      const error = countResult.error ?? relationshipResult.error;
      setState({
        followerCount: countResult.count ?? 0,
        isFollowing: Boolean(relationshipResult.data),
        loading: false,
        saving: false,
        error: error?.message ?? null
      });
    }

    void load();
    return () => {
      active = false;
    };
  }, [creatorId, isDemo, viewerId]);

  const toggle = useCallback(async (): Promise<ToggleResult> => {
    if (viewerId === creatorId) return "owner";

    if (isDemo) {
      const followedCreators = readDemoFollows();
      const nextFollowing = !followedCreators.has(creatorId);
      if (nextFollowing) followedCreators.add(creatorId);
      else followedCreators.delete(creatorId);
      writeDemoFollows(followedCreators);
      setState((current) => ({
        ...current,
        followerCount: Math.max(0, current.followerCount + (nextFollowing ? 1 : -1)),
        isFollowing: nextFollowing,
        error: null
      }));
      return "updated";
    }

    if (!viewerId) return "auth-required";
    const client = getSupabaseBrowserClient();
    if (!client) return "auth-required";

    const previousFollowing = state.isFollowing;
    setState((current) => ({ ...current, saving: true, error: null }));

    const result = previousFollowing
      ? await client
          .from("profile_follows")
          .delete()
          .eq("follower_id", viewerId)
          .eq("following_id", creatorId)
      : await client.from("profile_follows").insert({
          follower_id: viewerId,
          following_id: creatorId
        });

    if (result.error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: result.error.message
      }));
      return "updated";
    }

    setState((current) => ({
      ...current,
      followerCount: Math.max(
        0,
        current.followerCount + (previousFollowing ? -1 : 1)
      ),
      isFollowing: !previousFollowing,
      saving: false,
      error: null
    }));
    return "updated";
  }, [creatorId, isDemo, state.isFollowing, viewerId]);

  return { ...state, isOwnProfile: viewerId === creatorId, toggle };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function readDemoFollows() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const value = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "[]");
    return new Set<string>(Array.isArray(value) ? value.filter(isString) : []);
  } catch {
    return new Set<string>();
  }
}

function writeDemoFollows(value: Set<string>) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(Array.from(value)));
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
