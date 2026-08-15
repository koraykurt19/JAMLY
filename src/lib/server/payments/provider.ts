import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Currency } from "@/lib/money";

/**
 * Payment provider boundary.
 *
 * No live provider is configured yet. This defines the contract a real one
 * (Stripe Connect, iyzico submerchant) must satisfy, and ships a sandbox
 * implementation so the whole order → payment → entitlement → payout path is
 * exercisable end to end without credentials.
 *
 * Swapping in a real provider means implementing this interface and returning
 * it from `getPaymentProvider()`. Nothing else in the app changes.
 */

export type CheckoutRequest = {
  orderId: string;
  amountMinor: number;
  currency: Currency;
  buyerId: string;
  sellerId: string;
  description: string;
  /** Makes a retried checkout return the original intent instead of a second charge. */
  idempotencyKey: string;
  returnUrl: string;
};

export type CheckoutSession = {
  providerPaymentId: string;
  /** Where to send the buyer. Null when the provider settles without redirect. */
  redirectUrl: string | null;
  status: "requires_action" | "processing" | "paid";
};

export type WebhookEvent = {
  providerEventId: string;
  type: "payment.succeeded" | "payment.failed" | "payment.refunded" | "payout.paid" | "unknown";
  orderId: string | null;
  providerPaymentId: string | null;
  amountMinor: number | null;
  currency: Currency | null;
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  readonly isLive: boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(payload: string, signature: string | null): WebhookEvent | null;
}

/**
 * Sandbox provider.
 *
 * Moves no money. It mints deterministic identifiers and signs its own webhook
 * payloads with a local secret, so the settlement path — including signature
 * verification and replay protection — is genuinely tested rather than stubbed.
 */
class SandboxPaymentProvider implements PaymentProvider {
  readonly name = "sandbox";
  readonly isLive = false;

  private get secret() {
    return process.env.PAYMENT_WEBHOOK_SECRET?.trim() || "jamly-sandbox-webhook-secret";
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const digest = createHash("sha256")
      .update(request.idempotencyKey)
      .digest("hex")
      .slice(0, 32);
    const providerPaymentId = `sbx_${digest}`;
    return {
      providerPaymentId,
      // The sandbox has no hosted page; the app renders its own confirmation.
      redirectUrl: null,
      status: "requires_action"
    };
  }

  verifyWebhook(payload: string, signature: string | null): WebhookEvent | null {
    if (!signature) return null;

    const expected = createHmac("sha256", this.secret).update(payload).digest("hex");
    const provided = signature.replace(/^sha256=/, "");

    // Constant-time compare; a length mismatch is rejected before comparing.
    if (provided.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"))) {
      return null;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return null;
    }

    const type = String(parsed.type ?? "");
    return {
      providerEventId: String(parsed.id ?? ""),
      type: isKnownEventType(type) ? type : "unknown",
      orderId: parsed.order_id ? String(parsed.order_id) : null,
      providerPaymentId: parsed.payment_id ? String(parsed.payment_id) : null,
      amountMinor: typeof parsed.amount_minor === "number" ? parsed.amount_minor : null,
      currency: parsed.currency === "TRY" ? "TRY" : parsed.currency === "USD" ? "USD" : null,
      raw: parsed
    };
  }
}

function isKnownEventType(value: string): value is WebhookEvent["type"] {
  return ["payment.succeeded", "payment.failed", "payment.refunded", "payout.paid"].includes(value);
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  // A live provider is selected by configuration. Until PAYMENT_PROVIDER names
  // one that is implemented, the sandbox is used and `isLive` stays false so
  // the UI can say so honestly rather than implying real payments work.
  cached = new SandboxPaymentProvider();
  return cached;
}

/** True only when a real, credentialed provider is wired up. */
export function paymentsAreLive() {
  return getPaymentProvider().isLive;
}
