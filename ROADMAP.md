# Jamly Roadmap

This file tracks post-beta hardening and product work that should be queued
after the current pre-register and closed-beta launch gate.

## P0 - Keep Launch Stable

- Extend live smoke tests into a full Playwright suite:
  - anonymous visitor gate on `getjamly.com`
  - pre-register signup, duplicate signup, referral, verification
  - admin login and admin-only route protection
  - buyer marketplace, listing, checkout, sandbox payment, order detail
  - creator dashboard, listing management, upload validation
  - password reset and email delivery
  - mobile viewport pass for public, auth, checkout, admin, and dashboard routes
- Add smoke reports to `work/live-smoke` with screenshots, console errors,
  failed network responses, and saved JSON summaries.
- Keep fake beta actors seeded:
  - one buyer
  - one creator
  - one non-beta user that must be rejected from the main app
  - one admin that can access `/admin`
- Add a release command that runs typecheck, lint, tests, build, live smoke,
  deep audit, and beta product flow in the right order.

## P0 - Data Retention And Cost Control

Goal: keep Supabase Postgres, Supabase Storage, and future R2 usage lean without
destroying user identity, account uniqueness, admin history, financial records,
or legal/audit records.

Default retention:

| Data | Free / standard account | Premium account |
| --- | ---: | ---: |
| Listing analytics events | 30 days | 60 days |
| Search/view/play events | 30 days | 60 days |
| Unread notification rows | 30 days | 60 days |
| Read notification rows | 14 days | 30 days |
| Non-order conversation messages | 30 days | 60 days |
| Draft uploads and orphaned files | 7 days | 14 days |
| Expired waitlist verification tokens | 7 days | 14 days |
| Rate-limit counters | 48 hours | 48 hours |
| Temporary smoke-test accounts/data | 7 days | 7 days |

Never auto-delete:

- `profiles`
- `auth.users`
- admin accounts and admin audit logs
- paid order records, payment records, ledger rows, revenue splits
- reports and moderation resolutions
- purchased license snapshots and entitlement metadata
- creator listing rows that have any order history

Implementation queue:

1. Add `account_plan` / `retention_multiplier` support to profiles or a
   dedicated subscription table.
2. Add `retention_policy_runs` table with run status, counts, and errors.
3. Add SQL functions:
   - `get_retention_cutoff(p_user_id, p_data_type)`
   - `prune_rate_limit_counters()`
   - `prune_waitlist_tokens()`
   - `prune_notifications()`
   - `prune_ephemeral_events()`
   - `prune_orphaned_storage_objects()`
4. Add an admin-only dry-run endpoint:
   - returns rows/files that would be deleted
   - groups by table, bucket, plan, and cutoff
   - never reveals private message body in summary responses
5. Add an admin UI page for retention:
   - dry run
   - execute
   - last run status
   - deleted row/file counts
   - estimated storage reclaimed
6. Schedule the real job daily after smoke checks pass.
7. Add tests proving profiles, paid orders, admin audit rows, and unique handles
   survive pruning.

Important rule: profile identity must remain. A user can lose old ephemeral
messages/events, but their handle, account, badges, admin status, payment
history, and purchase entitlements must remain intact.

## P1 - Admin Panel

- Add pre-register overview:
  - total signups
  - verified signups
  - referral leaders
  - source / UTM breakdown
  - badge/tier distribution
  - export CSV with rate limit
- Add user control actions:
  - grant/revoke beta access
  - grant/revoke admin role
  - deactivate account
  - view user activity summary
  - inspect retention eligibility without reading private content
- Improve moderation queues:
  - report severity lanes
  - action notes
  - status filters
  - audit log deep link from every destructive/admin action
- Add health dashboard:
  - Supabase status
  - SMTP status
  - storage bucket status
  - latest smoke result
  - current build SHA and stale build status

## P1 - Profile And Dashboard Product Quality

- Upgrade profile editor:
  - avatar/cover crop
  - location, languages, DAW, instruments, genres
  - pinned works
  - social link preview validation
  - profile strength checklist
- Upgrade creator dashboard:
  - listing quality warnings
  - missing deliverable warnings
  - price/tier consistency checks
  - draft listing state
  - performance summary
- Upgrade buyer dashboard:
  - saved listings
  - active orders
  - recently viewed creators
  - recommended next actions
- Add empty states that are actionable but not marketing-heavy.

## P1 - Sandbox Payments Until Stripe

- Keep the sandbox card UI polished and explicit that no real charge happens.
- Add payment scenario controls for admins/dev:
  - approve
  - fail
  - expired
  - refund simulation
- Add smoke coverage for each scenario.
- Keep real provider boundary isolated behind `PaymentProvider`.
- Stripe remains the final missing live-payment integration before real paid
  purchases can be advertised.

## P2 - Mini Games / Engagement

- Add small pre-register engagement loops that create useful intent data:
  - choose-your-role onboarding quiz
  - beat/license knowledge mini quiz
  - creator readiness checklist
  - referral milestone unlocks
- Rewards must map to real pre-register benefits:
  - early badge
  - beta priority
  - creator profile review priority
  - launch email segment
- Avoid adding games that store noisy data forever. Mini-game events should be
  retention-managed unless they grant a permanent badge or benefit.

## P2 - Supabase Ops Tooling

- Keep local scripts for:
  - schema/migration apply
  - schema drift check
  - RLS smoke checks
  - storage bucket policy checks
  - fake actor seed/reset
  - retention dry-run and execution
- Add generated DB summary to smoke output:
  - table counts
  - bucket object counts
  - recent error counts
  - newest migration applied
- If a Supabase management plugin becomes available, use it for read-only
  inspection first; writes should still go through versioned SQL migrations.

## P2 - Backend / Frontend Hardening

- Add Playwright traces for failed smoke runs.
- Add API-level tests for admin endpoints and payment endpoints.
- Add RLS negative tests with separate buyer, creator, admin, and anonymous
  sessions.
- Add accessibility checks to the smoke suite for auth, pre-register, checkout,
  and admin pages.
- Add visual regression screenshots for mobile and desktop launch-critical
  routes.

## P3 - Nice-To-Have Product Expansion

- Better marketplace sorting and saved searches.
- Creator verification workflow.
- Messaging attachments with retention-aware storage.
- Notification preferences.
- Public creator profile SEO once beta gate opens.
- R2 migration/dual-write plan if Supabase Storage cost or limits become a
  bottleneck.
