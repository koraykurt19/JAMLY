"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, MessageSquareText, Send } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/format";
import type { ChatMessage, ConversationSummary } from "@/lib/messaging-types";
import { useMessages } from "@/lib/use-messages";
import { useSendMessage } from "@/lib/use-send-message";

export function ChatWindow({
  conversation,
  currentUserId,
  isDemo,
  onBack,
  onMessageSent
}: {
  conversation: ConversationSummary;
  currentUserId: string;
  isDemo: boolean;
  onBack: () => void;
  onMessageSent: (message: ChatMessage) => void;
}) {
  const { t } = useI18n();
  const { state, appendMessage } = useMessages(conversation.id, currentUserId, isDemo);
  const bottomRef = useRef<HTMLDivElement>(null);
  const handleSent = useCallback(
    (message: ChatMessage) => {
      appendMessage(message);
      onMessageSent(message);
    },
    [appendMessage, onMessageSent]
  );
  const { error, sendMessage, sending } = useSendMessage({
    conversationId: conversation.id,
    currentUserId,
    isDemo,
    onSent: handleSent
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.messages.length]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white/[0.035]">
      <ChatHeader conversation={conversation} onBack={onBack} />
      {conversation.listing ? <RelatedListing conversation={conversation} /> : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {state.status === "loading" ? (
          <div className="flex h-full items-center justify-center text-sm text-white/46">
            <Loader2 size={18} className="mr-2 animate-spin text-jam-blue" />
            <span>{t("messagesLoading")}</span>
          </div>
        ) : state.status === "error" ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <AlertCircle size={24} className="mx-auto text-red-300" />
              <p className="mt-3 text-sm text-red-200">{state.message}</p>
            </div>
          </div>
        ) : state.messages.length === 0 ? (
          <EmptyConversation />
        ) : (
          <div className="space-y-3">
            {state.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                mine={message.senderId === currentUserId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput onSend={sendMessage} sending={sending} error={error} />
    </div>
  );
}

function ChatHeader({
  conversation,
  onBack
}: {
  conversation: ConversationSummary;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const content = (
    <>
      <Image
        src={conversation.otherUser.avatarUrl}
        alt={conversation.otherUser.name}
        width={42}
        height={42}
        className="h-11 w-11 rounded-lg object-cover"
      />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-white">
          {conversation.otherUser.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-white/42">
          @{conversation.otherUser.handle}
        </span>
      </span>
    </>
  );

  return (
    <header className="flex min-h-20 items-center gap-3 border-b border-white/10 px-4 sm:px-5">
      <button
        type="button"
        onClick={onBack}
        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-white/62 md:hidden"
        aria-label={t("backToConversations")}
      >
        <ArrowLeft size={17} />
      </button>
      {conversation.otherUser.role === "creator" ? (
        <Link
          href={`/creators/${conversation.otherUser.handle}`}
          className="focus-ring flex min-w-0 items-center gap-3 rounded-md"
        >
          {content}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-3">{content}</div>
      )}
    </header>
  );
}

function RelatedListing({ conversation }: { conversation: ConversationSummary }) {
  const { t } = useI18n();
  const listing = conversation.listing;
  if (!listing) return null;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="focus-ring mx-4 mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-black/24 p-3 transition hover:border-jam-blue/30 sm:mx-5"
    >
      <Image
        src={listing.coverImageUrl}
        alt={listing.title}
        width={48}
        height={48}
        className="h-12 w-12 rounded-md object-cover"
      />
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-jam-blue">{t("relatedListing")}</span>
        <span className="mt-1 block truncate text-sm font-semibold text-white">{listing.title}</span>
      </span>
    </Link>
  );
}

export function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const { language } = useI18n();
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-3 sm:max-w-[72%]",
          mine ? "bg-jam-mint text-black" : "border border-white/8 bg-black/35 text-white"
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
        <p className={cn("mt-2 text-[11px]", mine ? "text-black/54" : "text-white/34")}>
          {new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
            hour: "2-digit",
            minute: "2-digit"
          }).format(new Date(message.createdAt))}
        </p>
      </div>
    </div>
  );
}

export function MessageInput({
  onSend,
  sending,
  error
}: {
  onSend: (body: string) => Promise<boolean>;
  sending: boolean;
  error: string;
}) {
  const { t } = useI18n();
  const [body, setBody] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send();
  }

  async function send() {
    if (!body.trim() || sending) return;
    const sent = await onSend(body);
    if (sent) setBody("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-white/10 bg-black/18 p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={4000}
          placeholder={t("typeMessage")}
          className="focus-ring min-h-11 max-h-32 flex-1 resize-y rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-sm leading-5 text-white placeholder:text-white/34"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-jam-mint text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t("sendMessage")}
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs leading-5 text-red-300">{error}</p> : null}
    </form>
  );
}

function EmptyConversation() {
  const { t } = useI18n();
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div className="max-w-sm">
        <MessageSquareText size={28} className="mx-auto text-jam-blue" />
        <p className="mt-4 text-sm leading-6 text-white/46">{t("noMessages")}</p>
      </div>
    </div>
  );
}
