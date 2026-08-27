-- Jamly Early Access (waitlist) system.
--
-- Public sign-up before launch, with verified email, a stable founding-order
-- position, referral attribution and abuse signals. The public counter reads
-- from a security-definer function so the entries themselves stay private.
--
-- Idempotent: safe to re-run.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'waitlist_status') then
    create type public.waitlist_status as enum (
      'pending',
      'verified',
      'invited',
      'converted',
      'suppressed',
      'blocked'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'waitlist_persona') then
    create type public.waitlist_persona as enum (
      'creator',
      'buyer',
      'both'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Entries
-- ---------------------------------------------------------------------------

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  -- Normalized (lowercase, trimmed) address is the dedupe key.
  email text not null,
  email_domain text generated always as (split_part(email, '@', 2)) stored,
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  -- Soft reservation only; the real handle is claimed at signup.
  reserved_username text check (
    reserved_username is null or reserved_username ~ '^[a-z0-9][a-z0-9-]{1,31}$'
  ),
  persona public.waitlist_persona not null default 'both',
  interests text[] not null default '{}',
  locale text not null default 'tr' check (locale in ('tr', 'en')),

  -- Referral
  referral_code text not null,
  referred_by uuid references public.waitlist_entries(id) on delete set null,
  referral_count integer not null default 0 check (referral_count >= 0),

  -- Attribution
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,

  -- Consent (explicit, timestamped)
  accepted_terms boolean not null default false,
  marketing_opt_in boolean not null default false,
  consent_recorded_at timestamptz,

  -- Verification
  status public.waitlist_status not null default 'pending',
  verification_token_hash text,
  verification_sent_at timestamptz,
  verified_at timestamptz,

  -- Queue: monotonic, gap-free-enough, assigned on insert and never reused.
  queue_position bigint not null generated always as identity,

  -- Abuse signals
  risk_flags text[] not null default '{}',
  signup_ip_hash text,

  invited_at timestamptz,
  converted_at timestamptz,
  converted_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint waitlist_email_shape check (email = lower(trim(email)) and email like '%@%.%'),
  constraint waitlist_no_self_referral check (referred_by is null or referred_by <> id)
);

-- The race-proof dedupe guarantee.
create unique index if not exists waitlist_entries_email_key
  on public.waitlist_entries (email);
create unique index if not exists waitlist_entries_referral_code_key
  on public.waitlist_entries (referral_code);
create unique index if not exists waitlist_entries_reserved_username_key
  on public.waitlist_entries (reserved_username)
  where reserved_username is not null;
create index if not exists waitlist_entries_status_idx
  on public.waitlist_entries (status);
create index if not exists waitlist_entries_referred_by_idx
  on public.waitlist_entries (referred_by);
create index if not exists waitlist_entries_created_at_idx
  on public.waitlist_entries (created_at desc);

-- ---------------------------------------------------------------------------
-- Referral edges (explicit, so abuse analysis does not depend on the entry row)
-- ---------------------------------------------------------------------------

create table if not exists public.waitlist_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.waitlist_entries(id) on delete cascade,
  referred_id uuid not null references public.waitlist_entries(id) on delete cascade,
  credited boolean not null default false,
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (referred_id),
  constraint waitlist_referral_distinct check (referrer_id <> referred_id)
);

create index if not exists waitlist_referrals_referrer_idx
  on public.waitlist_referrals (referrer_id);

-- ---------------------------------------------------------------------------
-- Events (append-only funnel trail)
-- ---------------------------------------------------------------------------

