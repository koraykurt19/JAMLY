"use client";

import { Check, Download, Loader2, PackageCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/language-provider";
import {
  getBeatDeliveryPath,
  getBeatLicenseCopy,
  licenseLegalNotice
} from "@/lib/beat-licenses";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createLicenseDownloadUrl, type OrderSummary } from "@/lib/supabase-data";
import type { BeatLicenseTier, Listing } from "@/lib/types";

export function LicenseDeliveryPanel({
  order,
  listing
}: {
  order: OrderSummary;
  listing: Listing;
}) {
  const { language, t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (order.licenseTier === "service") {
    return null;
  }

  const tier = order.licenseTier satisfies BeatLicenseTier;
  const copy = getBeatLicenseCopy(tier, language);
  const deliveryPath = getBeatDeliveryPath(listing, tier);

  async function downloadPackage() {
    const client = getSupabaseBrowserClient();
    if (!client || !deliveryPath) {
      setError(t("deliveryUnavailable"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const signedUrl = await createLicenseDownloadUrl(client, listing, tier);
      const anchor = document.createElement("a");
      anchor.href = signedUrl;
      anchor.download = "";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (downloadError) {
      setError(
        `${t("downloadError")}: ${
          downloadError instanceof Error ? downloadError.message : t("unknownError")
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-jam-blue/25 bg-jam-blue/10 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-jam-blue/15 text-jam-blue">
          <PackageCheck size={20} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jam-blue">
            {t("licensePurchased")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{copy.name}</h2>
          <p className="mt-1 text-sm text-white/52">{copy.qualifier}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {copy.files.map((file) => (
          <span key={file} className="flex items-center gap-2 text-sm text-white/64">
            <Check size={14} className="text-jam-mint" />
            {file}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
        <ShieldCheck size={14} />
        {t("licenseVersion")}: {order.licenseTermsVersion ?? "-"}
      </div>

      {deliveryPath ? (
        <button
          type="button"
          onClick={downloadPackage}
          disabled={loading}
          className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-jam-mint px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
          {loading ? t("preparingDownload") : t("downloadPackage")}
        </button>
      ) : (
        <p className="mt-5 rounded-md border border-jam-gold/20 bg-jam-gold/10 p-3 text-sm text-jam-gold">
          {t("deliveryUnavailable")}
        </p>
      )}

      {error ? <p className="mt-3 text-sm leading-6 text-red-300">{error}</p> : null}
      <p className="mt-4 text-xs leading-5 text-white/38">{licenseLegalNotice[language]}</p>
    </div>
  );
}
