# Jamly project audit — 2026-08-13

Audit and hardening pass on branch `feat/launch-readiness`. Four parallel
read-only audits (security/RLS, design system, marketplace domain, admin +
test readiness) against the real code, followed by implementation.

## Starting state

Next.js 14.2 / React 18. 34 routes, 57 components, ~1,620-line schema, 11
migrations. Marketplace, Jam Match, beat licensing, order requests, Realtime
messaging, collab workspace, TR/EN, USD/TRY, demo mode. `npm audit`: 8 high.

## Findings and disposition

### Critical — fixed

1. **Every paid deliverable was free.** Entitlement keyed on
   `status <> 'cancelled'` and orders were created instantly with no payment
   step, so any account could call the purchase RPC and immediately sign a URL
   for the exclusive WAV+stems package. → `payment_status` added; storage
   policy requires `paid`.

2. **Any user could permanently destroy any beat listing.** The exclusive
   purchase RPC set `exclusive_sold = true, is_active = false`, and a CHECK
   constraint made that irreversible. Combined with (1) it cost nothing. →
   Exclusivity is claimed after settlement; `admin_release_exclusive()` added.

### High — fixed

3. **Buyers could forge revenue splits** by setting their own order to
   `delivered`. The UI hid the control; RLS did not. → `set_order_status()`
   state machine; direct UPDATE revoked.
4. **Arbitrary writes to public storage buckets** — no path scoping on
   `listing-covers` / `audio-previews`, no MIME or size limits. → Per-user
   folder enforcement, allowlists, size caps.
5. **License terms and delivery files were retroactive.** A seller edit
   rewrote what past buyers agreed to and downloaded. → Snapshots frozen at
   purchase.
6. **Deleting a listing deleted its sales history** (`on delete cascade`). →
   `restrict` + title snapshot.

### Medium — fixed

7. `is_admin(uuid)` allowed admin-roster enumeration → replaced with
   `is_current_user_admin()`.
8. `profiles` exposed `account_status` publicly → `public_profiles` view.
9. A transient error during checkout showed "purchase successful" with no
   order created → demo mode decided by configuration, not by catch block.
10. Hardcoded foreign Supabase project ref trusted in CSP and the image
    optimizer → derived from environment.
11. `script-src 'unsafe-eval'` unnecessary in production → removed (kept in
    dev, which React requires).

### Live rendering bugs — fixed

12. **Twelve in-use Tailwind opacity values emitted no CSS**, because the
    scale was hand-maintained and had fallen behind. Skeletons on `/` and
    `/collab` were invisible; saved-search chips and select text were wrong. →
    Complete 0–100 scale.
13. `sanitizeSearch` left trailing whitespace from stripped metacharacters.
14. `toMinorUnits(1.005)` returned 100 instead of 101 — IEEE754 error that
    both `Math.round` and `toFixed(0)` reproduce. Found by a test written
    during this pass.

### Accepted, documented

- `script-src 'unsafe-inline'` retained. Next's App Router emits inline
  bootstrap/RSC scripts; the nonce alternative forces all 22 static pages to
  render dynamically. Rationale in `SECURITY.md`.

### Not addressed

- Automated RLS negative tests — the harness compiles only `src/lib/**` and
  runs synchronous cases, so it cannot authenticate as multiple roles.
- Bot protection on the waitlist form (integration point only).
- Logo remains a 1024×1024 PNG; `public/` still holds eight stale favicon
  generations.
- Profile schema extensions (languages, instruments, DAW, pinned listings,
  privacy toggles) — badge showcase and report entry point shipped; the wider
  field set did not.

## Built

**Early Access** — `waitlist_entries` / `_referrals` / `_events` /
`launch_invites` / `reserved_usernames`; public page with hero, value prop,
audience split, how-it-works, FAQ and form; referral attribution and UTM
capture; email verification with hashed tokens; honest counter that shows
nothing rather than inventing social proof.

**Badges** — 23 seeded definitions across five categories; rule engine that
evaluates on order settlement; profile showcase grouped by category; admin
grant/revoke with mandatory reason and audit trail. Users cannot self-grant.

**Admin** — capability-based RBAC across seven roles; append-only audit log
that no admin can edit or delete; server-side route guard; waitlist, reports,
badges and audit consoles with pagination and explicit loading/empty/error
states.

**Reports** — the table, RLS and overview counter existed with zero surface.
Added submission modal, rate-limited API, moderation queue sorted urgent-first,
resolution flow requiring a written note.

**Payments** — payment records, append-only ledger, commission model, refunds
as reversing entries, payout accounts, derived balances, provider-agnostic
adapter, sandbox provider that signs its own webhooks, idempotent webhook
endpoint. **No live provider — nothing can be purchased.**

**Design system** — tokens collapsed to one canonical source; UI primitive kit
(Button, Field, Modal, Toast, Card, Pill, Skeleton, table shell) replacing
copy-pasted class strings.

**Infrastructure** — Next 16.3 / React 19 migration; ESLint flat config;
cross-platform test script (`npm test` never ran on Windows); test runner now
reports all failures instead of dying on the first.

## Verification

typecheck clean · lint clean · 21/21 tests · production build 49 route entries ·
`npm audit` 0 vulnerabilities · production server smoke-tested (8 routes 200,
CSP verified, authorization boundaries return 401/400) · Early Access page
verified in-browser at desktop and 375px.

Migrations are **not** applied to any live database. Every database-level fix
above takes effect only when `RELEASE_CHECKLIST.md` step 2 is run.
