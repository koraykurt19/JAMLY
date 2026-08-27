# Jamly Supabase Live Setup

This file is the short checklist for moving Jamly from demo preview mode to live Supabase mode.

## 1. Create Or Open Supabase

Open your Supabase project, then go to:

```text
Project Settings -> API
```

Copy only these public frontend values:

```text
Project URL
publishable key or anon public key
```

Never use or commit `sb_secret`, service role, or database passwords in the frontend.

## 2. Local Environment

Create `.env.local` locally:

```bash
cp .env.example .env.local
```

Fill it like this:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_PUBLIC_KEY
APP_PORT=3000
```

Restart the dev server after changing env values.

## 3. Fresh Supabase Database

If the Supabase project is empty, run this file first in SQL Editor:

```text
supabase/schema.sql
```

It creates the base tables, indexes, RLS policies, triggers, storage buckets,
Realtime setup, and the unified account model.

Then run the post-schema migrations in this order:

```text
supabase/migrations/20260813_security_hardening.sql
supabase/migrations/20260813_rate_limiting.sql
supabase/migrations/20260813_waitlist.sql
supabase/migrations/20260813_badges.sql
supabase/migrations/20260813_admin_rbac_audit.sql
supabase/migrations/20260813_email_outbox.sql
supabase/migrations/20260813_payments.sql
supabase/migrations/20260815_validate_payment_amount.sql
```

If you want an automation or CLI to apply SQL for you, provide a Supabase access token or database password. A frontend publishable key cannot create tables or policies.

From this repository, you can verify and apply the schema with:

```bash
npm run supabase:check
SUPABASE_DATABASE_URL="postgresql://..." npm run supabase:apply-schema
```

Use a direct Supabase Postgres connection string from:

```text
Project Settings -> Database -> Connection string
```

Do not commit the database URL and do not add it to Vercel frontend variables.

## 4. Existing Jamly Database

If the project already has an older Jamly schema, run migrations in this order:

```text
supabase/migrations/20260629_add_conversations.sql
supabase/migrations/20260707_add_beat_license_tiers.sql
supabase/migrations/20260712_unify_account_capabilities.sql
supabase/migrations/20260715_username_policy.sql
supabase/migrations/20260731_protect_founder_headline.sql
supabase/migrations/20260801_ensure_listing_storage.sql
supabase/migrations/20260809_admin_and_platform_config.sql
supabase/migrations/20260811_add_collaboration_workspace.sql
supabase/migrations/20260811_add_collaboration_revenue.sql
supabase/migrations/20260811_add_profile_follows.sql
supabase/migrations/20260811_tighten_collaboration_rls.sql
supabase/migrations/20260813_security_hardening.sql
supabase/migrations/20260813_rate_limiting.sql
supabase/migrations/20260813_waitlist.sql
supabase/migrations/20260813_badges.sql
supabase/migrations/20260813_admin_rbac_audit.sql
supabase/migrations/20260813_email_outbox.sql
supabase/migrations/20260813_payments.sql
supabase/migrations/20260815_validate_payment_amount.sql
```

The account migration removes strict buyer/creator role gates. Jamly keeps the
legacy `profile_role` enum only for compatibility, while the product now behaves
as one account that can buy, sell, message, and publish. The admin/config
migration adds `admin_accounts`, account-status controls, reports, platform
skills, platform settings, admin RPCs, and protected moderation policies.

If `koraykurt.vrdn@gmail.com` already exists in `profiles`, the admin/config
migration bootstraps that profile as `owner`. If the profile is created later,
insert the owner row manually into `admin_accounts`.

## 5. Auth URL Settings

In Supabase, open:

```text
Authentication -> URL Configuration
```

Set:

```text
Site URL:
http://localhost:3000
```

Add production later, for example:

```text
https://your-vercel-project.vercel.app
https://your-git-branch-your-team.vercel.app
https://your-domain.com
```

For password recovery, also add the exact reset page for every deployed domain:

```text
http://localhost:3000/auth/reset-password
https://your-vercel-project.vercel.app/auth/reset-password
https://your-domain.com/auth/reset-password
```

Use Supabase's default recovery email template with `{{ .ConfirmationURL }}` so the
secure link reaches this page.

## 6. Storage Buckets

The SQL creates these buckets:

```text
listing-covers          public
profile-media           public
audio-previews          public
license-deliverables    private
collab-files            private
```

If a bucket already exists, the SQL safely keeps it.

## 7. Deployment Environment

In Vercel, open:

```text
Project Settings -> Environment Variables
```

Add these variables for Production, Preview, and Development as needed:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Do not add `sb_secret`, service role, or database password values to Vercel frontend env.

For Windows/IIS self-hosting, put the same values in `C:\jamly\.env.local` and
set `JAMLY_DEPLOYMENT=self-hosted`. See `NEW_VDS_SETUP_WINDOWS.md`.

## 8. Verification

After env and SQL are applied:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Then test:

- create one account
- publish a listing from `/upload`
- browse it from `/marketplace`
- open a listing conversation
- create a service request or beat license order
- confirm dashboard data appears in `/dashboard`
- sign in as an admin account and open `/admin`
- confirm `/api/admin/overview` returns `401` without a bearer token

On the deployed site, open:

```text
https://getjamly.com/api/health
```

Expected live result:

```json
{
  "deployment": "self-hosted",
  "supabase": {
    "status": "ready"
  },
  "build": {
    "status": "current"
  }
}
```

If the result is `schema_missing`, the Project URL and publishable key are
working, but the Jamly SQL schema still needs to be applied.

## Demo Mode Is Intentional

If Supabase values are missing, placeholder, invalid, or unreachable, Jamly falls back to demo data instead of showing broken screens.
