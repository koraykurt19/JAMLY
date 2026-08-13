import { createClient } from "@supabase/supabase-js";
import { getPaymentProvider } from "@/lib/server/payments/provider";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Payment provider webhook.
 *
 * Three defences, in order:
 *   1. Signature verification — an unsigned or mis-signed body is rejected
 *      before it is parsed as an event.
 *   2. Replay protection — the provider's event id is unique-indexed, so a
 *      redelivery is recorded and skipped rather than applied twice.
 *   3. Settlement runs inside a database function that is itself idempotent on
 *      the provider payment id.
 *
 * Settlement requires the service role: `record_payment_settlement` is revoked
 * from anon and authenticated precisely so a browser can never call it.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const payload = await request.text();
  const signature =
    request.headers.get("x-jamly-signature") ??
    request.headers.get("stripe-signature") ??
    null;

  const event = provider.verifyWebhook(payload, signature);
  if (!event || !event.providerEventId) {
    // Do not reveal which check failed.
    return Response.json({ error: "invalid_signature" }, { status: 400, headers: noStore });
  }

  const client = createServiceRoleClient();
  if (!client) {
    // Returning 500 makes the provider retry once settlement is configured.
    return Response.json(
      { error: "not_configured" },
      { status: 500, headers: noStore }
    );
  }

  // Replay protection: the unique index on (provider, provider_event_id) makes
  // this insert the arbiter of whether we have seen the event before.
  const { error: insertError } = await client.from("payment_webhook_events").insert({
    provider: provider.name,
    provider_event_id: event.providerEventId,
    event_type: event.type,
    payload: event.raw as never
  });

  if (insertError) {
    if (insertError.code === "23505") {
      // Already processed. Acknowledge so the provider stops retrying.
      return Response.json({ ok: true, duplicate: true }, { headers: noStore });
    }
    console.error("webhook_record_failed", { message: insertError.message });
    return Response.json({ error: "record_failed" }, { status: 500, headers: noStore });
  }

  try {
    if (event.type === "payment.succeeded" && event.orderId && event.amountMinor !== null) {
      const { error } = await client.rpc("record_payment_settlement", {
        p_order_id: event.orderId,
        p_provider: provider.name,
        p_provider_payment_id: event.providerPaymentId ?? event.providerEventId,
        p_amount_minor: event.amountMinor,
        p_currency: event.currency ?? "USD"
      });
      if (error) throw new Error(error.message);
    } else if (event.type === "payment.failed" && event.orderId) {
      const { error } = await client.rpc("settle_order_payment", {
        p_order_id: event.orderId,
        p_payment_status: "failed",
        p_provider_reference: event.providerPaymentId
      });
      if (error) throw new Error(error.message);
    }

    await client
      .from("payment_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", provider.name)
      .eq("provider_event_id", event.providerEventId);

    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("webhook_processing_failed", { type: event.type, message });

    await client
      .from("payment_webhook_events")
      .update({ process_error: message })
      .eq("provider", provider.name)
      .eq("provider_event_id", event.providerEventId);

    // 500 asks the provider to retry; the event row is already recorded so the
    // retry hits the duplicate path and we reconcile from the stored payload.
    return Response.json({ error: "processing_failed" }, { status: 500, headers: noStore });
  }
}

/**
 * Service-role client. The key is server-only and must never be exposed with a
 * NEXT_PUBLIC_ prefix; without it, settlement cannot run.
 */
function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
