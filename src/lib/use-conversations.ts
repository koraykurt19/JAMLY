"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { fetchConversations, getDemoConversations, DEMO_CURRENT_USER_ID } from "@/lib/messaging-data";
import type { ChatMessage, ConversationSummary } from "@/lib/messaging-types";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/supabase-data";
import type { Role } from "@/lib/types";

export type ConversationsState =
  | { status: "loading"; conversations: ConversationSummary[]; isDemo: boolean }
  | { status: "signed-out"; conversations: ConversationSummary[]; isDemo: false }
  | { status: "error"; conversations: ConversationSummary[]; isDemo: boolean; message: string }
  | {
      status: "ready";
      conversations: ConversationSummary[];
      currentUserId: string;
      currentRole: Role;
      isDemo: boolean;
    };

export function useConversations() {
  const { language, t } = useI18n();
  const [state, setState] = useState<ConversationsState>(() =>
    isSupabaseConfigured()
      ? { status: "loading", conversations: [], isDemo: false }
      : {
          status: "ready",
          conversations: getDemoConversations(language),
          currentUserId: DEMO_CURRENT_USER_ID,
          currentRole: "buyer",
          isDemo: true
        }
  );

  const load = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setState({
        status: "ready",
        conversations: getDemoConversations(language),
        currentUserId: DEMO_CURRENT_USER_ID,
        currentRole: "buyer",
        isDemo: true
      });
      return null;
    }

    try {
      const { user, profile } = await getCurrentProfile(client);
      if (!user || !profile) {
        setState({ status: "signed-out", conversations: [], isDemo: false });
        return null;
      }
      const conversations = await fetchConversations(client, user.id);
      setState({
        status: "ready",
        conversations,
        currentUserId: user.id,
        currentRole: profile.role,
        isDemo: false
      });
      return user.id;
    } catch (error) {
      if (isSupabaseRecoverableError(error)) {
        setState({
          status: "ready",
          conversations: getDemoConversations(language),
          currentUserId: DEMO_CURRENT_USER_ID,
          currentRole: "buyer",
          isDemo: true
        });
        return DEMO_CURRENT_USER_ID;
      }
      setState({
        status: "error",
        conversations: [],
        isDemo: false,
        message: error instanceof Error ? error.message : t("unknownError")
      });
      return null;
    }
  }, [language, t]);

  useEffect(() => {
    let active = true;
    const client = getSupabaseBrowserClient();

    if (!client) {
      void load();
      return;
    }

    setState((current) => ({
      status: "loading",
      conversations: current.conversations,
      isDemo: false
    }));
    void load();

    const channel = client
      .channel("jamly-conversation-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          if (active) void load();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          if (active) void load();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [load]);

  const applyMessage = useCallback((message: ChatMessage) => {
    setState((current) => {
      if (current.status !== "ready") return current;
      const conversations = current.conversations
        .map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: message.body,
                lastMessageAt: message.createdAt
              }
            : conversation
        )
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      return { ...current, conversations };
    });
  }, []);

  const clearUnread = useCallback((conversationId: string) => {
    setState((current) =>
      current.status === "ready"
        ? {
            ...current,
            conversations: current.conversations.map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation
            )
          }
        : current
    );
  }, []);

  return { state, refresh: load, applyMessage, clearUnread };
}
