"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { updateOrderStatus } from "@/lib/supabase-data";
import type { OrderSummary } from "@/lib/supabase-data";

const statusOptions = ["requested", "in_review", "delivered", "cancelled"] as const;

export function OrderStatusControl({
  order,
  isCreator,
  onChanged
}: {
  order: OrderSummary;
  isCreator: boolean;
  onChanged: (status: OrderSummary["statusCode"]) => void;
}) {
  const { language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isCreator) return null;

  async function changeStatus(nextStatus: OrderSummary["statusCode"]) {
    if (loading || nextStatus === order.statusCode) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setLoading(true);
    setMessage("");
    try {
      await updateOrderStatus(client, order.id, nextStatus);
      onChanged(nextStatus);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : language === "tr"
            ? "Sipariş durumu güncellenemedi."
            : "Order status could not be updated."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 size={17} className="text-jam-mint" />
        {language === "tr" ? "Sipariş akışı" : "Order workflow"}
      </div>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {language === "tr" ? "Durumu güncelle" : "Update status"}
        <select
          value={order.statusCode}
          onChange={(event) => void changeStatus(event.target.value as OrderSummary["statusCode"])}
          disabled={loading}
          className="input-field mt-2 h-11 bg-black/25 text-sm font-semibold disabled:opacity-50"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status, language)}
            </option>
          ))}
        </select>
      </label>
      {loading ? <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/50"><Loader2 size={14} className="animate-spin" /> {language === "tr" ? "Kaydediliyor" : "Saving"}</p> : null}
      {message ? <p className="mt-3 text-xs leading-5 text-red-300">{message}</p> : null}
    </div>
  );
}

function statusLabel(status: (typeof statusOptions)[number], language: "tr" | "en") {
  const labels = language === "tr"
    ? { requested: "Talep alındı", in_review: "İnceleniyor", delivered: "Teslim edildi", cancelled: "İptal edildi" }
    : { requested: "Requested", in_review: "In review", delivered: "Delivered", cancelled: "Cancelled" };
  return labels[status];
}
