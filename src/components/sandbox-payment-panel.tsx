"use client";

import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";
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
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/34");
  const [cvc, setCvc] = useState("123");
  const [cardName, setCardName] = useState("JAMLY SANDBOX");

  async function completeSandboxPayment() {
    if (state === "loading" || state === "paid") return;
    if (!isValidSandboxCard(cardNumber, expiry, cvc, cardName)) {
      setState("error");
      setMessage(
        language === "tr"
          ? "Test kart bilgisini tamamlayın. Gerçek kart kullanmayın."
          : "Complete the test card fields. Do not use a real card."
      );
      return;
    }

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
    <div className="mt-5 overflow-hidden rounded-lg border border-jam-blue/30 bg-[#08111c]">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(88,197,255,0.24),transparent_18rem),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-jam-blue/15 text-jam-blue">
            <CreditCard size={19} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              {language === "tr" ? "Jamly Sandbox Ödeme" : "Jamly Sandbox Payment"}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/52">
              {language === "tr"
                ? "Stripe bağlanana kadar lisans akışını uçtan uca test eder. Karttan çekim yapmaz."
                : "Runs the license flow end to end until Stripe is connected. No card is charged."}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/12 bg-[linear-gradient(135deg,#162434,#0a1018_70%)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-jam-mint/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-jam-mint">
              <BadgeCheck size={13} />
              Sandbox
            </span>
            <LockKeyhole size={16} className="text-white/40" />
          </div>
          <div className="mt-7 font-mono text-[clamp(1rem,2.8vw,1.25rem)] font-semibold text-white">
            {formatCardPreview(cardNumber)}
          </div>
          <div className="mt-6 flex items-end justify-between gap-4 text-xs">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/32">
                {language === "tr" ? "Kart sahibi" : "Card holder"}
              </p>
              <p className="mt-1 font-semibold uppercase text-white/78">{cardName || "JAMLY SANDBOX"}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/32">
                {language === "tr" ? "Tarih" : "Expiry"}
              </p>
              <p className="mt-1 font-semibold text-white/78">{expiry || "12/34"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem_5.5rem] lg:grid-cols-1">
          <SandboxInput
            label={language === "tr" ? "Test kartı" : "Test card"}
            value={cardNumber}
            inputMode="numeric"
            maxLength={19}
            onChange={(value) => setCardNumber(formatCardInput(value))}
          />
          <SandboxInput
            label={language === "tr" ? "Tarih" : "Expiry"}
            value={expiry}
            inputMode="numeric"
            maxLength={5}
            onChange={(value) => setExpiry(formatExpiryInput(value))}
          />
          <SandboxInput
            label="CVC"
            value={cvc}
            inputMode="numeric"
            maxLength={4}
            onChange={(value) => setCvc(value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>
        <SandboxInput
          label={language === "tr" ? "Kart üzerindeki isim" : "Name on card"}
          value={cardName}
          className="mt-3"
          onChange={(value) => setCardName(value.toUpperCase().slice(0, 32))}
        />

        <div className="mt-3 flex items-center gap-2 text-[11px] leading-5 text-white/44">
          <ShieldCheck size={14} className="shrink-0 text-jam-blue" />
          {language === "tr"
            ? "Bu ekranda kişisel kart bilgisi girilmemeli; ödeme kaydı yalnızca sandbox olarak işaretlenir."
            : "Do not enter personal card details here; the order is only marked as paid in sandbox mode."}
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
    </div>
  );
}

function SandboxInput({
  label,
  value,
  className = "",
  inputMode,
  maxLength,
  onChange
}: {
  label: string;
  value: string;
  className?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/36">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-1 h-11 w-full rounded-md border border-white/10 bg-black/28 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/24 hover:border-white/18"
      />
    </label>
  );
}

function formatCardInput(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatExpiryInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCardPreview(value: string) {
  const digits = value.replace(/\D/g, "").padEnd(16, "•");
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
}

function isValidSandboxCard(cardNumber: string, expiry: string, cvc: string, cardName: string) {
  return (
    cardNumber.replace(/\D/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvc.replace(/\D/g, "").length >= 3 &&
    cardName.trim().length >= 2
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
