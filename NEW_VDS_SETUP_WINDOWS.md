# Jamly Windows IIS + Supabase Deployment Runbook

Target: `getjamly.com` and `www.getjamly.com` on a Windows Server 2022 VDS.

This guide moves Jamly from localhost/demo mode to a self-hosted production
shape:

- IIS owns ports `80` and `443`.
- IIS URL Rewrite + ARR reverse proxy all app traffic to Next.js on
  `127.0.0.1:3000`.
- NSSM keeps the Next.js Node process alive as a Windows service.
- Supabase hosts Auth, Postgres, Realtime, and Storage.

Do not commit `.env.local`, Supabase service-role keys, database URLs, payment
secrets, or temporary gate passwords.

## 0. Known Draft Fixes

The older handoff note mixed real deployment steps with patch files, test
paths, and private passwords. For this repo state:

- Use `C:\jamly` as the server checkout path.
- Do not use `C:\jamly-handoff`, `0001-*.patch`, `DEPLOY_IIS.md`, or iisnode.
- Do not set `STAGING_AUTH_USERS`; this branch does not read that variable.
- Use Node.js `24.x`, matching `package.json`.
- Treat `supabase/schema.sql` as the base schema only. It is not enough for
  launch without the post-schema migrations below.

## 1. Human Inputs

Have these ready before the final cutover:

- VDS administrator access.
- GitHub access that can clone `koraykurt19/JAMLY`.
- Supabase Project URL and anon/publishable key.
- Supabase database connection string or dashboard SQL Editor access.
- A long random `RATE_LIMIT_SALT`.
- DNS panel access for `getjamly.com` and `www.getjamly.com`.

Optional, only when exercising payment settlement or sandbox completion:

- `SUPABASE_SERVICE_ROLE_KEY`.
- `PAYMENT_WEBHOOK_SECRET`.

Payments and email delivery are not live in this codebase yet. Orders stay
`unpaid` unless a payment provider is implemented, and verification emails are
queued in `email_outbox` until a mail provider drains it.

## 2. DNS

Before requesting a certificate, point both names to the VDS public IP:

```powershell
nslookup getjamly.com
nslookup www.getjamly.com
```

Both must return the new VDS IP. Do not request Let's Encrypt certificates
while DNS still points elsewhere.

## 3. Windows Prerequisites

Run PowerShell as Administrator.

```powershell
$ErrorActionPreference = "Stop"

Install-WindowsFeature Web-Server, Web-Mgmt-Tools, Web-WebSockets, `
  Web-Static-Content, Web-Default-Doc, Web-Http-Errors, Web-Http-Logging, `
  Web-Request-Monitor, Web-Filtering

New-NetFirewallRule -DisplayName "Jamly HTTP" -Direction Inbound `
  -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Jamly HTTPS" -Direction Inbound `
  -Protocol TCP -LocalPort 443 -Action Allow
```

Install these from their official sources:

- Git for Windows
- Node.js `24.x`
- IIS URL Rewrite
- IIS Application Request Routing
- NSSM
- win-acme

Then verify:

```powershell
git --version
node -v
npm -v
```

`node -v` must start with `v24.`.

## 4. Clone And Build

```powershell
git clone https://github.com/koraykurt19/JAMLY.git C:\jamly
Set-Location C:\jamly
git checkout main
npm ci
```

Create `C:\jamly\.env.local` directly on the server:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://getjamly.com
JAMLY_DEPLOYMENT=self-hosted
RATE_LIMIT_SALT=REPLACE_WITH_LONG_RANDOM_VALUE

SUPABASE_SERVICE_ROLE_KEY=
PAYMENT_PROVIDER=sandbox
SANDBOX_PAYMENTS_ENABLED=false
PAYMENT_WEBHOOK_SECRET=REPLACE_WITH_LONG_RANDOM_VALUE

EMAIL_FROM_ADDRESS=noreply@getjamly.com
EMAIL_REPLY_TO_ADDRESS=support@getjamly.com
```

