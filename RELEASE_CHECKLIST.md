# Jamly release checklist

Ordered. Items marked **BLOCKER** must be done by a human with credentials —
they cannot be automated from the repository.

## 1. Local verification

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit
```

All must pass before deployment. The historical `feat/launch-readiness` gate
was typecheck clean, lint clean, 21/21 tests passing, build succeeding, and
`npm audit` reporting 0 vulnerabilities; re-run the gate on the commit being
deployed.

## 2. Supabase project — **BLOCKER**

1. Create the project. Copy the URL and anon key.
2. For a fresh project, apply `supabase/schema.sql` first.
3. Then apply the post-schema migrations **in this order**:

```
20260813_security_hardening.sql
20260813_rate_limiting.sql
20260813_waitlist.sql
20260813_badges.sql
20260813_admin_rbac_audit.sql
20260813_email_outbox.sql
20260813_payments.sql
20260815_validate_payment_amount.sql
```

For an older Jamly database that predates the current `schema.sql`, apply every
missing migration in dependency order from `NEW_VDS_SETUP_WINDOWS.md`. Do not
blindly run the old migrations after `schema.sql`; some of those changes are
already in the base schema.

Order matters: `security_hardening` must precede `badges` because badge rules
read `payment_status`; `admin_rbac_audit` must precede `email_outbox` and
`payments` because they call `admin_has`; `20260815_validate_payment_amount`
patches the settlement function created by `20260813_payments`.

> `npm run supabase:apply-migration` supports Windows and POSIX path separators.
> For production, applying one file at a time in the Supabase SQL editor remains
> the safest option because the migration order is part of the release contract.

4. Verify: `npm run supabase:check`

## 3. Storage buckets

`schema.sql` creates `listing-covers`, `profile-media`, `audio-previews`
(public) and `license-deliverables` (private).
`20260813_security_hardening.sql` then applies per-bucket MIME allowlists and
size limits. Confirm in the dashboard that `license-deliverables` is **not**
public.

## 4. Auth configuration — **BLOCKER**

- Site URL → your production domain.
- Redirect allowlist → `https://<domain>/auth/reset-password`,
  `https://<domain>/early-access/verify`.
- Set the password minimum to 8 characters (currently only enforced
  client-side).

## 5. Environment variables — **BLOCKER**

See `ENVIRONMENT.md`. Minimum for launch:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — **without this, waitlist verification emails link to
  localhost**
- `RATE_LIMIT_SALT`

For payments, additionally `SUPABASE_SERVICE_ROLE_KEY` (server-only) and
`PAYMENT_WEBHOOK_SECRET`.

## 6. First admin — **BLOCKER**

`20260809_admin_and_platform_config.sql` bootstraps one hardcoded address. To
promote your own account, run in the SQL editor:

```sql
insert into public.admin_accounts (user_id, role)
select id, 'super_admin' from public.profiles where handle = '<your-handle>'
on conflict (user_id) do update set role = 'super_admin', is_active = true;
```

Then confirm `/admin` loads and shows the Super Admin pill. A non-admin must be
redirected away.

## 7. Email delivery

No provider is wired. `enqueue_email()` writes to `email_outbox` and nothing
sends. **Waitlist verification links are not delivered until you implement
`deliver()` in `src/lib/server/mailer.ts`.**

Until then, either:
- read pending links from `email_outbox` manually, or
- treat unverified signups as valid and skip the verification gate.

In development the rendered message (including the verify URL) is logged to the
server console.

## 8. Payments — **BLOCKER, not launch-ready**

The domain is complete: state machines, ledger, entitlement gating, refunds,
webhook with signature verification and replay protection. **No real provider
is connected.** `paymentsAreLive()` returns `false`.

To go live:
1. Create a Stripe Connect (or iyzico submerchant) account.
2. Implement `PaymentProvider` in `src/lib/server/payments/provider.ts`.
3. Point the provider's webhook at `/api/payments/webhook`.
4. Set the credentials from `ENVIRONMENT.md`.
5. Test the full path in the provider's test mode before enabling live keys.

Do not advertise purchases until this is done. With the sandbox provider,
orders are created `unpaid` and no deliverable is released — which is correct,
but means nothing can be bought.

## 9. Deploy

1. Push the branch, open a PR, merge to `main`.
2. For Vercel, connect the repo and add environment variables (step 5).
3. For Windows/IIS, follow `NEW_VDS_SETUP_WINDOWS.md`.
4. Deploy only after Supabase verification returns ready.

## 10. Post-deploy smoke test

| Check | Expected |
| --- | --- |
| `/api/health` | 200, `supabase.status: "ready"`, `build.status: "current"` |
| `/` | Marketplace renders |
| `/early-access` | Hero, counter, form render |
| Waitlist submit | 201, queue position returned |
| Duplicate submit | 200, `alreadyRegistered: true`, position unchanged |
| Submit 6× in an hour | 429 |
| `/admin` as non-admin | Redirect away |
| `/admin` as admin | Console loads with role pill |
| `/admin/audit` | Shows the status change you just made |
| Report a listing | 201; appears in `/admin/reports` |
| `curl -I /` | CSP present, **no `unsafe-eval`** |

## 11. Known gaps at launch

| Gap | Impact |
| --- | --- |
| No live payment provider | Nothing can actually be purchased |
| No email delivery | Waitlist verification links must be sent manually |
| No automated RLS tests | Policy regressions would not be caught by CI |
| No bot protection on the waitlist | Rate limiting only |
| `script-src 'unsafe-inline'` retained | Documented trade-off, see `SECURITY.md` |
| Migrations never applied to a live DB | Every fix is SQL-only until step 2 runs |

## 12. Rollback

Deployment: revert in Vercel, or check out the known-good commit and rebuild on
the Windows VDS.

Database: migrations are additive and idempotent, but
`20260813_security_hardening.sql` **revokes** the direct order-update policy and
changes the purchase RPC signature. Rolling back the app without rolling back
the database leaves the old client calling a function that no longer matches.
Roll back both, or neither.
