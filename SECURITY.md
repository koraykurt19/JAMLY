# Jamly security model

Last reviewed: 2026-08-13.

This describes what is enforced, where it is enforced, and what is knowingly
accepted. It documents the system as built — not aspirations.

## Authorization model

Authorization has three layers, and each is independently sufficient to deny:

1. **Row Level Security** — the real boundary. Every table has RLS enabled.
   Even if an API route were bypassed, the anon key cannot read another user's
   rows.
2. **Server-side capability checks** — `/api/admin/*` routes call
   `requireCapability()`, which validates the bearer token *and* the caller's
   admin capability before touching data.
3. **UI affordances** — navigation hides what a role cannot do. **This is not
   access control.** It exists so operators are not offered actions that will
   fail.

No service-role key is used by the application. The only exception is the
payment webhook handler (`/api/payments/webhook`), which needs
`SUPABASE_SERVICE_ROLE_KEY` because settlement functions are deliberately
revoked from `anon` and `authenticated`.

### Admin roles

`admin_accounts.role` drives `admin_capabilities()` in the database. Roles:
`super_admin`, `admin`, `moderator`, `support`, `finance`, `content_reviewer`,
`analyst`. `src/lib/admin-client.ts` mirrors this table for the UI and is
covered by a test that asserts the mirror does not grant more than the database.

Protections:

- An admin cannot change their own account status or their own role.
- The last active `super_admin` cannot be restricted or demoted.
- Restricting an account requires a written reason.
- Every privileged mutation writes to `admin_audit_log`.

### Audit log

`admin_audit_log` is append-only. It has a `SELECT` policy for `audit.view`
holders and **no** insert/update/delete policy; rows are written only by
`record_admin_action()`, and a trigger raises on any `UPDATE` or `DELETE`. Not
even a super admin can edit or erase it through the API.

## Fixed in the 2026-08-13 hardening pass

These were live vulnerabilities, found by audit and closed by
`supabase/migrations/20260813_security_hardening.sql`.

| Severity | Issue | Fix |
| --- | --- | --- |
| Critical | Every paid deliverable was downloadable for free. Entitlement keyed on `status <> 'cancelled'`, and orders were created instantly with no payment step. | `order_requests.payment_status` added; the storage policy now requires `payment_status = 'paid'`. |
| High | Any authenticated user could permanently destroy any beat listing by calling the exclusive purchase RPC (`exclusive_sold` + `is_active` are one-way, guarded by a CHECK). | Exclusivity is claimed in `settle_order_payment()` after money settles, never at order creation. `admin_release_exclusive()` reverses a refunded sale. |
| High | Buyers could set their own order to `delivered`, which fired the trigger that mints `revenue_splits`. | Direct `UPDATE` revoked. Transitions go through `set_order_status()`, a role-aware state machine. Creators cannot deliver an unpaid order. |
| High | `listing-covers` and `audio-previews` accepted writes to arbitrary paths from any authenticated user, and all three public buckets were unrestricted. | Insert/update/delete policies now require `(storage.foldername(name))[1] = auth.uid()`. Per-bucket MIME allowlists and size limits set. |
| Medium | `is_admin(uuid)` let any authenticated user enumerate the admin roster. | Execute revoked from `authenticated`; callers use `is_current_user_admin()`. |
| Medium | `profiles` exposed `account_status` (who is suspended/banned) to anonymous callers. | `public_profiles` view exposes only presentational columns. |
| Medium | A transient network or JWT error during checkout flipped the UI to "purchase successful" with no order created. | Demo mode is decided by configuration up front; runtime errors now report failure. |
| Medium | License terms and delivery files were resolved from live code and the mutable listing row, so a seller edit rewrote what past buyers had agreed to and downloaded. | `license_snapshot` and `delivery_path_snapshot` are frozen onto the order at purchase. |
| Medium | `order_requests.listing_id` cascaded on delete — removing a listing destroyed its sales history. | Changed to `on delete restrict` with title snapshot. |
| Low | Rounding each revenue split independently could make the parts not sum to the gross. | Remainder is allocated deterministically; `allocateByPercentage` is covered by tests. |
| Low | A hardcoded Supabase project ref was trusted in CSP and the image optimizer regardless of environment. | Derived from `NEXT_PUBLIC_SUPABASE_URL` only. |

## Rate limiting

Backed by Postgres (`rate_limit_counters` + `consume_rate_limit`), because
serverless functions share no memory and an in-process counter is not a limit.