Generate random values in PowerShell when needed:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Build after `.env.local` exists. `NEXT_PUBLIC_*` values and the Supabase host
used in CSP/image rules are build-time inputs, so restart alone is not enough
after changing them.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

After build, confirm the Supabase session refresh proxy compiled. Next 16 may
leave `middleware-manifest.json` empty in this build mode, so use the compiled
server file for this low-level check:

```powershell
if (-not (Select-String -Path .next\server\middleware.js -Pattern '/src/proxy' -Quiet)) {
  throw "Next Proxy did not compile"
}
```

## 5. Supabase Schema

For the first production setup, the safest path is Supabase SQL Editor, one
file at a time. The repository scripts also work, but the SQL Editor makes the
exact order and errors visible during the first launch.

### Fresh Supabase Project

Run `supabase/schema.sql` first, then run these post-schema migrations in this
exact order:

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

This order is not alphabetical. `badges` needs `waitlist_entries` and
`payment_status`; `email_outbox` and `payments` need `admin_has`; the
`20260815` migration patches the payment settlement function created by
`20260813_payments`.

### Older Jamly Database

If the database predates the current `schema.sql`, apply every missing
migration in this dependency order:

```text
20260629_add_conversations.sql
20260707_add_beat_license_tiers.sql
20260712_unify_account_capabilities.sql
20260715_username_policy.sql
20260731_protect_founder_headline.sql
20260801_ensure_listing_storage.sql
20260809_admin_and_platform_config.sql
20260811_add_collaboration_workspace.sql
20260811_add_collaboration_revenue.sql
20260811_add_profile_follows.sql
20260811_tighten_collaboration_rls.sql
20260813_security_hardening.sql
20260813_rate_limiting.sql
20260813_waitlist.sql
20260813_badges.sql
20260813_admin_rbac_audit.sql
20260813_email_outbox.sql
20260813_payments.sql
20260815_validate_payment_amount.sql
```

`20260811_add_collaboration_workspace.sql` must run before
`20260811_add_collaboration_revenue.sql`, because revenue splits reference the
collaboration tables.

### Script Option

If you choose the repo scripts instead of SQL Editor, set the database URL only
for the current shell:

```powershell
$env:SUPABASE_DATABASE_URL = "postgresql://postgres.PROJECT_REF:PASSWORD@HOST:5432/postgres?sslmode=require"
npm run supabase:apply-schema
npm run supabase:apply-migration -- 20260813_security_hardening.sql
Remove-Item Env:\SUPABASE_DATABASE_URL
```

Repeat the migration command for each post-schema migration above.

Verify from `C:\jamly`:

```powershell
npm run supabase:check
```

Expected:

```json
{
  "ok": true,
  "auth": "ready",
  "database": "ready",
  "storage": "ready"
}
```

## 6. Supabase Auth Settings

In Supabase Dashboard:

```text
Authentication -> URL Configuration
```

Set:

```text
Site URL:
https://getjamly.com

Redirect URLs:
https://getjamly.com/auth/reset-password
https://www.getjamly.com/auth/reset-password
https://getjamly.com/early-access/verify
https://www.getjamly.com/early-access/verify
```

Also set the password minimum to at least 8 characters.

## 7. Local Node Service

Create the log folder:

```powershell
New-Item -ItemType Directory -Force C:\jamly\logs
```

Install the service with NSSM. Adjust the NSSM path if you extracted it
elsewhere.

```powershell
C:\tools\nssm\nssm.exe install Jamly "C:\Program Files\nodejs\npm.cmd"
C:\tools\nssm\nssm.exe set Jamly AppDirectory C:\jamly
C:\tools\nssm\nssm.exe set Jamly AppParameters "run start"
C:\tools\nssm\nssm.exe set Jamly AppEnvironmentExtra NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
C:\tools\nssm\nssm.exe set Jamly AppStdout C:\jamly\logs\jamly.out.log
C:\tools\nssm\nssm.exe set Jamly AppStderr C:\jamly\logs\jamly.err.log
C:\tools\nssm\nssm.exe set Jamly AppRotateFiles 1
C:\tools\nssm\nssm.exe set Jamly AppRotateBytes 10485760
C:\tools\nssm\nssm.exe set Jamly AppRestartDelay 5000
C:\tools\nssm\nssm.exe start Jamly
```

