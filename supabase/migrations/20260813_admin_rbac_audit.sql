-- Jamly admin RBAC, audit log, and moderation surface.
--
-- Before this migration `admin_accounts` was a binary flag: every admin could
-- do everything, including banning every other admin and themselves, with no
-- record of who did it. This introduces roles, protects the last super admin,
-- and makes every sensitive action append an immutable audit row.
--
-- Idempotent: safe to re-run.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum (
      'super_admin',
      'admin',
      'moderator',
      'support',
      'finance',
      'content_reviewer',
      'analyst'
    );
  end if;
end
$$;

alter table public.admin_accounts
  add column if not exists role public.admin_role not null default 'admin',
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- The bootstrap account becomes the first super admin.
update public.admin_accounts
set role = 'super_admin'
where role = 'admin'
  and user_id in (
    select id from public.profiles
    where handle in ('koray', 'jamly')
       or id = (select user_id from public.admin_accounts order by created_at limit 1)
  );

-- ---------------------------------------------------------------------------
-- Capability model
-- ---------------------------------------------------------------------------
--
-- One place that answers "may this role do this thing". Policies and RPCs call
-- it; the UI mirrors it but never decides.

create or replace function public.admin_capabilities(p_role public.admin_role)
returns text[]
language sql
immutable
as $$
  select case p_role
    when 'super_admin' then array[
      'admin.manage', 'user.moderate', 'user.view', 'listing.moderate',
      'order.manage', 'finance.view', 'finance.manage', 'report.resolve',
      'badge.manage', 'waitlist.manage', 'config.manage', 'audit.view',
      'support.manage'
    ]
    when 'admin' then array[
      'user.moderate', 'user.view', 'listing.moderate', 'order.manage',
      'finance.view', 'report.resolve', 'badge.manage', 'waitlist.manage',
      'config.manage', 'audit.view', 'support.manage'
    ]
    when 'moderator' then array[
      'user.view', 'user.moderate', 'listing.moderate', 'report.resolve', 'audit.view'
    ]
    when 'support' then array[
      'user.view', 'order.manage', 'support.manage', 'report.resolve'
    ]
    when 'finance' then array[
      'user.view', 'finance.view', 'finance.manage', 'order.manage', 'audit.view'
    ]
    when 'content_reviewer' then array[
      'user.view', 'listing.moderate', 'report.resolve'
    ]
    when 'analyst' then array['user.view', 'finance.view', 'audit.view']
    else array[]::text[]
  end;
$$;

create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select a.role
  from public.admin_accounts a
  join public.profiles p on p.id = a.user_id
  where a.user_id = auth.uid()
    and a.is_active
    and p.account_status = 'active';
$$;

revoke all on function public.current_admin_role() from public;
grant execute on function public.current_admin_role() to authenticated;

create or replace function public.admin_has(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    p_capability = any (public.admin_capabilities(public.current_admin_role())),
    false
  );
$$;

revoke all on function public.admin_has(text) from public;
grant execute on function public.admin_has(text) to authenticated;

