"use client";

import Link from "next/link";
import { AlertCircle, Loader2, MessageCircle, MessagesSquare } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ChatWindow } from "@/components/chat-window";
import { ConversationList } from "@/components/conversation-list";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/format";
import type { ChatMessage, ConversationSummary } from "@/lib/messaging-types";
import { useConversations } from "@/lib/use-conversations";

export function MessagesPage({ initialConversationId }: { initialConversationId?: string }) {
  const { t } = useI18n();
  const { state, refresh, applyMessage, clearUnread } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(initialConversationId));

  useEffect(() => {
    if (state.status !== "ready" || state.conversations.length === 0) return;
    const requestedConversation = initialConversationId
      ? state.conversations.find((conversation) => conversation.id === initialConversationId)
      : undefined;
    const currentConversation = selectedConversationId
      ? state.conversations.find((conversation) => conversation.id === selectedConversationId)
      : undefined;
    const nextConversation = requestedConversation ?? currentConversation ?? state.conversations[0];
    if (nextConversation.id !== selectedConversationId) {
      setSelectedConversationId(nextConversation.id);
    }
  }, [initialConversationId, selectedConversationId, state]);

  const activeConversation = useMemo(
    () =>
      state.status === "ready"
        ? state.conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
        : null,
    [selectedConversationId, state]
  );

  function openConversation(conversation: ConversationSummary) {
    setSelectedConversationId(conversation.id);
    setMobileChatOpen(true);
    clearUnread(conversation.id);
  }

  function handleMessageSent(message: ChatMessage) {
    applyMessage(message);
    clearUnread(message.conversationId);
  }

  if (state.status === "loading") {
    return <MessagesState icon={<Loader2 className="animate-spin" />} title={t("messagesLoading")} />;
  }
  if (state.status === "signed-out") {
    return (
      <MessagesState
        icon={<MessageCircle />}
        title={t("messagesSignInTitle")}
        description={t("messagesSignInCopy")}
        action={
          <Link
            href="/auth/sign-in"
            className="focus-ring inline-flex rounded-md bg-jam-mint px-5 py-3 text-sm font-bold text-black hover:bg-white"
          >
            {t("navSignIn")}
          </Link>
        }
      />
    );
  }
  if (state.status === "error") {
    return (
      <MessagesState
        icon={<AlertCircle />}
        title={t("dashboardErrorTitle")}
        description={state.message}
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            className="focus-ring rounded-md bg-white px-5 py-3 text-sm font-bold text-black hover:bg-jam-mint"
          >
            {t("dashboardRetry")}
          </button>
        }
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold text-jam-mint">
            <MessagesSquare size={17} />
            {t("messagesEyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{t("messagesTitle")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/52">
            {t("messagesDescription")}
          </p>
        </div>
        {state.isDemo ? (
          <span className="self-start rounded-md border border-jam-blue/25 bg-jam-blue/10 px-3 py-2 text-xs font-semibold text-jam-blue">
            {t("demoMessages")}
          </span>
        ) : null}
      </div>

      <div className="grid h-[calc(100vh-14rem)] min-h-[600px] overflow-hidden rounded-lg border border-white/10 shadow-soft md:grid-cols-[22rem_minmax(0,1fr)]">
        <div className={cn("min-h-0 border-r border-white/10", mobileChatOpen ? "hidden md:block" : "block")}>
          <ConversationList
            conversations={state.conversations}
            activeConversationId={selectedConversationId}
            onSelect={openConversation}
          />
        </div>
        <div className={cn("min-h-0", mobileChatOpen ? "block" : "hidden md:block")}>
          {activeConversation ? (
            <ChatWindow
              key={activeConversation.id}
              conversation={activeConversation}
              currentUserId={state.currentUserId}
              isDemo={state.isDemo}
              onBack={() => setMobileChatOpen(false)}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyChat() {
  const { t } = useI18n();
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/12 text-jam-blue">
          <MessageCircle size={22} />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-white">{t("selectConversation")}</h2>
        <p className="mt-2 text-sm leading-6 text-white/46">{t("selectConversationCopy")}</p>
      </div>
    </div>
  );
}

function MessagesState({
  icon,
  title,
  description,
  action
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 text-center">
      <div>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">
          {icon}
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-6 text-white/52">{description}</p> : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </section>
  );
}
