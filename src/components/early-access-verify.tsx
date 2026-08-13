"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, BadgeCheck, Loader2 } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Card } from "@/components/ui/surface";
import { getEarlyAccessCopy } from "@/lib/early-access-copy";

type VerifyState =
  | { status: "verifying" }
  | { status: "verified"; queuePosition: number; referralCode: string }
  | { status: "error"; message: string };

export function EarlyAccessVerify({ token }: { token: string }) {
  const { language } = useI18n();
  const copy = getEarlyAccessCopy(language);
  const [state, setState] = useState<VerifyState>({ status: "verifying" });
  // Verification is a one-shot side effect; React 18+ dev double-invoke and any
  // re-render must not fire a second request against a single-use token.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState({
        status: "error",
        message:
          language === "tr"
            ? "Doğrulama bağlantısı eksik görünüyor."
            : "This verification link is incomplete."
      });
      return;
    }

    let active = true;
    fetch("/api/waitlist/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) {
          setState({
            status: "error",
            message:
              language === "tr"
                ? "Bu doğrulama bağlantısı geçersiz veya süresi dolmuş."
                : "This verification link is invalid or has expired."
          });
          return;
        }
        setState({
          status: "verified",
          queuePosition: Number(body.queuePosition ?? 0),
          referralCode: String(body.referralCode ?? "")
        });
      })
      .catch(() => {
        if (active) {
          setState({
            status: "error",
            message:
              language === "tr"
                ? "Bağlantı kurulamadı. Lütfen tekrar dene."
                : "We could not reach the server. Please try again."
          });
        }
      });

    return () => {
      active = false;
    };
  }, [token, language]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center px-4 py-16">
      <Card className="w-full text-center" padded={false}>
        <div className="flex flex-col items-center gap-4 p-8">
          {state.status === "verifying" ? (
            <>
              <Loader2 aria-hidden className="animate-spin text-jam-mint" size={28} />
              <p className="text-sm text-white/64">
                {language === "tr" ? "Doğrulanıyor..." : "Verifying..."}
              </p>
            </>
          ) : null}

          {state.status === "verified" ? (
            <>
              <span className="flex size-12 items-center justify-center rounded-full bg-jam-success/14 text-jam-success">
                <BadgeCheck size={26} />
              </span>
              <h1 className="text-xl font-semibold text-white">
                {language === "tr" ? "E-postan doğrulandı" : "Your email is verified"}
              </h1>
              <p className="text-sm leading-6 text-white/64">
                {language === "tr"
                  ? "Sıradaki yerin kesinleşti. Açılışta kurucu üye rozetin hesabına eklenecek."
                  : "Your place is confirmed. Your founding member badge lands on your account at launch."}
              </p>
              {state.queuePosition > 0 ? (
                <p className="text-3xl font-bold tabular-nums text-jam-mint">
                  #{state.queuePosition.toLocaleString(language === "tr" ? "tr-TR" : "en-US")}
                </p>
              ) : null}
              <Link
                href="/early-access"
                className="focus-ring mt-2 inline-flex min-h-control items-center rounded-md border border-white/12 px-5 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
              >
                {copy.referralTitle}
              </Link>
            </>
          ) : null}

          {state.status === "error" ? (
            <>
              <span className="flex size-12 items-center justify-center rounded-full bg-jam-danger/14 text-jam-danger">
                <AlertCircle size={26} />
              </span>
              <h1 className="text-xl font-semibold text-white">
                {language === "tr" ? "Doğrulanamadı" : "Verification failed"}
              </h1>
              <p className="text-sm leading-6 text-white/64">{state.message}</p>
              <Link
                href="/early-access"
                className="focus-ring mt-2 inline-flex min-h-control items-center rounded-md bg-jam-blue px-5 text-sm font-bold text-white transition hover:bg-jam-blue/88"
              >
                {language === "tr" ? "Erken kayda dön" : "Back to early access"}
              </Link>
            </>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
