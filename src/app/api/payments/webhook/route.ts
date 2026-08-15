import { getPaymentProvider } from "@/lib/server/payments/provider";
import { processPaymentEvent } from "@/lib/server/payments/process-event";
import { createServiceRoleClient } from "@/lib/server/supabase-service";

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

  try {
    const result = await processPaymentEvent(client, provider.name, event);
    return Response.json({ ok: true, duplicate: result.duplicate }, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("webhook_processing_failed", { type: event.type, message });
    // A failed event stays unprocessed and is retried on redelivery.
    return Response.json({ error: "processing_failed" }, { status: 500, headers: noStore });
  }
}
