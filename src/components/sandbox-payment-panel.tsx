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
import {
  detectSandboxCardBrand,
  formatSandboxCardInput,
  formatSandboxCardPreview,
  formatSandboxExpiryInput,
  validateSandboxPaymentMethod
} from "@/lib/sandbox-card";

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

    const paymentMethod = {
      type: "card",
      card: {
        number: cardNumber,
        expiry,
        cvc,
        name: cardName
      }
    };
    const validation = validateSandboxPaymentMethod(paymentMethod);
    if (!validation.ok) {
      setState("error");
      setMessage(sandboxCardError(validation.error, language));
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/payments/sandbox/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentMethod })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(sandboxError(payload.error, language));
      }

      setState("paid");
      setMessage(
        language === "tr"
          ? "Test odemesi onaylandi. Gercek para hareketi olmadi."
          : "Test payment approved. No real money moved."
      );
      onPaid();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : language === "tr"
            ? "Test odemesi tamamlanamadi."
            : "The test payment could not be completed."
      );
    }
  }

  const brand = detectSandboxCardBrand(cardNumber);
  const last4 = cardNumber.replace(/\D/g, "").slice(-4) || "4242";

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-jam-blue/30 bg-[#08111c]">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(88,197,255,0.24),transparent_18rem),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-jam-blue/15 text-jam-blue">
            <CreditCard size={19} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              {language === "tr" ? "Jamly Sandbox Odeme" : "Jamly Sandbox Payment"}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/52">
              {language === "tr"
                ? "Stripe baglanana kadar lisans akisini uctan uca test eder. Karttan cekim yapmaz."
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
            {formatSandboxCardPreview(cardNumber)}
          </div>
          <div className="mt-6 flex items-end justify-between gap-4 text-xs">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/32">
                {language === "tr" ? "Kart sahibi" : "Card holder"}
              </p>
              <p className="mt-1 font-semibold uppercase text-white/78">
                {cardName || "JAMLY SANDBOX"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/32">
                {language === "tr" ? "Tarih" : "Expiry"}
              </p>
              <p className="mt-1 font-semibold text-white/78">{expiry || "12/34"}</p>
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/34">
            {brand} / **** {last4}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem_5.5rem] lg:grid-cols-1">
          <SandboxInput
            label={language === "tr" ? "Test karti" : "Test card"}
            value={cardNumber}
            inputMode="numeric"
            maxLength={19}
            onChange={(value) => setCardNumber(formatSandboxCardInput(value))}
          />
          <SandboxInput
            label={language === "tr" ? "Tarih" : "Expiry"}
            value={expiry}
            inputMode="numeric"
            maxLength={5}
            onChange={(value) => setExpiry(formatSandboxExpiryInput(value))}
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
          label={language === "tr" ? "Kart uzerindeki isim" : "Name on card"}
          value={cardName}
          className="mt-3"
          onChange={(value) => setCardName(value.toUpperCase().slice(0, 32))}
        />

        <div className="mt-3 flex items-center gap-2 text-[11px] leading-5 text-white/44">
          <ShieldCheck size={14} className="shrink-0 text-jam-blue" />
          {language === "tr"
            ? "Bu ekranda kisisel kart bilgisi girilmemeli; odeme kaydi yalnizca sandbox olarak isaretlenir."
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
              ? "Test odemesi isleniyor..."
              : "Processing test payment..."
            : state === "paid"
              ? language === "tr"
                ? "Test odemesi tamamlandi"
                : "Test payment complete"
              : language === "tr"
                ? "Test odemesini tamamla"
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
          {language === "tr" ? "Odeme destegi" : "Payment support"}
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
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/36">
        {label}
      </span>
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

function sandboxCardError(error: string, language: "tr" | "en") {
  const messages = {
    tr: {
      missing_payment_method: "Test kart bilgisini tamamlayin.",
      unsupported_payment_method: "Sadece sandbox kart odemesi destekleniyor.",
      unsupported_test_card: "Sadece Jamly test kartlari kabul edilir. Gercek kart kullanmayin.",
      invalid_card_number: "Test kart numarasi gecersiz.",
      invalid_expiry: "Son kullanma tarihi AA/YY formatinda olmali.",
      expired_card: "Test kartinin tarihi gecmis gorunuyor.",
      invalid_cvc: "CVC 3 veya 4 haneli olmali.",
      invalid_cardholder: "Kart uzerindeki isim en az 2 karakter olmali.",
      declined_card: "Bu test karti reddedilme senaryosu icin ayrildi."
    },
    en: {
      missing_payment_method: "Complete the test card fields.",
      unsupported_payment_method: "Only sandbox card payment is supported.",
      unsupported_test_card: "Only Jamly test cards are accepted. Do not use a real card.",
      invalid_card_number: "The test card number is invalid.",
      invalid_expiry: "Expiry must use MM/YY format.",
      expired_card: "The test card expiry is in the past.",
      invalid_cvc: "CVC must be 3 or 4 digits.",
      invalid_cardholder: "Name on card must be at least 2 characters.",
      declined_card: "This test card is reserved for declined-card scenarios."
    }
  };
  const localized = messages[language] as Record<string, string>;
  return localized[error] ?? localized.missing_payment_method;
}

function sandboxError(code: string | undefined, language: "tr" | "en") {
  const cardMessage = code ? sandboxCardError(code, language) : null;
  if (cardMessage && cardMessage !== sandboxCardError("missing_payment_method", language)) {
    return cardMessage;
  }

  const tr = language === "tr";
  switch (code) {
    case "sandbox_disabled":
      return tr ? "Sandbox odeme bu ortamda kapali." : "Sandbox payments are disabled here.";
    case "server_payment_not_configured":
      return tr
        ? "Sunucu odeme anahtari henuz yapilandirilmamis."
        : "The server payment key is not configured yet.";
    case "authentication_required":
      return tr
        ? "Oturum sureniz dolmus. Yeniden giris yapin."
        : "Your session expired. Sign in again.";
    case "order_cancelled":
      return tr ? "Iptal edilen siparis odenemez." : "A cancelled order cannot be paid.";
    default:
      return tr ? "Test odemesi tamamlanamadi." : "The test payment could not be completed.";
  }
}
