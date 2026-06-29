"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, MessageSquareText, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { currency, shortDate } from "@/lib/format";
import { orderStatusLabel } from "@/lib/labels";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchOrderDetail,
  getCurrentProfile,
  sendOrderMessage,
  type OrderDetail,
  type OrderMessage
} from "@/lib/supabase-data";

type OrderPageProps = { params: { id: string } };
type OrderPageState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "not-found" }
  | { status: "demo" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: OrderDetail };

export default function OrderPage({ params }: OrderPageProps) {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const [state, setState] = useState<OrderPageState>(() =>
    isSupabaseConfigured() ? { status: "loading" } : { status: "demo" }
  );

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    async function load() {
      try {
        const { user } = await getCurrentProfile(client);
        if (!active) return;
        if (!user) {
          setState({ status: "signed-out" });
          return;
        }

        const detail = await fetchOrderDetail(client, params.id, user.id);
        if (!active) return;
        setState(detail ? { status: "ready", detail } : { status: "not-found" });
      } catch (error) {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : t("unknownError")
          });
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [params.id, t]);

  if (state.status !== "ready") {
    const loading = state.status === "loading";
    const signedOut = state.status === "signed-out";
    const title = loading
      ? t("dashboardLoading")
      : signedOut
        ? t("dashboardSignInTitle")
        : state.status === "error"
          ? t("dashboardErrorTitle")
          : t("orderNotAvailable");
    const description = signedOut
      ? t("orderSignInCopy")
      : state.status === "error"
        ? state.message
        : state.status === "demo"
          ? t("demoOrderOnly")
          : undefined;

    return (
      <section className="mx-auto flex min-h-[68vh] max-w-2xl items-center justify-center px-4 text-center">
        <div>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">
            {loading ? <Loader2 className="animate-spin" /> : <AlertCircle />}
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>
          {description ? <p className="mt-3 text-sm leading-6 text-white/52">{description}</p> : null}
          {signedOut ? (
            <Link href="/auth/sign-in" className="focus-ring mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-jam-mint">
              {t("navSignIn")}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  const { detail } = state;
  const role = detail.currentUserId === detail.order.creatorId ? "creator" : "buyer";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={`/dashboard/${role}`} className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/68 hover:bg-white/8 hover:text-white">
        <ArrowLeft size={16} /> {t("backToDashboard")}
      </Link>

      <div className="mt-8 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-jam-mint">{t("orderDetailEyebrow")}</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{detail.order.listingTitle}</h1>
          <p className="mt-2 text-sm text-white/48">{shortDate(detail.order.createdAt, language)}</p>
        </div>
        <span className="self-start rounded-full bg-jam-blue/15 px-4 py-2 text-sm font-semibold text-jam-blue">
          {orderStatusLabel(detail.order.status, language)}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="space-y-5">
          {detail.listing ? (
            <Link href={`/listing/${detail.listing.id}`} className="grid grid-cols-[88px_1fr] gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 transition hover:border-white/20">
              <Image src={detail.listing.coverImageUrl} alt={detail.listing.title} width={88} height={88} className="h-[88px] w-[88px] rounded-md object-cover" />
              <div className="min-w-0">
                <p className="font-semibold text-white">{detail.listing.title}</p>
                <p className="mt-1 text-sm text-white/48">{detail.listing.genre}</p>
                <p className="mt-3 text-sm font-semibold text-jam-mint">
                  {currency(detail.order.price, language, currencyCode, usdTryRate)}
                </p>
              </div>
            </Link>
          ) : null}

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/42">{t("orderBrief")}</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/66">
              {detail.order.brief || t("noBriefProvided")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Meta label={t("participantBuyer")} value={detail.order.buyerName} />
            <Meta label={t("participantCreator")} value={detail.order.creatorName} />
            <Meta label={t("projectValue")} value={currency(detail.order.price, language, currencyCode, usdTryRate)} />
          </div>
        </aside>

        <Conversation initialDetail={detail} />
      </div>
    </section>
  );
}

function Conversation({ initialDetail }: { initialDetail: OrderDetail }) {
  const { language, t } = useI18n();
  const [messages, setMessages] = useState<OrderMessage[]>(initialDetail.messages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || !body.trim()) return;

    setSending(true);
    setError("");
    try {
      const message = await sendOrderMessage(
        client,
        initialDetail.order,
        initialDetail.currentUserId,
        body
      );
      setMessages((current) => [...current, message]);
      setBody("");
    } catch (sendError) {
      setError(`${t("messageError")}: ${sendError instanceof Error ? sendError.message : t("unknownError")}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[560px] flex-col rounded-lg border border-white/10 bg-white/[0.045]">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-2">
          <MessageSquareText size={20} className="text-jam-blue" />
          <h2 className="text-xl font-semibold text-white">{t("orderConversation")}</h2>
        </div>
        <p className="mt-2 text-sm text-white/48">{t("orderConversationCopy")}</p>
      </div>

      <div className="flex-1 space-y-3 p-5">
        {messages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/14 p-6 text-center text-sm leading-6 text-white/46">{t("noMessages")}</p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === initialDetail.currentUserId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-lg px-4 py-3 ${mine ? "bg-jam-blue text-black" : "bg-black/35 text-white"}`}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  <p className={`mt-2 text-[11px] ${mine ? "text-black/55" : "text-white/36"}`}>
                    {new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="border-t border-white/10 p-4">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={3} placeholder={t("messagePlaceholder")} className="input-field min-h-24 resize-y py-3" />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-red-300">{error}</p>
          <button type="submit" disabled={sending || !body.trim()} className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
            {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {t("sendMessage")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/24 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}
