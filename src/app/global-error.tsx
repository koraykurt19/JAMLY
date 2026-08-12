"use client";

import { useEffect } from "react";

const recoveryKey = "jamly:global-error-recovery";
const recoveryWindowMs = 15_000;

function reloadWithoutCache() {
  const now = Date.now();

  try {
    window.sessionStorage.setItem(recoveryKey, String(now));
    const url = new URL(window.location.href);
    url.searchParams.set("_jamly_recovery", String(now));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Jamly runtime error", error);

    if (!isAssetLoadError(error)) return;
    try {
      const previous = Number(window.sessionStorage.getItem(recoveryKey) ?? "0");
      if (Date.now() - previous >= recoveryWindowMs) reloadWithoutCache();
    } catch {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="tr">
      <body className="m-0 bg-[#080a0f] font-sans text-white">
        <main className="flex min-h-screen items-center justify-center px-5 py-12">
          <section className="w-full max-w-xl border border-white/10 bg-[#0d1118] p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#76b4ff]">
              Jamly
            </p>
            <h1 className="mt-4 text-3xl font-bold">Sayfa yeniden hazırlanmalı.</h1>
            <p className="mt-4 leading-7 text-white/55">
              Tarayıcı yeni sürümün dosyalarını tamamlayamadı. Önce tekrar deneyin; sorun devam
              ederse temiz yenileme ile güncel sürümü açın.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="min-h-12 rounded-md bg-[#76b4ff] px-5 font-bold text-[#071018]"
              >
                Tekrar dene
              </button>
              <button
                type="button"
                onClick={reloadWithoutCache}
                className="min-h-12 rounded-md border border-white/12 px-5 font-bold text-white"
              >
                Temiz yenile
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}

function isAssetLoadError(error: Error) {
  const message = `${error.name} ${error.message}`.toLowerCase();
  return (
    message.includes("chunkloaderror") ||
    message.includes("loading chunk") ||
    message.includes("load failed") ||
    message.includes("dynamically imported module") ||
    message.includes("module script")
  );
}