| Bucket | Limit | Window |
| --- | --- | --- |
| `waitlist:join` | 5 | 1 hour |
| `waitlist:verify` | 10 | 1 hour |
| `waitlist:stats` | 120 | 1 minute |
| `report:create` | 5 | 1 hour |
| `support:create` | 5 | 1 hour |
| `admin:mutation` | 60 | 1 minute |

Identities are salted SHA-256 hashes — **raw IP addresses are never stored**.
Set `RATE_LIMIT_SALT` in production; without it a known default is used and
hashes become predictable.

Failure behaviour is deliberately split:

- **Supabase not configured at all** → allow. The app is in demo mode, there is
  no persisted data behind these endpoints, and the write paths refuse to run
  anyway.
- **Supabase configured but the limiter errored** → in production, **deny**.
  There is real data and no working limit.

Sensitive endpoints rate-limit on two identities (caller *and* target, e.g. IP
and email hash) so rotating one does not defeat the limit.

## Content Security Policy

Set in `next.config.mjs`. Current production policy:

```
default-src 'self'; base-uri 'self'; form-action 'self';
frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests;
connect-src 'self' <supabase-origin> <supabase-wss>;
img-src 'self' data: blob: https://images.unsplash.com <supabase-origin>;
media-src 'self' blob: https://www.soundhelix.com <supabase-origin>;
font-src 'self' data:;
style-src 'self' 'unsafe-inline';
script-src 'self' 'unsafe-inline'
```

### Accepted residual risk: `script-src 'unsafe-inline'`

**Removed:** `'unsafe-eval'` is gone from production. Nothing in this codebase
calls `eval` or `new Function`. It remains in development only, because React's
development build uses `eval` for callstack reconstruction — verified by the
error React itself emits when the directive is absent.

**Retained:** `'unsafe-inline'` for scripts, because Next.js App Router emits
inline bootstrap and RSC flight scripts on every page.

The nonce alternative requires reading `headers()` in the root layout, which
opts **every route** out of static generation — currently 22 static pages would
become dynamic. That is a real, permanent performance cost for a marketplace,
traded against a policy that is already backed by React's automatic escaping,
`object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'none'`.

Revisit if: (a) Next gains static-compatible nonces, or (b) the app becomes
mostly dynamic anyway, at which point the trade disappears.

`style-src 'unsafe-inline'` is required by Tailwind and Next's injected style
tags and has no practical alternative.

## Data handling

- Waitlist emails are stored normalized; **verification tokens are stored only
  as SHA-256 hashes**, so a database leak cannot be used to verify someone
  else's address.
- Signup IPs are stored as salted hashes, never raw.
- The audit log records an IP *prefix* and user-agent *family* at most.
- The public waitlist counter is an aggregate from a security-definer function;
  entry rows have no public read policy at all.
- Marketing opt-out is enforced at enqueue time in `enqueue_email()`, not at
  send time, so a suppressed message is never queued as sendable.

## Money

- Amounts crossing any boundary are **integer minor units**. Floats are used
  only for display.
- `ledger_entries` is append-only with a trigger blocking `UPDATE`/`DELETE`.
  Corrections are reversing entries. There is no mutable balance column;
  balance is derived by summing.
- Webhooks are protected by HMAC signature verification, then by a unique index
  on `(provider, provider_event_id)` for replay protection, then by settlement
  functions that are themselves idempotent on the provider payment id.

## Known gaps

These are **not** fixed and must be understood before launch:

1. **No live payment provider.** The sandbox provider moves no money.
   `paymentsAreLive()` returns `false`. Do not represent payments as working.
2. **RLS negative tests are not automated.** Policies are reviewed by hand.
   Testing them requires a live database and multiple authenticated roles,
   which the current test harness (pure functions only, no async) cannot do.
3. **No bot protection on the waitlist form.** Rate limiting and disposable-domain
   flagging exist; a CAPTCHA/Turnstile integration point does not.
4. **Migrations are not applied to any live database yet.** Every fix above
   exists as SQL in `supabase/migrations/` and takes effect only once applied.
5. **`scripts/apply-supabase-migration.mjs` path guard is broken on Windows**
   (compares a backslash path against a forward slash). Apply migrations from
   the Supabase SQL editor or a POSIX shell until fixed.
6. **Password minimum is enforced client-side at 8 characters.** Set the same
   minimum in the Supabase Auth dashboard so it holds server-side.

## Reporting a vulnerability

Do not open a public issue. Contact the maintainer directly with reproduction
steps and the affected route or table.