-- Keep is_admin working, but respect the new is_active flag.
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_accounts
    join public.profiles on profiles.id = admin_accounts.user_id
    where admin_accounts.user_id = p_user_id
      and admin_accounts.is_active
      and profiles.account_status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Audit log — append only
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_log (
  id bigint primary key generated always as identity,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.admin_role,
  action text not null check (char_length(action) between 3 and 80),
  target_type text not null check (char_length(target_type) between 2 and 40),
  target_id text,
  before_summary jsonb,
  after_summary jsonb,
  reason text,
  result text not null default 'success' check (result in ('success', 'failure')),
  correlation_id uuid,
  -- Coarse context only: never a raw IP, never a full user agent.
  ip_prefix text,
  user_agent_family text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log (actor_id, created_at desc);
create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_type, target_id, created_at desc);
create index if not exists admin_audit_log_action_idx
  on public.admin_audit_log (action, created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Audit readers can read the log" on public.admin_audit_log;
create policy "Audit readers can read the log"
  on public.admin_audit_log for select
  using (public.admin_has('audit.view'));

-- Deliberately no INSERT/UPDATE/DELETE policy: rows are written only by the
-- security-definer recorder below, and can never be edited or deleted through
-- the API by anyone, including super admins.

create or replace function public.block_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'The admin audit log is append-only' using errcode = '42501';
end;
$$;

drop trigger if exists block_audit_update on public.admin_audit_log;
create trigger block_audit_update
  before update or delete on public.admin_audit_log
  for each row execute function public.block_audit_mutation();

create or replace function public.record_admin_action(
  p_action text,
  p_target_type text,
  p_target_id text default null,
  p_before jsonb default null,
  p_after jsonb default null,
  p_reason text default null,
  p_result text default 'success',
  p_correlation_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  insert into public.admin_audit_log (
    actor_id, actor_role, action, target_type, target_id,
    before_summary, after_summary, reason, result, correlation_id
  )
  values (
    auth.uid(), public.current_admin_role(), p_action, p_target_type, p_target_id,
    p_before, p_after, p_reason, coalesce(p_result, 'success'), p_correlation_id
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.record_admin_action(text, text, text, jsonb, jsonb, text, text, uuid) from public;
grant execute on function public.record_admin_action(text, text, text, jsonb, jsonb, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Moderation actions, now audited and guarded
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_profile_status(
  p_profile_id uuid,
  p_status public.account_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous public.account_status;
  target_is_admin boolean;
  remaining_super integer;
begin
  if not public.admin_has('user.moderate') then
    raise exception 'You do not have permission to moderate accounts' using errcode = '42501';
  end if;

  if p_profile_id = auth.uid() then
    raise exception 'You cannot change your own account status' using errcode = '42501';
  end if;

  select account_status into previous from public.profiles where id = p_profile_id;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.admin_accounts
    where user_id = p_profile_id and is_active and role = 'super_admin'
  ) into target_is_admin;

  -- Never let the platform lock itself out.
  if target_is_admin and p_status <> 'active' then
    select count(*) into remaining_super
    from public.admin_accounts a
    join public.profiles p on p.id = a.user_id
    where a.is_active and a.role = 'super_admin' and p.account_status = 'active';

    if remaining_super <= 1 then
      raise exception 'Cannot restrict the last active super admin' using errcode = '42501';
    end if;
  end if;

  -- Restricting an account requires a written reason.
  if p_status <> 'active' and (p_reason is null or length(trim(p_reason)) < 3) then
    raise exception 'A reason is required to restrict an account' using errcode = '22023';
  end if;

  update public.profiles set account_status = p_status where id = p_profile_id;

  perform public.record_admin_action(
    'user.status_change', 'profile', p_profile_id::text,
    jsonb_build_object('account_status', previous),
    jsonb_build_object('account_status', p_status),
    p_reason
  );
end;
$$;

revoke all on function public.admin_set_profile_status(uuid, public.account_status, text) from public;
grant execute on function public.admin_set_profile_status(uuid, public.account_status, text) to authenticated;

create or replace function public.admin_set_listing_state(
  p_listing_id uuid,
  p_is_active boolean,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous boolean;
begin
  if not public.admin_has('listing.moderate') then
    raise exception 'You do not have permission to moderate listings' using errcode = '42501';
  end if;

  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A moderation reason is required' using errcode = '22023';
  end if;

  select is_active into previous from public.listings where id = p_listing_id;
  if not found then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;

  update public.listings set is_active = p_is_active where id = p_listing_id;

  perform public.record_admin_action(
    case when p_is_active then 'listing.restore' else 'listing.suspend' end,
    'listing', p_listing_id::text,
    jsonb_build_object('is_active', previous),
    jsonb_build_object('is_active', p_is_active),
    p_reason
  );
end;
$$;

revoke all on function public.admin_set_listing_state(uuid, boolean, text) from public;
grant execute on function public.admin_set_listing_state(uuid, boolean, text) to authenticated;

-- Admin grant/revoke, previously only possible by hand-written SQL.
create or replace function public.admin_set_admin_role(
  p_profile_id uuid,
  p_role public.admin_role,
  p_is_active boolean default true,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_role public.admin_role;
  remaining_super integer;
begin
  if not public.admin_has('admin.manage') then
    raise exception 'Only a super admin can manage admin accounts' using errcode = '42501';
  end if;

  if p_profile_id = auth.uid() then
    raise exception 'You cannot change your own admin role' using errcode = '42501';
  end if;

  select role into previous_role from public.admin_accounts where user_id = p_profile_id;

  if previous_role = 'super_admin' and (p_role <> 'super_admin' or not p_is_active) then
    select count(*) into remaining_super
    from public.admin_accounts a
    join public.profiles p on p.id = a.user_id
    where a.is_active and a.role = 'super_admin' and p.account_status = 'active';

    if remaining_super <= 1 then
      raise exception 'Cannot remove the last active super admin' using errcode = '42501';
    end if;
  end if;

  insert into public.admin_accounts (user_id, role, is_active, created_by)
  values (p_profile_id, p_role, p_is_active, auth.uid())
  on conflict (user_id) do update set
    role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now();

  perform public.record_admin_action(
    'admin.role_change', 'profile', p_profile_id::text,
    jsonb_build_object('role', previous_role),
    jsonb_build_object('role', p_role, 'is_active', p_is_active),
    p_reason
  );
end;
$$;

revoke all on function public.admin_set_admin_role(uuid, public.admin_role, boolean, text) from public;
grant execute on function public.admin_set_admin_role(uuid, public.admin_role, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Reports — the table existed with zero surface; give it a real workflow
-- ---------------------------------------------------------------------------

-- Existing columns are `reported_by` and `reason`; this adds the workflow
-- fields around them rather than renaming and breaking the insert policy.
alter table public.reports
  add column if not exists category text not null default 'other'
    check (category in (
      'copyright', 'stolen_content', 'spam', 'harassment',
      'fraud', 'explicit', 'impersonation', 'other'
    )),
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists internal_notes text,
  add column if not exists resolution text,
  add column if not exists resolution_action text,
  add column if not exists evidence_urls text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reports_target_type_extended'
  ) then
    -- The original CHECK is unnamed; find and drop it before widening.
    execute (
      select coalesce(
        'alter table public.reports drop constraint ' || quote_ident(conname),
        'select 1'
      )
      from pg_constraint
      where conrelid = 'public.reports'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) like '%target_type%'
      limit 1
    );

    alter table public.reports
      add constraint reports_target_type_extended check (
        target_type in ('user', 'listing', 'review', 'message', 'order', 'profile')
      );
  end if;
end
$$;

create index if not exists reports_status_priority_idx
  on public.reports (status, priority, created_at desc);
create index if not exists reports_reporter_idx on public.reports (reported_by, created_at desc);

-- Reporters may follow their own report's status, but never internal notes.
create or replace view public.my_reports as
  select id, target_type, target_id, category, status, created_at, resolved_at
  from public.reports
  where reported_by = auth.uid();

grant select on public.my_reports to authenticated;

-- Replaces the admin-only select policy so a reporter can track their report.
drop policy if exists "Admins can read reports" on public.reports;
drop policy if exists "Reporters can read their own reports" on public.reports;
create policy "Reporters can read their own reports"
  on public.reports for select
  using (auth.uid() = reported_by or public.admin_has('report.resolve'));

create or replace function public.resolve_report(
  p_report_id uuid,
  p_status text,
  p_resolution text default null,
  p_resolution_action text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous record;
begin
  if not public.admin_has('report.resolve') then
    raise exception 'You do not have permission to resolve reports' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'reviewing', 'resolved', 'dismissed') then
    raise exception 'Unknown report status' using errcode = '22023';
  end if;

  if p_status in ('resolved', 'dismissed')
     and (p_resolution is null or length(trim(p_resolution)) < 3) then
    raise exception 'A resolution note is required' using errcode = '22023';
  end if;

  select status, resolution into previous from public.reports where id = p_report_id;
  if not found then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;

  update public.reports
  set status = p_status,
      resolution = coalesce(p_resolution, resolution),
      resolution_action = coalesce(p_resolution_action, resolution_action),
      resolved_at = case when p_status in ('resolved', 'dismissed') then now() else null end,
      updated_at = now()
  where id = p_report_id;

  perform public.record_admin_action(
    'report.' || p_status, 'report', p_report_id::text,
    jsonb_build_object('status', previous.status),
    jsonb_build_object('status', p_status, 'action', p_resolution_action),
    p_resolution
  );
end;
$$;

revoke all on function public.resolve_report(uuid, text, text, text) from public;
grant execute on function public.resolve_report(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Support tickets — minimum viable operations desk
-- ---------------------------------------------------------------------------

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in (
    'account', 'payment', 'order', 'listing', 'abuse', 'technical', 'other'
  )),
  subject text not null check (char_length(trim(subject)) between 3 and 140),
  body text not null check (char_length(trim(body)) between 10 and 4000),
  order_id uuid references public.order_requests(id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'pending_user', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references public.profiles(id) on delete set null,
  internal_notes text,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status, priority, created_at desc);
create index if not exists support_tickets_requester_idx
  on public.support_tickets (requester_id, created_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "Requesters read their tickets" on public.support_tickets;
create policy "Requesters read their tickets"
  on public.support_tickets for select
  using (auth.uid() = requester_id or public.admin_has('support.manage'));

drop policy if exists "Members open tickets" on public.support_tickets;
create policy "Members open tickets"
  on public.support_tickets for insert
  to authenticated
  with check (auth.uid() = requester_id);

drop policy if exists "Support staff manage tickets" on public.support_tickets;
create policy "Support staff manage tickets"
  on public.support_tickets for update
  using (public.admin_has('support.manage'))
  with check (public.admin_has('support.manage'));

-- Requesters must not see or write internal fields.
create or replace view public.my_support_tickets as
  select id, category, subject, body, order_id, status, priority, resolution,
         created_at, updated_at
  from public.support_tickets
  where requester_id = auth.uid();

grant select on public.my_support_tickets to authenticated;

-- ---------------------------------------------------------------------------
-- Extended overview for the operations dashboard
-- ---------------------------------------------------------------------------

create or replace function public.get_admin_overview_v2()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.admin_has('user.view') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users', jsonb_build_object(
      'total', (select count(*) from public.profiles),
      'active', (select count(*) from public.profiles where account_status = 'active'),
      'suspended', (select count(*) from public.profiles where account_status = 'suspended'),
      'banned', (select count(*) from public.profiles where account_status = 'banned'),
      'creators', (select count(*) from public.profiles where role = 'creator'),
      'buyers', (select count(*) from public.profiles where role = 'buyer'),
      'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'new_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days')
    ),
    'waitlist', (
      select jsonb_build_object(
        'total', count(*) filter (where status <> 'blocked'),
        'verified', count(*) filter (where status in ('verified', 'invited', 'converted')),
        'invited', count(*) filter (where status = 'invited'),
        'converted', count(*) filter (where status = 'converted'),
        'flagged', count(*) filter (where array_length(risk_flags, 1) > 0),
        'new_7d', count(*) filter (where created_at > now() - interval '7 days')
      )
      from public.waitlist_entries
    ),
    'listings', jsonb_build_object(
      'total', (select count(*) from public.listings),
      'active', (select count(*) from public.listings where is_active),
      'inactive', (select count(*) from public.listings where not is_active),
      'exclusive_sold', (select count(*) from public.listings where exclusive_sold)
    ),
    'orders', jsonb_build_object(
      'total', (select count(*) from public.order_requests),
      'open', (select count(*) from public.order_requests where status in ('requested', 'in_review')),
      'delivered', (select count(*) from public.order_requests where status = 'delivered'),
      'cancelled', (select count(*) from public.order_requests where status = 'cancelled'),
      'awaiting_payment', (select count(*) from public.order_requests where payment_status = 'unpaid')
    ),
    'finance', jsonb_build_object(
      'gmv', (
        select coalesce(sum(coalesce(license_price, budget, 0)), 0)
        from public.order_requests
        where payment_status = 'paid'
      ),
      'gmv_30d', (
        select coalesce(sum(coalesce(license_price, budget, 0)), 0)
        from public.order_requests
        where payment_status = 'paid' and paid_at > now() - interval '30 days'
      ),
      'refunded', (
        select count(*) from public.order_requests
        where payment_status in ('refunded', 'partially_refunded')
      ),
      'disputed', (
        select count(*) from public.order_requests
        where payment_status in ('disputed', 'chargeback')
      )
    ),
    'moderation', jsonb_build_object(
      'reports_open', (select count(*) from public.reports where status in ('pending', 'reviewing')),
      'reports_urgent', (select count(*) from public.reports where priority = 'urgent' and status <> 'resolved'),
      'tickets_open', (select count(*) from public.support_tickets where status in ('open', 'in_progress')),
      'badges_awarded', (select count(*) from public.badge_awards where revoked_at is null)
    ),
    'admins', jsonb_build_object(
      'total', (select count(*) from public.admin_accounts where is_active),
      'super_admins', (select count(*) from public.admin_accounts where is_active and role = 'super_admin')
    ),
    'generated_at', now()
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_overview_v2() from public;
grant execute on function public.get_admin_overview_v2() to authenticated;

commit;
