# Payments

**Status: not live.** The domain model, database schema, state machines,
ledger, entitlement gating and webhook handling are implemented and tested. No
payment provider is connected. `paymentsAreLive()` returns `false`.

Nothing on Jamly can currently be purchased with real money, and the UI must
not claim otherwise.

## What is implemented

| Piece | Where |
| --- | --- |
| Payment state machine | `payment_state` enum, `order_requests.payment_status` |
| Payment records | `payments` table (minor units, fees, net) |
| Webhook replay protection | `payment_webhook_events`, unique on `(provider, provider_event_id)` |
| Append-only ledger | `ledger_entries` + trigger blocking UPDATE/DELETE |
| Commission | `calculate_platform_fee()`, configured in `platform_settings` |
| Refunds | `record_payment_refund()` — reversing entries, never edits |
| Payout accounts and payouts | `payout_accounts`, `payouts` |
| Derived balance | `get_account_balance()` |
| Provider boundary | `src/lib/server/payments/provider.ts` |
| Sandbox provider | signs its own webhooks so the path is really exercised |
| Webhook endpoint | `/api/payments/webhook` |
| Test checkout endpoint | `/api/payments/sandbox/complete` (authenticated buyer, env-gated) |
| Money arithmetic | `src/lib/money.ts` (integer minor units) |

## State machines

**Payment:** `unpaid → processing → requires_action → paid → refunded |
partially_refunded | disputed | chargeback | failed`

**Order:** `requested → in_review → delivered | cancelled` (role-gated; a
creator cannot deliver an unpaid order)

**Payout:** `pending → held → available → scheduled → processing → paid |
failed | reversed`

**Entitlement:** granted only when `payment_status = 'paid'` and the order is
not cancelled. Enforced in the storage RLS policy.

Settlement also rejects an amount or currency that differs from the immutable
order snapshot. A partial or wrong-currency provider event cannot unlock the
full delivery package.

## Money representation

Integer minor units everywhere. `24.99 USD` is `2499`.

`toMinorUnits()` collapses to 15 significant digits before rounding, because
`1.005 * 100` is `100.49999999999999` in IEEE754 and both `Math.round` and
`toFixed(0)` would silently lose a cent. This is covered by a test.

Splits use `allocateByPercentage()`: floor everyone, then distribute the
leftover minor units to the largest fractional parts. The parts always sum back
to the total — verified for 33.33/33.33/33.34 and for a 1-cent split.

## Fees

Configured in `platform_settings` under `commission`:

```json
{ "percent": 10, "minimum_minor": 100, "currency": "USD" }
```

On settlement the ledger records: the gross sale credited to the seller, then
the platform fee and any processor fee debited back out. `payments.net_minor`
is a generated column.

## The word "escrow"

**Do not use it in the UI.** Escrow is a regulated arrangement Jamly is not set
up to provide. What this system implements is *delayed release*: funds settle,
`payouts.available_at` holds them through the dispute window, and only then do
they become payable. Describe it as "held until delivery" or "released after
delivery", never as escrow.

## Connecting a real provider

1. Implement `PaymentProvider`:

```ts
interface PaymentProvider {
  readonly name: string;
  readonly isLive: boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(payload: string, signature: string | null): WebhookEvent | null;
}
```

2. Return it from `getPaymentProvider()`.
3. Point the provider's webhook at `POST /api/payments/webhook`.
4. Set `SUPABASE_SERVICE_ROLE_KEY` and `PAYMENT_WEBHOOK_SECRET`.

Nothing else in the application changes.

### If you choose Stripe Connect

Check the current documentation at <https://docs.stripe.com/connect> before
implementing — the details below change.

Decisions you must make:

- **Charge type** — destination charges (Jamly is merchant of record, simpler
  tax position) vs separate charges and transfers (sellers are merchants).
  This affects liability, refunds and tax, so decide it with an accountant.
- **Onboarding/KYC** — Connect handles it; mirror the verdict into
  `payout_accounts.onboarding_status` and `payouts_enabled`.
- **Application fee** — must match `calculate_platform_fee()` or the ledger and
  Stripe will disagree.
- **Negative balances** — a refund after payout can leave a seller negative.
  Decide who absorbs it; the ledger supports negative balances, the product
  does not yet have a policy.
- **Payout schedule** — must be at least as long as the dispute window.
- **Idempotency** — pass `CheckoutRequest.idempotencyKey` as Stripe's
  `Idempotency-Key`.
- **Webhook signatures** — verify with Stripe's own helper, not the sandbox
  HMAC.
- **Regional availability** — confirm Connect supports payouts to Turkey for
  your entity type before committing. If it does not, iyzico submerchant is the
  likely alternative and the same interface applies.

## Turkish market notes

Not implemented, and required before taking real payments in Turkey:

- **KDV (VAT)** — no tax model exists. Rate, inclusive/exclusive pricing and
  invoice requirements all need deciding.
- **e-Arşiv / e-Fatura** — no invoice generation.
- **Currency** — prices are stored implicitly in USD with TRY as a display-time
  conversion against a client-fetched rate. For real TRY charges the order must
  capture its own currency and the FX rate used.
- **Distance selling contract and right of withdrawal** — digital goods have
  specific rules; the license terms do not address them.

These are legal/accounting decisions, not engineering ones. Get advice before
launch.

## Testing the sandbox path

For the in-app test panel set the following **server-only** environment values:

```env
SUPABASE_SERVICE_ROLE_KEY=<secret server key>
SANDBOX_PAYMENTS_ENABLED=true
PAYMENT_WEBHOOK_SECRET=<long random value>
```

Create a beat-license order from the checkout page, then use the fixed Jamly
Sandbox Payment panel. It never accepts personal card data and never moves
money. The endpoint verifies the authenticated buyer owns the order and that
the submitted card payload is one of the explicit Jamly sandbox test cards
before it records a sandbox settlement.

Sandbox card scenarios:

| Number | Result |
| --- | --- |
| `4242 4242 4242 4242` | approved |
| `5555 5555 5555 4444` | approved |
| `4000 0566 5566 5556` | approved |
| `4000 0000 0000 0002` | declined |

Use any future expiry in `MM/YY` format, any 3-4 digit CVC, and a non-empty
cardholder name. Other Luhn-valid card numbers are rejected as
`unsupported_test_card`, so real card numbers are not silently accepted in the
fake payment surface.

For direct webhook testing, the sandbox provider signs webhooks with
`PAYMENT_WEBHOOK_SECRET` (default `jamly-sandbox-webhook-secret`). Compute
`HMAC-SHA256(secret, body)` and send it as `x-jamly-signature`:

```json
{
  "id": "evt_test_1",
  "type": "payment.succeeded",
  "order_id": "<order-uuid>",
  "payment_id": "sbx_test_1",
  "amount_minor": 2499,
  "currency": "USD"
}
```

Expected: the order flips to `paid`, ledger entries appear, exclusivity is
claimed if the tier is exclusive, and the deliverable becomes downloadable.
Re-sending the same `id` returns `{ ok: true, duplicate: true }` and changes
nothing.
