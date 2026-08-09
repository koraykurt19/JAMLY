begin;

do $$
begin
  create type public.account_status as enum ('active', 'suspended', 'banned');
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active';

create table if not exists public.admin_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.admin_accounts enable row level security;

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
      and profiles.account_status = 'active'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change account status'
      using errcode = '42501';
  end if;

  if auth.uid() is distinct from new.id
     and public.is_admin(auth.uid())
     and (to_jsonb(new) - 'account_status') is distinct from (to_jsonb(old) - 'account_status') then
    raise exception 'Admins can only update account status through the admin policy'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields_before_update on public.profiles;
create trigger protect_profile_admin_fields_before_update
  before update on public.profiles
  for each row execute procedure public.protect_profile_admin_fields();

drop policy if exists "Admins can read admin accounts" on public.admin_accounts;
create policy "Admins can read admin accounts"
  on public.admin_accounts for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage admin accounts" on public.admin_accounts;
create policy "Admins can manage admin accounts"
  on public.admin_accounts for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update account status" on public.profiles;
create policy "Admins can update account status"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read all listings" on public.listings;
create policy "Admins can read all listings"
  on public.listings for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can moderate listings" on public.listings;
create policy "Admins can moderate listings"
  on public.listings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read all requests" on public.order_requests;
create policy "Admins can read all requests"
  on public.order_requests for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update request status" on public.order_requests;
create policy "Admins can update request status"
  on public.order_requests for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('user', 'listing', 'review', 'message')),
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 3 and 1200),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists reports_status_created_at_idx
  on public.reports(status, created_at desc);
create index if not exists reports_target_idx
  on public.reports(target_type, target_id);

alter table public.reports enable row level security;

drop policy if exists "Authenticated users can create reports" on public.reports;
create policy "Authenticated users can create reports"
  on public.reports for insert
  to authenticated
  with check (reported_by = auth.uid());

drop policy if exists "Admins can read reports" on public.reports;
create policy "Admins can read reports"
  on public.reports for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create table if not exists public.platform_skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  category_key text not null,
  label jsonb not null check (jsonb_typeof(label) = 'object'),
  synonyms text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists platform_skills_active_sort_idx
  on public.platform_skills(is_active, sort_order, slug);

alter table public.platform_skills enable row level security;

drop policy if exists "Active platform skills are readable" on public.platform_skills;
create policy "Active platform skills are readable"
  on public.platform_skills for select
  using (is_active = true);

drop policy if exists "Admins can manage platform skills" on public.platform_skills;
create policy "Admins can manage platform skills"
  on public.platform_skills for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into public.platform_skills (slug, category_key, label, synonyms, sort_order)
values
  ('beat-production', 'Beat', '{"tr":"Beat prodüksiyonu","en":"Beat Production"}', array['beat', 'instrumental', '808'], 10),
  ('mixing', 'Mixing', '{"tr":"Miks","en":"Mixing"}', array['mix', 'miks', 'stem'], 20),
  ('mastering', 'Mastering', '{"tr":"Mastering","en":"Mastering"}', array['master', 'loudness', 'release'], 30),
  ('songwriting', 'Songwriting', '{"tr":"Şarkı yazımı","en":"Songwriting"}', array['lyrics', 'söz', 'topline', 'hook'], 40),
  ('vocal-feature', 'Vocal Feature', '{"tr":"Vokal katkı","en":"Vocal Feature"}', array['vocal', 'vokal', 'singer'], 50),
  ('guitar', 'Guitar', '{"tr":"Gitar","en":"Guitar"}', array['guitar', 'gitar', 'riff', 'session'], 60),
  ('jingle', 'Jingle', '{"tr":"Jingle","en":"Jingle"}', array['jingle', 'brand', 'slogan', 'reklam'], 70),
  ('cover-art', 'Cover Art', '{"tr":"Kapak görseli","en":"Cover Art"}', array['cover', 'artwork', 'kapak'], 80)
on conflict (slug) do update
set category_key = excluded.category_key,
    label = excluded.label,
    synonyms = excluded.synonyms,
    sort_order = excluded.sort_order;

create table if not exists public.platform_settings (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9._-]{1,95}$'),
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

drop policy if exists "Admins can read platform settings" on public.platform_settings;
create policy "Admins can read platform settings"
  on public.platform_settings for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage platform settings" on public.platform_settings;
create policy "Admins can manage platform settings"
  on public.platform_settings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.admin_set_profile_status(
  p_profile_id uuid,
  p_status public.account_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  update public.profiles
  set account_status = p_status
  where id = p_profile_id;

  if not found then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_profile_status(uuid, public.account_status) from public;
grant execute on function public.admin_set_profile_status(uuid, public.account_status) to authenticated;

create or replace function public.get_admin_overview()
returns table (
  total_users bigint,
  active_users bigint,
  suspended_users bigint,
  banned_users bigint,
  admin_users bigint,
  artist_count bigint,
  buyer_count bigint,
  listing_count bigint,
  active_listing_count bigint,
  inactive_listing_count bigint,
  order_count bigint,
  open_order_count bigint,
  reported_content_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where account_status = 'active'),
    (select count(*) from public.profiles where account_status = 'suspended'),
    (select count(*) from public.profiles where account_status = 'banned'),
    (select count(*) from public.admin_accounts),
    (select count(*) from public.profiles where role = 'creator'),
    (select count(*) from public.profiles where role = 'buyer'),
    (select count(*) from public.listings),
    (select count(*) from public.listings where is_active = true),
    (select count(*) from public.listings where is_active = false),
    (select count(*) from public.order_requests),
    (select count(*) from public.order_requests where status in ('requested', 'in_review')),
    (select count(*) from public.reports where status in ('pending', 'reviewing'));
end;
$$;

revoke all on function public.get_admin_overview() from public;
grant execute on function public.get_admin_overview() to authenticated;

insert into public.admin_accounts (user_id, notes)
select profiles.id, 'Founder bootstrap admin'
from public.profiles
join auth.users on users.id = profiles.id
where lower(coalesce(users.email, '')) = 'koraykurt.vrdn@gmail.com'
on conflict (user_id) do nothing;

commit;
