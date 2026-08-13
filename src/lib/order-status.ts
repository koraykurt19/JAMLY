/**
 * Order state machine, mirrored from the `set_order_status` database function.
 *
 * The database is the authority — this module exists so the UI only offers
 * transitions that will actually be accepted. If the two ever disagree, the
 * database wins and the request is rejected.
 */

export const orderStatuses = ["requested", "in_review", "delivered", "cancelled"] as const;
export type OrderStatusCode = (typeof orderStatuses)[number];

export type OrderActorRole = "creator" | "buyer";

const creatorTransitions: Record<OrderStatusCode, OrderStatusCode[]> = {
  requested: ["in_review", "cancelled"],
  in_review: ["delivered", "cancelled"],
  delivered: [],
  cancelled: []
};

const buyerTransitions: Record<OrderStatusCode, OrderStatusCode[]> = {
  requested: ["cancelled"],
  in_review: ["cancelled"],
  delivered: [],
  cancelled: []
};

export function allowedOrderTransitions(
  current: OrderStatusCode,
  role: OrderActorRole
): OrderStatusCode[] {
  const table = role === "creator" ? creatorTransitions : buyerTransitions;
  return table[current] ?? [];
}

export function isTerminalOrderStatus(status: OrderStatusCode) {
  return status === "delivered" || status === "cancelled";
}

export const orderStatusLabels: Record<"tr" | "en", Record<OrderStatusCode, string>> = {
  tr: {
    requested: "Talep alındı",
    in_review: "İncelemeye al",
    delivered: "Teslim et",
    cancelled: "İptal et"
  },
  en: {
    requested: "Requested",
    in_review: "Start review",
    delivered: "Mark delivered",
    cancelled: "Cancel"
  }
};

export const paymentStates = [
  "unpaid",
  "processing",
  "requires_action",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
  "disputed",
  "chargeback"
] as const;
export type PaymentState = (typeof paymentStates)[number];

/** Entitlement to purchased files requires settled payment, nothing less. */
export function grantsDeliveryEntitlement(payment: PaymentState, status: OrderStatusCode) {
  return payment === "paid" && status !== "cancelled";
}

export const paymentStateLabels: Record<"tr" | "en", Record<PaymentState, string>> = {
  tr: {
    unpaid: "Ödeme bekleniyor",
    processing: "Ödeme işleniyor",
    requires_action: "Ek doğrulama gerekli",
    paid: "Ödendi",
    failed: "Ödeme başarısız",
    refunded: "İade edildi",
    partially_refunded: "Kısmi iade",
    disputed: "İtiraz açıldı",
    chargeback: "Ters ibraz"
  },
  en: {
    unpaid: "Awaiting payment",
    processing: "Payment processing",
    requires_action: "Action required",
    paid: "Paid",
    failed: "Payment failed",
    refunded: "Refunded",
    partially_refunded: "Partially refunded",
    disputed: "Disputed",
    chargeback: "Chargeback"
  }
};