create table if not exists public.waitlist_events (
  id bigint primary key generated always as identity,
  entry_id uuid references public.waitlist_entries(id) on delete cascade,
  event_type text not null check (event_type in (
    'signup', 'verification_sent', 'verified', 'referral_credited',
    'invited', 'converted', 'suppressed', 'blocked', 'rejected'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_events_entry_idx
  on public.waitlist_events (entry_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Launch invites
-- ---------------------------------------------------------------------------

create table if not exists public.launch_invites (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.waitlist_entries(id) on delete cascade,
  invite_code text not null unique,
  batch_label text,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists launch_invites_entry_idx on public.launch_invites (entry_id);

-- ---------------------------------------------------------------------------
-- Reserved usernames (platform-level holds, independent of waitlist entries)
-- ---------------------------------------------------------------------------

create table if not exists public.reserved_usernames (
  username text primary key check (username ~ '^[a-z0-9][a-z0-9-]{1,31}$'),
  reason text not null default 'reserved',
  released_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.reserved_usernames (username, reason) values
  ('jamly', 'brand'), ('admin', 'system'), ('administrator', 'system'),
  ('support', 'system'), ('help', 'system'), ('official', 'brand'),
  ('team', 'brand'), ('staff', 'system'), ('moderator', 'system'),
  ('security', 'system'), ('billing', 'system'), ('api', 'system'),
  ('root', 'system'), ('system', 'system'), ('null', 'system'),
  ('undefined', 'system'), ('anonymous', 'system')
on conflict (username) do nothing;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_waitlist_entry()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_waitlist_entry_trigger on public.waitlist_entries;
create trigger touch_waitlist_entry_trigger
  before update on public.waitlist_entries
  for each row execute function public.touch_waitlist_entry();

-- ---------------------------------------------------------------------------
-- RLS — entries are never readable by the public
-- ---------------------------------------------------------------------------

alter table public.waitlist_entries enable row level security;
alter table public.waitlist_referrals enable row level security;
alter table public.waitlist_events enable row level security;
alter table public.launch_invites enable row level security;
alter table public.reserved_usernames enable row level security;

drop policy if exists "Admins read waitlist entries" on public.waitlist_entries;
create policy "Admins read waitlist entries"
  on public.waitlist_entries for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins manage waitlist entries" on public.waitlist_entries;
create policy "Admins manage waitlist entries"
  on public.waitlist_entries for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins read waitlist referrals" on public.waitlist_referrals;
create policy "Admins read waitlist referrals"
  on public.waitlist_referrals for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins read waitlist events" on public.waitlist_events;
create policy "Admins read waitlist events"
  on public.waitlist_events for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins manage launch invites" on public.launch_invites;
create policy "Admins manage launch invites"
  on public.launch_invites for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Reserved usernames are readable" on public.reserved_usernames;
create policy "Reserved usernames are readable"
  on public.reserved_usernames for select
  using (released_at is null);

-- No INSERT policy anywhere: sign-up goes exclusively through the
-- security-definer RPC below, which owns validation and rate context.

-- ---------------------------------------------------------------------------
-- Public counter — aggregate only, never row data
-- ---------------------------------------------------------------------------

create or replace function public.get_waitlist_stats()
returns table (
  total_count bigint,
  verified_count bigint,
  creator_count bigint,
  latest_signup_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where status <> 'blocked'),
    count(*) filter (where status in ('verified', 'invited', 'converted')),
    count(*) filter (where persona in ('creator', 'both') and status <> 'blocked'),
    max(created_at) filter (where status <> 'blocked')
  from public.waitlist_entries;
$$;

revoke all on function public.get_waitlist_stats() from public;
grant execute on function public.get_waitlist_stats() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sign-up RPC
-- ---------------------------------------------------------------------------

create or replace function public.join_waitlist(
  p_email text,
  p_display_name text default null,
  p_reserved_username text default null,
  p_persona public.waitlist_persona default 'both',
  p_interests text[] default '{}',
  p_locale text default 'tr',
  p_referral_code text default null,
  p_utm jsonb default '{}'::jsonb,
  p_accepted_terms boolean default false,
  p_marketing_opt_in boolean default false,
  p_verification_token_hash text default null,
  p_ip_hash text default null
)
returns table (
  entry_id uuid,
  queue_position bigint,
  referral_code text,
  status public.waitlist_status,
  already_registered boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  normalized_username text := nullif(lower(trim(coalesce(p_reserved_username, ''))), '');
  existing public.waitlist_entries;
  referrer public.waitlist_entries;
  new_code text;
  flags text[] := '{}';
  inserted public.waitlist_entries;
begin
  if normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(normalized_email) > 254 then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  if not p_accepted_terms then
    raise exception 'Terms must be accepted' using errcode = '22023';
  end if;

  -- Idempotent re-submit: never leak whether the address was already known
  -- through an error; the caller decides what to show.
  select * into existing
  from public.waitlist_entries
  where email = normalized_email;

  if found then
    return query
      select existing.id, existing.queue_position, existing.referral_code,
             existing.status, true;
    return;
  end if;

  if normalized_username is not null then
    if exists (
      select 1 from public.reserved_usernames
      where username = normalized_username and released_at is null
    ) or exists (
      select 1 from public.profiles where handle = normalized_username
    ) or exists (
      select 1 from public.waitlist_entries where reserved_username = normalized_username
    ) then
      raise exception 'That username is already reserved' using errcode = '23505';
    end if;
  end if;

  if p_referral_code is not null and length(trim(p_referral_code)) > 0 then
    select * into referrer
    from public.waitlist_entries
    where waitlist_entries.referral_code = upper(trim(p_referral_code));

    if found and referrer.status = 'blocked' then
      referrer := null;
    end if;
  end if;

  -- Disposable-domain signal. Recorded, not enforced: a human reviews it.
  if split_part(normalized_email, '@', 2) = any (array[
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
    'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
    'getnada.com', 'temp-mail.org'
  ]) then
    flags := array_append(flags, 'disposable_email');
  end if;

  -- Unpredictable, human-typable referral code.
  loop
    new_code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
    exit when not exists (
      select 1 from public.waitlist_entries where waitlist_entries.referral_code = new_code
    );
  end loop;

  insert into public.waitlist_entries (
    email, display_name, reserved_username, persona, interests, locale,
    referral_code, referred_by, utm_source, utm_medium, utm_campaign, utm_content,
    accepted_terms, marketing_opt_in, consent_recorded_at,
    verification_token_hash, verification_sent_at, risk_flags, signup_ip_hash
  )
  values (
    normalized_email,
    nullif(trim(coalesce(p_display_name, '')), ''),
    normalized_username,
    p_persona,
    coalesce(p_interests, '{}'),
    case when p_locale in ('tr', 'en') then p_locale else 'tr' end,
    new_code,
    referrer.id,
    p_utm ->> 'source', p_utm ->> 'medium', p_utm ->> 'campaign', p_utm ->> 'content',
    true, coalesce(p_marketing_opt_in, false), now(),
    p_verification_token_hash,
    case when p_verification_token_hash is null then null else now() end,
    flags,
    p_ip_hash
  )
  returning * into inserted;

  if referrer.id is not null then
    insert into public.waitlist_referrals (referrer_id, referred_id)
    values (referrer.id, inserted.id)
    on conflict (referred_id) do nothing;
  end if;

  insert into public.waitlist_events (entry_id, event_type, metadata)
  values (
    inserted.id,
    'signup',
    jsonb_build_object('persona', p_persona, 'locale', p_locale, 'referred', referrer.id is not null)
  );

  return query
    select inserted.id, inserted.queue_position, inserted.referral_code,
           inserted.status, false;
end;
$$;

revoke all on function public.join_waitlist(
  text, text, text, public.waitlist_persona, text[], text, text, jsonb, boolean, boolean, text, text
) from public;
grant execute on function public.join_waitlist(
  text, text, text, public.waitlist_persona, text[], text, text, jsonb, boolean, boolean, text, text
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------

create or replace function public.verify_waitlist_entry(p_token_hash text)
returns table (
  entry_id uuid,
  queue_position bigint,
  referral_code text,
  verified boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.waitlist_entries;
begin
  if p_token_hash is null or length(p_token_hash) < 16 then
    raise exception 'Invalid verification token' using errcode = '22023';
  end if;

  select * into target
  from public.waitlist_entries
  where verification_token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'Invalid verification token' using errcode = 'P0002';
  end if;

  if target.status = 'blocked' then
    raise exception 'This entry is not eligible' using errcode = '42501';
  end if;

  if target.verified_at is not null then
    return query select target.id, target.queue_position, target.referral_code, true;
    return;
  end if;

  update public.waitlist_entries
  set status = case when status = 'pending' then 'verified'::public.waitlist_status else status end,
      verified_at = now(),
      verification_token_hash = null
  where id = target.id;

  insert into public.waitlist_events (entry_id, event_type)
  values (target.id, 'verified');

  -- Referral credit lands only on verification, so unverified spam earns nothing.
  update public.waitlist_referrals
  set credited = true, credited_at = now()
  where referred_id = target.id and not credited;

  if target.referred_by is not null then
    update public.waitlist_entries
    set referral_count = referral_count + 1
    where id = target.referred_by;

    insert into public.waitlist_events (entry_id, event_type, metadata)
    values (target.referred_by, 'referral_credited', jsonb_build_object('referred_id', target.id));
  end if;

  return query select target.id, target.queue_position, target.referral_code, true;
end;
$$;

revoke all on function public.verify_waitlist_entry(text) from public;
grant execute on function public.verify_waitlist_entry(text) to anon, authenticated;

commit;
