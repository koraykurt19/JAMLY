"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { updateOrderStatus } from "@/lib/supabase-data";
import type { OrderSummary } from "@/lib/supabase-data";
import { allowedOrderTransitions, orderStatusLabels, type OrderStatusCode } from "@/lib/order-status";

/**
 * Only offers transitions the server will actually accept. The database is the
 * authority (`set_order_status`); this list keeps the UI honest rather than
 * presenting every status and failing on submit.
 */
export function OrderStatusControl({
  order,
  isCreator,
  isBuyer = false,
  paymentSettled = true,
  onChanged
}: {
  order: OrderSummary;
  isCreator: boolean;
  isBuyer?: boolean;
  paymentSettled?: boolean;
  onChanged: (status: OrderStatusCode) => void;
}) {
  const { language } = useI18n();
  const [pending, setPending] = useState<OrderStatusCode | null>(null);
  const [message, setMessage] = useState("");

  const role = isCreator ? "creator" : isBuyer ? "buyer" : null;
  if (!role) return null;

  const transitions = allowedOrderTransitions(order.statusCode as OrderStatusCode, role).filter(
    (next) => next !== "delivered" || paymentSettled
  );

  if (transitions.length === 0) return null;

  async function changeStatus(nextStatus: OrderStatusCode) {
    if (pending) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setPending(nextStatus);
    setMessage("");
    try {
      await updateOrderStatus(client, order.id, nextStatus, order.statusCode as OrderStatusCode);
      onChanged(nextStatus);
    } catch (error) {
      setMessage(orderStatusError(error, language));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 size={17} className="text-jam-mint" />
        {language === "tr" ? "Sipariş akışı" : "Order workflow"}
      </div>

      {!paymentSettled && isCreator ? (
        <p className="mt-2 text-[13px] leading-6 text-jam-warning">
          {language === "tr"
            ? "Ödeme tamamlanana kadar teslim edilemez."
            : "Cannot be delivered until payment settles."}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {transitions.map((next) => (
          <Button
            key={next}
            size="sm"
            variant={next === "cancelled" ? "danger" : "secondary"}
            loading={pending === next}
            disabled={pending !== null && pending !== next}
            onClick={() => void changeStatus(next)}
          >
            {orderStatusLabels[language][next]}
          </Button>
        ))}
      </div>

      {message ? (
        <p role="alert" className="mt-3 text-[13px] leading-5 text-jam-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Maps known database error states onto localized copy. Raw PostgREST messages
 * leak policy and constraint names, so they never reach the user.
 */
function orderStatusError(error: unknown, language: "tr" | "en") {
  const raw = error instanceof Error ? error.message.toLowerCase() : "";

  if (raw.includes("changed while you were working")) {
    return language === "tr"
      ? "Bu sipariş sen bakarken güncellendi. Sayfayı yenile."
      : "This order changed while you were working. Refresh the page.";
  }
  if (raw.includes("before payment settles")) {
    return language === "tr"
      ? "Ödeme tamamlanmadan sipariş teslim edilemez."
      : "An order cannot be delivered before payment settles.";
  }
  if (raw.includes("already closed")) {
    return language === "tr" ? "Bu sipariş kapanmış." : "This order is already closed.";
  }
  if (raw.includes("not allowed") || raw.includes("cannot update")) {
    return language === "tr"
      ? "Bu geçişi yapma yetkin yok."
      : "You are not allowed to make this transition.";
  }
  return language === "tr"
    ? "Sipariş durumu güncellenemedi."
    : "Order status could not be updated.";
}