Verify before touching IIS:

```powershell
Get-Service Jamly
curl.exe -s http://127.0.0.1:3000/api/health
```

At this point the health JSON should include:

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

If `build.status` is `stale`, the repo was updated after the last build. Run
`npm run build` and restart the service.

## 8. Retention Cleanup

Jamly keeps durable identity and financial records, but prunes operational rows
that do not need to live forever. The cleanup is implemented in Supabase as
`admin_retention_plan` and can be run from the admin console or from the VDS.

Dry-run first:

```powershell
Set-Location C:\jamly
npm run retention:dry-run
```

The JSON output must include:

```json
{
  "mode": "dry_run",
  "protectsProfiles": true
}
```

Execute only when the dry-run counts look sane:

```powershell
Set-Location C:\jamly
npm run retention:execute
```

Reports are written under `C:\jamly\work\retention-runs\`. That folder is
ignored by Git and may be rotated separately.

Live smoke tests also write screenshots and JSON reports under
`C:\jamly\work\live-smoke\`. Inspect local artifact cleanup with:

```powershell
npm run smoke:prune-artifacts
```

Execute when the dry-run looks sane:

```powershell
npm run smoke:prune-artifacts:execute
```

Defaults keep the last 7 days and cap retained artifacts at 256 MB. Override
per shell when needed:

```powershell
$env:SMOKE_ARTIFACT_KEEP_DAYS = "14"
$env:SMOKE_ARTIFACT_MAX_MB = "512"
npm run smoke:prune-artifacts
```

To run it nightly with Windows Task Scheduler:

```powershell
$action = New-ScheduledTaskAction -Execute "C:\Program Files\nodejs\npm.cmd" `
  -Argument "run retention:execute" -WorkingDirectory "C:\jamly"
$trigger = New-ScheduledTaskTrigger -Daily -At 03:35
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
Register-ScheduledTask -TaskName "Jamly Retention Cleanup" `
  -Action $action -Trigger $trigger -Principal $principal
```

Use `npm run retention:dry-run` manually after schema changes or before a
launch window. The runner never deletes `profiles`, `auth.users`,
`admin_accounts`, `admin_audit_log`, `order_requests`, `payments`,
`ledger_entries`, `revenue_splits`, `reports`, or paid license snapshots.

## 9. IIS Reverse Proxy

Enable ARR proxying and allow the forwarded headers used by the rewrite rule:

```powershell
Import-Module WebAdministration

Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
  -Filter "system.webServer/proxy" -Name enabled -Value True
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
  -Filter "system.webServer/proxy" -Name preserveHostHeader -Value True

