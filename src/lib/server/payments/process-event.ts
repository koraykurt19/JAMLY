import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { WebhookEvent } from "@/lib/server/payments/provider";

type ProcessingResult = { duplicate: boolean };

/**
 * Records and applies a verified provider event. An event that failed midway
 * remains retryable; only an event with processed_at is treated as complete.
 */
export async function processPaymentEvent(
  client: SupabaseClient<Database>,
  providerName: string,
  event: WebhookEvent
): Promise<ProcessingResult> {
  const { error: insertError } = await client.from("payment_webhook_events").insert({
    provider: providerName,
    provider_event_id: event.providerEventId,
    event_type: event.type,
    payload: event.raw as Database["public"]["Tables"]["payment_webhook_events"]["Row"]["payload"]
  });

  if (insertError && insertError.code !== "23505") {
    throw new Error(`webhook_record_failed:${insertError.message}`);
  }

  if (insertError?.code === "23505") {
    const { data: existing, error: existingError } = await client
      .from("payment_webhook_events")
      .select("processed_at")
      .eq("provider", providerName)
      .eq("provider_event_id", event.providerEventId)
      .single();

    if (existingError) {
      throw new Error(`webhook_replay_lookup_failed:${existingError.message}`);
    }
    if (existing.processed_at) return { duplicate: true };
  }

  try {
    if (event.type === "payment.succeeded" && event.orderId && event.amountMinor !== null) {
      const { error } = await client.rpc("record_payment_settlement", {
        p_order_id: event.orderId,
        p_provider: providerName,
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

    const { error: updateError } = await client
      .from("payment_webhook_events")
      .update({ processed_at: new Date().toISOString(), process_error: null })
      .eq("provider", providerName)
      .eq("provider_event_id", event.providerEventId);
    if (updateError) throw new Error(updateError.message);

    return { duplicate: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    await client
      .from("payment_webhook_events")
      .update({ process_error: message })
      .eq("provider", providerName)
      .eq("provider_event_id", event.providerEventId);
    throw error;
  }
}
