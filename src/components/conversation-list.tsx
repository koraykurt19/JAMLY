"use client";

import Image from "next/image";
import { MessageCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/format";
import type { ConversationSummary } from "@/lib/messaging-types";

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect
}: {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelect: (conversation: ConversationSummary) => void;
}) {
  const { language, t } = useI18n();
  const [query, setQuery] = useState("");
  const filteredConversations = useMemo(() => {
    const search = query.trim().toLocaleLowerCase(language === "tr" ? "tr-TR" : "en-US");
    if (!search) return conversations;
    return conversations.filter((conversation) =>
      [
        conversation.otherUser.name,
        conversation.otherUser.handle,
        conversation.lastMessage,
        conversation.listing?.title
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(language === "tr" ? "tr-TR" : "en-US")
        .includes(search)
    );
  }, [conversations, language, query]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-black/18">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{t("conversations")}</h2>
          <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-bold text-white/52">
            {conversations.length}
          </span>
        </div>
        <label className="relative mt-4 block">
          <span className="sr-only">{t("searchConversations")}</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/36"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchConversations")}
            className="focus-ring h-10 w-full rounded-md border border-white/10 bg-black/30 pl-9 pr-3 text-sm text-white placeholder:text-white/34"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filteredConversations.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MessageCircle size={24} className="mx-auto text-jam-blue" />
            <p className="mt-4 font-semibold text-white">{t("noConversations")}</p>
            <p className="mt-2 text-sm leading-6 text-white/44">{t("noConversationsCopy")}</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeConversationId}
              onClick={() => onSelect(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function ConversationItem({
  conversation,
  active,
  onClick
}: {
  conversation: ConversationSummary;
  active: boolean;
  onClick: () => void;
}) {
  const { language, t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring mb-1 flex w-full gap-3 rounded-lg border p-3 text-left transition",
        active
          ? "border-jam-blue/35 bg-jam-blue/10"
          : "border-transparent hover:border-white/8 hover:bg-white/[0.045]"
      )}
    >
      <div className="relative shrink-0">
        <Image
          src={conversation.otherUser.avatarUrl}
          alt={conversation.otherUser.name}
          width={46}
          height={46}
          className="h-12 w-12 rounded-lg object-cover"
        />
        {conversation.unreadCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-jam-mint px-1 text-[10px] font-bold text-black"
            aria-label={`${conversation.unreadCount} ${t("unreadMessages")}`}
          >
            {conversation.unreadCount}
          </span>
        ) : null}
      </div>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-semibold text-white">
            {conversation.otherUser.name}
          </span>
          <span className="shrink-0 text-[11px] text-white/34">
            {formatConversationTime(conversation.lastMessageAt, language)}
          </span>
        </span>
        <span
          className={cn(
            "mt-1 block truncate text-xs",
            conversation.unreadCount > 0 ? "font-semibold text-white/72" : "text-white/42"
          )}
        >
          {conversation.lastMessage ?? "—"}
        </span>
        {conversation.listing ? (
          <span className="mt-2 block truncate text-[11px] font-semibold text-jam-blue">
            {conversation.listing.title}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function formatConversationTime(value: string, language: "tr" | "en") {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
    ...(sameDay ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric" })
  }).format(date);
}
