"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/language-provider";
import type { Database } from "@/lib/database.types";
import {
  fetchConversationMessages,
  getDemoMessages,
  mapMessage,
  markConversationRead
} from "@/lib/messaging-data";
import type { ChatMessage } from "@/lib/messaging-types";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export type MessagesState =
  | { status: "idle"; messages: ChatMessage[] }
  | { status: "loading"; messages: ChatMessage[] }
  | { status: "ready"; messages: ChatMessage[] }
  | { status: "error"; messages: ChatMessage[]; message: string };

export function useMessages(
  conversationId: string | null,
  currentUserId: string,
  isDemo: boolean
) {
  const { language, t } = useI18n();
  const [state, setState] = useState<MessagesState>({ status: "idle", messages: [] });

  const appendMessage = useCallback((message: ChatMessage) => {
    setState((current) => ({
      status: "ready",
      messages: current.messages.some((item) => item.id === message.id)
        ? current.messages
        : [...current.messages, message]
    }));
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setState({ status: "idle", messages: [] });
      return;
    }
    if (isDemo) {
      setState({ status: "ready", messages: getDemoMessages(conversationId, language) });
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;
    let active = true;
    setState({ status: "loading", messages: [] });

    fetchConversationMessages(client, conversationId)
      .then((messages) => {
        if (!active) return;
        setState((current) => ({
          status: "ready",
          messages: mergeMessages(current.messages, messages)
        }));
        void markConversationRead(client, conversationId, currentUserId).catch(() => undefined);
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            messages: [],
            message: error instanceof Error ? error.message : t("unknownError")
          });
        }
      });

    const channel = client
      .channel(`jamly-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (!active) return;
          const message = mapMessage(payload.new as MessageRow);
          appendMessage(message);
          if (message.senderId !== currentUserId) {
            void markConversationRead(client, conversationId, currentUserId).catch(() => undefined);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [appendMessage, conversationId, currentUserId, isDemo, language, t]);

  return { state, appendMessage };
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const messages = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) messages.set(message.id, message);
  return Array.from(messages.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