$allowed = @("HTTP_X_FORWARDED_PROTO", "HTTP_X_FORWARDED_HOST", "HTTP_X_FORWARDED_FOR")
foreach ($name in $allowed) {
  if (-not (Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/rewrite/allowedServerVariables/add[@name='$name']" `
    -Name name -ErrorAction SilentlyContinue)) {
    Add-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
      -Filter "system.webServer/rewrite/allowedServerVariables" `
      -Name "." -Value @{name=$name}
  }
}
```

Create the proxy site:

```powershell
New-Item -ItemType Directory -Force C:\inetpub\jamly-proxy

if (Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue) {
  Stop-Website -Name "Default Web Site"
}

New-WebAppPool -Name jamly
Set-ItemProperty IIS:\AppPools\jamly -Name managedRuntimeVersion -Value ""
New-Website -Name jamly -PhysicalPath C:\inetpub\jamly-proxy `
  -Port 80 -HostHeader getjamly.com -ApplicationPool jamly
New-WebBinding -Name jamly -Protocol http -Port 80 -HostHeader www.getjamly.com
```

Create `C:\inetpub\jamly-proxy\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ACME challenge passthrough" stopProcessing="true">
          <match url="^\.well-known/acme-challenge/.*" />
          <action type="None" />
        </rule>
        <rule name="Force HTTPS" enabled="false" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
            <add input="{REQUEST_URI}" pattern="^/\.well-known/acme-challenge/" negate="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
        <rule name="Jamly reverse proxy" stopProcessing="true">
          <match url="(.*)" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
            <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
          </serverVariables>
          <action type="Rewrite" url="http://127.0.0.1:3000/{R:1}" appendQueryString="true" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

Test the proxy before requesting a certificate:

```powershell
curl.exe -I -H "Host: getjamly.com" http://127.0.0.1/
curl.exe -s -H "Host: getjamly.com" http://127.0.0.1/api/health
```

Common results:

- `200` or `3xx`: IIS is reaching Node.
- `404`: ARR proxy or rewrite rule is not active.
- `500` or `500.50`: forwarded server variables are not allowed.
- `502`: the Jamly service is not listening on `127.0.0.1:3000`.

## 10. Certificate

Use win-acme after DNS and the HTTP proxy test are correct.

Recommended path:

1. Run `C:\tools\win-acme\wacs.exe` as Administrator.
2. Create a new certificate from IIS bindings for the `jamly` site.
3. Include both `getjamly.com` and `www.getjamly.com` in one certificate.
4. Use HTTP-01 validation through IIS.
5. Let win-acme install the certificate into IIS and create the renewal task.

After the certificate is installed, enable the HTTPS redirect rule in
`C:\inetpub\jamly-proxy\web.config` by changing:

```xml
<rule name="Force HTTPS" enabled="false" stopProcessing="true">
```

to:

```xml
<rule name="Force HTTPS" enabled="true" stopProcessing="true">
```

Then restart IIS:

```powershell
iisreset
```

Check bindings:

```powershell
Get-WebBinding -Name jamly
```

You must see HTTP bindings for both hostnames and HTTPS bindings for both
hostnames.

Run win-acme's renewal test from its menu before calling the launch complete.
If the renewal test does not update or validate the IIS bindings, fix it now;
certificate renewal failures usually show up weeks later.

## 11. Final Smoke Test

Run from the VDS:

```powershell
curl.exe -s https://getjamly.com/api/health
curl.exe -I https://getjamly.com/
curl.exe -I https://www.getjamly.com/
```

Required health result:

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

Manual browser checks:

| Check | Expected |
| --- | --- |
| `/` | Marketplace/home renders |
| `/early-access` | Form renders and counter is not fake demo data |
| `/api/health` | `supabase.status` is `ready` |
| `/auth/sign-up` | Supabase auth flow opens |
| `/upload` while signed out | Sign-in prompt |
| `/admin` as non-admin | Redirect away |
| `curl.exe -I https://getjamly.com/` | CSP header exists and has no `unsafe-eval` |

## 12. Update Flow

For future deploys:

```powershell
Set-Location C:\jamly
git pull --ff-only
npm ci
npm run typecheck
npm run lint
npm test
npm run build
C:\tools\nssm\nssm.exe restart Jamly
curl.exe -s https://getjamly.com/api/health
npm run retention:dry-run
npm run smoke:beta-gate
npm run smoke:prune-artifacts
```

If `.env.local`, `NEXT_PUBLIC_SUPABASE_URL`, or `NEXT_PUBLIC_SITE_URL` changes,
always rebuild before restarting.

## 13. Rollback

App rollback:

```powershell
Set-Location C:\jamly
git log --oneline -5
git checkout <known-good-commit>
npm ci
npm run build
C:\tools\nssm\nssm.exe restart Jamly
```

Database rollback is not automatic. The listed migrations are additive and
mostly idempotent, but security/payment migrations change RPC signatures and
RLS policies. Do not roll the app back across those database changes unless you
have checked the affected RPCs manually.
