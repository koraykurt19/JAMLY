# Admin guide

Operational reference for the Jamly admin console at `/admin`.

## Access

`/admin` is guarded server-side. Non-admins are redirected; signed-out visitors
go to sign-in. Every API route re-checks the caller's capability, and the
database re-checks again inside each RPC. Hiding a menu item is a convenience,
never the protection.

### Roles and capabilities

| Capability | super_admin | admin | moderator | support | finance | content_reviewer | analyst |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| `admin.manage` | ● | | | | | | |
| `user.view` | ● | ● | ● | ● | ● | ● | ● |
| `user.moderate` | ● | ● | ● | | | | |
| `listing.moderate` | ● | ● | ● | | | ● | |
| `order.manage` | ● | ● | | ● | ● | | |
| `finance.view` | ● | ● | | | ● | | ● |
| `finance.manage` | ● | | | | ● | | |
| `report.resolve` | ● | ● | ● | ● | | ● | |
| `badge.manage` | ● | ● | | | | | |
| `waitlist.manage` | ● | ● | | | | | |
| `config.manage` | ● | ● | | | | | |
| `audit.view` | ● | ● | ● | | ● | | ● |
| `support.manage` | ● | ● | | ● | | | |

Only a super admin can grant or change admin roles.

### Granting admin access

There is no self-service path. Either use `admin_set_admin_role()` as an
existing super admin, or run SQL directly:

```sql
insert into public.admin_accounts (user_id, role)
select id, 'moderator' from public.profiles where handle = '<handle>'
on conflict (user_id) do update set role = 'moderator', is_active = true;
```

Safety rails you cannot override:

- You cannot change your own role or your own account status.
- The last active super admin cannot be demoted or restricted.
- Suspending an admin's *profile* removes their admin access immediately —
  `is_admin()` joins on `account_status = 'active'`.

## Sections

### Overview (`/admin`)

Users, waitlist, listings, orders, GMV, moderation queue depth and admin count.
All figures come from real queries — nothing is mocked. GMV counts only orders
with `payment_status = 'paid'`.

### Waitlist (`/admin/waitlist`)

Search by email, name or reserved username; filter by status; filter to flagged
entries only. Shows queue position, persona, referral count, UTM source and
risk flags.

`risk_flags` currently carries `disposable_email` — recorded, never enforced.
A human decides.

Statuses: `pending` (signed up, not verified) → `verified` → `invited` →
`converted`. `suppressed` is opted out; `blocked` is excluded from the public
counter entirely.

### Reports (`/admin/reports`)

Sorted urgent-first then oldest-first, so the queue surfaces what is aging.
Harassment and fraud arrive as `urgent`; copyright, stolen content and
impersonation as `high`.

Resolving to `resolved` or `dismissed` requires a written note. Record what you
actually did in "action taken" — that is what a future moderator will read.
Reporters can see their own report's status but never internal notes.

### Badges (`/admin/badges`)

Automatic badges are rule-driven and cannot be granted by hand. Only badges
defined as `manual` appear in the grant dialog.

**Verification badges mean verification actually happened.** Granting
`verified_creator` to someone you have not verified makes every verification
badge on the platform worthless.

Non-revocable badges (`founding_member`, `first_sale`, `first_100`) are
permanent by design — they record a historical fact. Revoking requires a
reason and is audited.

### Audit log (`/admin/audit`)

Read-only and immutable. Filter by action. Shows actor role, action, target,
before → after diff and reason.

Rows can only be written by `record_admin_action()`; a trigger rejects any
`UPDATE` or `DELETE`. No admin, including super admins, can edit or erase
history through the API.

Audited: role changes, account status changes, listing moderation, badge
grant/revoke, report resolutions.

## Moderation playbook

**Suspend vs ban.** `suspended` is reversible and appropriate for
investigation. `banned` is the end state. Both require a reason. Neither
deletes content.

**Listing takedown.** `admin_set_listing_state(listing_id, false, reason)`
deactivates without deleting, so orders and history survive. Note that a
listing whose exclusive tier has sold cannot be reactivated — a CHECK
constraint enforces it. If an exclusive sale was refunded, use
`admin_release_exclusive()` first.

**Copyright.** Take down first, then contact the seller. The order history and
license snapshot survive a takedown, so you can still see exactly what any
buyer purchased.

**Refunds.** Not available in the console yet. Refunds run through
`record_payment_refund()` in SQL and require a live payment provider.

## Things that will surprise you

- **The admin API takes a bearer token, not a cookie.** You cannot exercise
  `/api/admin/*` by pasting a URL in the browser; the console attaches the
  token.
- **Suspending an admin removes their admin rights**, because `is_admin()`
  requires an active profile.
- **`GET /api/admin/*` is paginated at 50 rows.** Older records need the pager,
  not a bigger limit.
- **Nothing emails anyone.** No provider is configured; `email_outbox` fills up
  and stays there. Waitlist verification links must be sent by hand until a
  provider is implemented.
- **Payments are sandboxed.** Orders exist and can be tracked, but no money
  moves and no deliverable is released, because release requires
  `payment_status = 'paid'`.
