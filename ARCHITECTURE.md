# Jamly architecture

Next.js 16 (App Router, Turbopack) + React 19 + Supabase (Postgres, Auth,
Storage, Realtime). TypeScript strict. Tailwind with a canonical token layer.

## Layering

```
src/app/**          routes; server components by default
src/components/**   presentation; "use client" only where interactivity needs it
src/components/ui/  design-system primitives (Button, Field, Modal, Toast, …)
src/lib/**          domain logic — pure, testable, framework-free
src/lib/server/**   server-only (rate limiting, admin authz, mailer, payments)
supabase/**         schema + ordered migrations
tests/run-tests.ts  test runner and cases
```

**Rule: authorization decisions live in the database.** TypeScript mirrors
(`order-status.ts`, `admin-client.ts`) exist so the UI does not offer actions
that will fail — they never decide. Where a mirror exists, a test asserts it
does not grant more than the database.

## Data flow

Two clients, deliberately:

- **Browser** (`supabase.ts`) — anon key, user's JWT, RLS applies.
- **Server** (`supabase-server.ts`) — anon key + cookie session, RLS applies.

`proxy.ts` (renamed from `middleware.ts` for Next 16) refreshes the session on
every non-static request and clears cookies that are structurally invalid.

The only elevated path is the payment webhook, which uses the service role
because settlement functions are revoked from `anon` and `authenticated`.

## Domain modules

### Orders and licensing

An order is created `unpaid`. Entitlement to files requires
`payment_status = 'paid'` — enforced in the storage RLS policy, not in
application code.

Status transitions go through `set_order_status()`, a role-aware state machine:

```
                 creator                    buyer
requested   →  in_review, cancelled     →  cancelled
in_review   →  delivered*, cancelled    →  cancelled
delivered   →  (terminal)               →  (terminal)
cancelled   →  (terminal)               →  (terminal)

* only when payment_status = 'paid'
```

**License snapshots.** Terms text lives in code, so without a snapshot every
past order would render whatever the current code says. `buildLicenseSnapshot()`
freezes both languages, the price, the tier and the terms version onto
`order_requests.license_snapshot` at purchase, and the delivery path is frozen
alongside it. A seller edit can no longer rewrite what a buyer bought.

**Exclusivity** is claimed in `settle_order_payment()` after money settles.
Claiming it at order creation was how any user could permanently destroy any
listing for free.

### Money

Integer minor units at every boundary (`src/lib/money.ts`). `ledger_entries` is
append-only — corrections are reversing entries, and balance is derived by
summing, never stored. `allocateByPercentage()` distributes rounding remainders
deterministically so splits always reconcile to the total.

### Payments

`PaymentProvider` (`src/lib/server/payments/provider.ts`) is the boundary. The
shipped `SandboxPaymentProvider` moves no money but signs its own webhooks, so
signature verification and replay protection are genuinely exercised rather
than stubbed. Swapping in Stripe means implementing the interface; nothing else
changes.

Webhook defence in depth: HMAC signature → unique index on
`(provider, provider_event_id)` → settlement function idempotent on the
provider payment id.

### Waitlist

`join_waitlist()` is idempotent on email — a repeat submission returns the
existing position rather than erroring, so the response never reveals whether
an address was already registered. Verification tokens are stored only as
SHA-256 hashes. Referral credit lands on *verification*, so unverified spam
earns nothing. The public counter is an aggregate from a security-definer
function; entry rows have no public read policy.

### Badges

`badge_definitions` carries the rule; `badge_awards` carries provenance
(source, reason, actor, revocation). `evaluate_profile_badges()` runs the rule
set and is triggered when an order settles. Members can hide a badge but a
trigger prevents them changing anything else — a user can never grant
themselves a badge, and `verified_*` badges are manual-only.

### Admin

Capability-based (`admin_capabilities()`), not a binary flag. `/admin` has a
server-side guard in `layout.tsx`; each API route calls `requireCapability()`;
the database re-checks inside every RPC. Every privileged mutation writes to
the append-only `admin_audit_log`.

## Design system

Tokens are declared once in `globals.css` as `R G B` channel triples, and
`tailwind.config.ts` reads them via `rgb(var(--token) / <alpha-value>)` so alpha
modifiers keep working. Never add a hex to the Tailwind config — edit the CSS
variable.

The opacity scale is generated for every integer 0–100. It used to be
hand-maintained and had fallen behind the code: twelve in-use values emitted no
CSS at all, which is why some skeletons were invisible and some chips
transparent.

## Testing

`tests/run-tests.ts` is both runner and suite — no framework. Constraints worth
knowing:

- `tsconfig.test.json` includes only `src/lib/**/*.ts` and `tests/**/*.ts`.
  **Components and routes cannot be tested** without changing that.
- Cases are synchronous (`run: () => void`).
- Only `@/lib/*` imports resolve, via a junction created by
  `scripts/setup-test-build.mjs` (cross-platform; the previous `ln -s` never
  worked on Windows).

The runner now catches per-test failures and reports a summary rather than
dying on the first one.

## Demo mode

Without Supabase env vars the app renders sample data end to end. The boundary
is enforced: in production the waitlist API returns 503 instead of pretending
to save, the counter reports `configured: false` rather than inventing a
number, and the admin console redirects away.
