"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Jamly runtime error", error);
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
              Yeni sürüm yüklenirken tarayıcı eski bir dosyada kalmış olabilir. Tekrar deneyin;
              sorun devam ederse sayfayı yenileyin.
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
                onClick={() => window.location.reload()}
                className="min-h-12 rounded-md border border-white/12 px-5 font-bold text-white"
              >
                Sayfayı yenile
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
