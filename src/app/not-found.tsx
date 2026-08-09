"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/components/language-provider";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex min-h-[62vh] w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-jam-mint">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-white/64">
        {t("notFoundCopy")}
      </p>
      <Link
        href="/marketplace"
        className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-jam-mint"
      >
        <ArrowLeft size={17} />
        {t("backMarketplace")}
      </Link>
    </section>
  );
}
