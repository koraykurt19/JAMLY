# Environment variables

Every variable the application reads, what breaks without it, and where to set
it. **No secret values appear in this file or in `.env.example`.**

## Required for a working deployment

| Variable | Scope | Purpose | Without it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL | App runs in demo mode: sample data, no auth, no persistence |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Supabase anon/publishable key | Same as above |

Both are public by design and protected by RLS. They are safe in the browser
bundle.

## Required for payments

| Variable | Scope | Purpose | Without it |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Lets the payment webhook call settlement functions that are revoked from `anon`/`authenticated` | Webhook returns 500; orders never reach `paid`, so no deliverable is ever released |
| `PAYMENT_WEBHOOK_SECRET` | Server only | HMAC secret for webhook signature verification | Falls back to a known development secret — **any caller can forge a settlement** |
| `PAYMENT_PROVIDER` | Server only | Selects the provider implementation | Defaults to `sandbox`, which moves no money |

> **Never** prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`. It bypasses
> every RLS policy. In Vercel, add it without the "Expose to browser" option.

## Recommended for production

| Variable | Scope | Purpose | Without it |
| --- | --- | --- | --- |
| `RATE_LIMIT_SALT` | Server only | Salts hashed rate-limit identities | A known default is used; identity hashes become predictable |
| `NEXT_PUBLIC_SITE_URL` | Client + server | Canonical origin for email links and OG metadata | Falls back to the Vercel URL, then `http://localhost:3000`. **Waitlist verification links will point at localhost if unset in production.** |

## Tooling only (never set in Vercel)

| Variable | Purpose |
| --- | --- |
| `SUPABASE_DATABASE_URL` | Direct Postgres connection string for `npm run supabase:apply-schema` / `supabase:apply-migration`. Local shell only. |
| `DATABASE_URL` | Compatibility fallback for the above. |
| `APP_PORT` | Docker Compose host port. |

The two `apply-*` scripts do **not** read `.env.local`. Pass the variable
inline:

```bash
SUPABASE_DATABASE_URL="postgresql://..." npm run supabase:apply-migration -- 20260813_security_hardening.sql
```

## Local setup

Create `.env.local` (git-ignored):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Then verify:

```bash
npm run supabase:check
```

Leave both blank to work in demo mode — the marketplace, Jam Match and the
Early Access page all render with sample data.

## Production behaviour without configuration

The app does **not** silently fall back to demo mode in production for
data-bearing paths:

- The waitlist API returns `503 not_configured` rather than pretending to save.
- The public counter reports `configured: false` and the UI shows no number
  rather than inventing social proof.
- The admin console redirects away instead of rendering.
- Rate limiting fails **closed** if Supabase is configured but the limiter
  errors.
