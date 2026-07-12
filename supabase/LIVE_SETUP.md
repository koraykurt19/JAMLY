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

If the Supabase project is empty, run this file once in SQL Editor:

```text
supabase/schema.sql
```

It creates tables, indexes, RLS policies, triggers, storage buckets, Realtime setup, and the unified account model.

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
```

The last migration removes strict buyer/creator role gates. Jamly keeps the legacy `profile_role` enum only for compatibility, while the product now behaves as one account that can buy, sell, message, and publish.

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

## 6. Storage Buckets

The SQL creates these buckets:

```text
listing-covers          public
audio-previews          public
license-deliverables    private
```

If a bucket already exists, the SQL safely keeps it.

## 7. Vercel Environment

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

## 8. Verification

After env and SQL are applied:

```bash
npm run typecheck
npm run lint
npm run build
```

Then test:

- create one account
- publish a listing from `/upload`
- browse it from `/marketplace`
- open a listing conversation
- create a service request or beat license order
- confirm dashboard data appears in `/dashboard`

On Vercel, open:

```text
https://your-vercel-project.vercel.app/api/health
```

Expected live result:

```json
{
  "deployment": "vercel",
  "supabase": {
    "status": "ready"
  }
}
```

If the result is `schema_missing`, the Project URL and publishable key are
working, but the Jamly SQL schema still needs to be applied.

## Demo Mode Is Intentional

If Supabase values are missing, placeholder, invalid, or unreachable, Jamly falls back to demo data instead of showing broken screens.
