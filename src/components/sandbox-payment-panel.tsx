"use client";

import Link from "next/link";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/language-provider";
import { createMailto, JAMLY_EMAILS } from "@/lib/jamly-contacts";

type SandboxState = "idle" | "loading" | "paid" | "error";

export function SandboxPaymentPanel({
  orderId,
  onPaid
}: {
  orderId: string;
  onPaid: () => void;
}) {
  const { language } = useI18n();
  const [state, setState] = useState<SandboxState>("idle");
  const [message, setMessage] = useState("");

  async function completeSandboxPayment() {
    if (state === "loading" || state === "paid") return;
    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/payments/sandbox/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(sandboxError(payload.error, language));

      setState("paid");
      setMessage(
        language === "tr"
          ? "Test ödemesi onaylandı. Gerçek para hareketi olmadı."
          : "Test payment approved. No real money moved."
      );
      onPaid();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : language === "tr"
            ? "Test ödemesi tamamlanamadı."
            : "The test payment could not be completed."
      );
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-jam-blue/30 bg-jam-blue/[0.08] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-jam-blue/15 text-jam-blue">
          <CreditCard size={19} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">
            {language === "tr" ? "Jamly Sandbox Ödeme" : "Jamly Sandbox Payment"}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/48">
            {language === "tr"
              ? "Bu panel yalnızca test içindir; karttan çekim yapmaz ve finansal işlem oluşturmaz."
              : "This panel is for testing only; it never charges a card or moves money."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_92px_72px] lg:grid-cols-1">
        <TestField label={language === "tr" ? "Test kartı" : "Test card"} value="4242 4242 4242 4242" />
        <TestField label={language === "tr" ? "Tarih" : "Expiry"} value="12/34" />
        <TestField label="CVC" value="123" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] leading-5 text-white/40">
        <ShieldCheck size={14} className="shrink-0 text-jam-blue" />
        {language === "tr"
          ? "Bilgiler örnektir; kişisel kart bilgisi girmeyin."
          : "These are sample values; do not enter personal card details."}
      </div>

      <button
        type="button"
        onClick={() => void completeSandboxPayment()}
        disabled={state === "loading" || state === "paid"}
        className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-jam-mint px-5 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "loading" ? <Loader2 size={17} className="animate-spin" /> : null}
        {state === "paid" ? <CheckCircle2 size={17} /> : null}
        {state === "loading"
          ? language === "tr"
            ? "Test ödemesi işleniyor..."
            : "Processing test payment..."
          : state === "paid"
            ? language === "tr"
              ? "Test ödemesi tamamlandı"
              : "Test payment complete"
            : language === "tr"
              ? "Test ödemesini tamamla"
              : "Complete test payment"}
      </button>

      {message ? (
        <p
          role={state === "error" ? "alert" : "status"}
          className={`mt-3 text-xs leading-5 ${state === "error" ? "text-red-300" : "text-jam-mint"}`}
        >
          {message}
        </p>
      ) : null}

      <Link
        href={createMailto(JAMLY_EMAILS.payment, {
          subject: `Jamly sandbox payment / ${orderId}`
        })}
        className="focus-ring mt-3 inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-white/50 transition hover:text-white"
      >
        {language === "tr" ? "Ödeme desteği" : "Payment support"}
        <ExternalLink size={13} />
      </Link>
    </div>
  );
}

function TestField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-white/32">{label}</p>
      <p className="mt-1 text-xs font-semibold text-white/78">{value}</p>
    </div>
  );
}

function sandboxError(code: string | undefined, language: "tr" | "en") {
  const tr = language === "tr";
  switch (code) {
    case "sandbox_disabled":
      return tr ? "Sandbox ödeme bu ortamda kapalı." : "Sandbox payments are disabled here.";
    case "server_payment_not_configured":
      return tr
        ? "Sunucu ödeme anahtarı henüz yapılandırılmamış."
        : "The server payment key is not configured yet.";
    case "authentication_required":
      return tr ? "Oturum süreniz dolmuş. Yeniden giriş yapın." : "Your session expired. Sign in again.";
    case "order_cancelled":
      return tr ? "İptal edilen sipariş ödenemez." : "A cancelled order cannot be paid.";
    default:
      return tr ? "Test ödemesi tamamlanamadı." : "The test payment could not be completed.";
  }
}
