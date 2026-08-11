"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function CollabError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 text-center">
      <div className="w-full border border-red-400/20 bg-red-400/[0.045] p-8">
        <AlertTriangle className="mx-auto text-red-300" />
        <h1 className="mt-4 text-2xl font-semibold text-white">Çalışma alanı yüklenemedi</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">Bağlantıyı kontrol edip yeniden deneyin.</p>
        <button
          type="button"
          onClick={reset}
          className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-black"
        >
          <RotateCcw size={16} /> Yeniden dene
        </button>
      </div>
    </section>
  );
}
