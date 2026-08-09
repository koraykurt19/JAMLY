"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { createDemoMessage, sendConversationMessage } from "@/lib/messaging-data";
import type { ChatMessage } from "@/lib/messaging-types";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function useSendMessage({
  conversationId,
  currentUserId,
  isDemo,
  onSent
}: {
  conversationId: string | null;
  currentUserId: string;
  isDemo: boolean;
  onSent: (message: ChatMessage) => void;
}) {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = useCallback(
    async (body: string) => {
      const trimmedBody = body.trim();
      if (!conversationId || !trimmedBody || sending) return false;

      setSending(true);
      setError("");
      try {
        const message = isDemo
          ? createDemoMessage(conversationId, currentUserId, trimmedBody)
          : await sendLiveMessage(conversationId, currentUserId, trimmedBody);
        onSent(message);
        return true;
      } catch (sendError) {
        setError(
          `${t("messageError")}: ${sendError instanceof Error ? sendError.message : t("unknownError")}`
        );
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUserId, isDemo, onSent, sending, t]
  );

  return { sendMessage, sending, error };
}

async function sendLiveMessage(conversationId: string, currentUserId: string, body: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured.");
  return sendConversationMessage(client, conversationId, currentUserId, body);
}
