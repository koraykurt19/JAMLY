import { getSupabaseServerClient } from "@/lib/supabase-server";
import { toMinorUnits, type Currency } from "@/lib/money";
import { processPaymentEvent } from "@/lib/server/payments/process-event";
import { getPaymentProvider, type WebhookEvent } from "@/lib/server/payments/provider";
import { createServiceRoleClient } from "@/lib/server/supabase-service";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const provider = getPaymentProvider();
  if (provider.isLive || process.env.SANDBOX_PAYMENTS_ENABLED !== "true") {
    return Response.json({ error: "sandbox_disabled" }, { status: 404, headers: noStore });
  }

  const browserClient = await getSupabaseServerClient();
  if (!browserClient) {
    return Response.json({ error: "supabase_not_configured" }, { status: 503, headers: noStore });
  }

  const {
    data: { user },
    error: userError
  } = await browserClient.auth.getUser();
  if (userError || !user) {
    return Response.json({ error: "authentication_required" }, { status: 401, headers: noStore });
  }

  const body = await readBody(request);
  if (!body || !isUuid(body.orderId)) {
    return Response.json({ error: "invalid_order" }, { status: 400, headers: noStore });
  }

  const { data: order, error: orderError } = await browserClient
    .from("order_requests")
    .select(
      "id,buyer_id,creator_id,license_price,currency,listing_title_snapshot,payment_status,status"
    )
    .eq("id", body.orderId)
    .maybeSingle();

  if (orderError) {
    return Response.json({ error: "order_lookup_failed" }, { status: 500, headers: noStore });
  }
  if (!order) {
    return Response.json({ error: "order_not_found" }, { status: 404, headers: noStore });
  }
  if (order.buyer_id !== user.id) {
    return Response.json({ error: "buyer_required" }, { status: 403, headers: noStore });
  }
  if (order.status === "cancelled") {
    return Response.json({ error: "order_cancelled" }, { status: 409, headers: noStore });
  }
  if (order.payment_status === "paid") {
    return Response.json({ ok: true, duplicate: true }, { headers: noStore });
  }

  const currency = normalizeCurrency(order.currency);
  const amountMinor = toMinorUnits(Number(order.license_price ?? 0), currency);
  if (amountMinor <= 0) {
    return Response.json({ error: "invalid_amount" }, { status: 409, headers: noStore });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return Response.json(
      { error: "server_payment_not_configured" },
      { status: 503, headers: noStore }
    );
  }

  const session = await provider.createCheckout({
    orderId: order.id,
    amountMinor,
    currency,
    buyerId: order.buyer_id,
    sellerId: order.creator_id,
    description: order.listing_title_snapshot ?? "Jamly license",
    idempotencyKey: `sandbox:${order.id}`,
    returnUrl: new URL(`/orders/${order.id}`, request.url).toString()
  });

  const event: WebhookEvent = {
    providerEventId: `evt_${session.providerPaymentId}`,
    type: "payment.succeeded",
    orderId: order.id,
    providerPaymentId: session.providerPaymentId,
    amountMinor,
    currency,
    raw: {
      id: `evt_${session.providerPaymentId}`,
      type: "payment.succeeded",
      order_id: order.id,
      payment_id: session.providerPaymentId,
      amount_minor: amountMinor,
      currency,
      sandbox: true
    }
  };

  try {
    const result = await processPaymentEvent(serviceClient, provider.name, event);
    return Response.json(
      { ok: true, duplicate: result.duplicate, orderId: order.id },
      { headers: noStore }
    );
  } catch (error) {
    console.error("sandbox_payment_failed", {
      orderId: order.id,
      message: error instanceof Error ? error.message : "unknown"
    });
    return Response.json({ error: "sandbox_payment_failed" }, { status: 500, headers: noStore });
  }
}

async function readBody(request: Request): Promise<{ orderId: string } | null> {
  try {
    const value = (await request.json()) as unknown;
    if (!value || typeof value !== "object" || !("orderId" in value)) return null;
    const orderId = (value as { orderId?: unknown }).orderId;
    return typeof orderId === "string" ? { orderId } : null;
  } catch {
    return null;
  }
}

function normalizeCurrency(value: string): Currency {
  return value === "TRY" ? "TRY" : "USD";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
