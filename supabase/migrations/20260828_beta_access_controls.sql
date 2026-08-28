-- Persistent beta access controls.
--
-- Pre-register only captures intent. Product access is granted separately by
-- admins, so a waitlist entry can never unlock the app by itself.

create table if not exists public.profile_beta_access (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_beta_access enable row level security;

drop policy if exists "Members read own beta access" on public.profile_beta_access;
create policy "Members read own beta access"
  on public.profile_beta_access for select
  using (profile_id = auth.uid() or public.admin_has('user.view'));

drop policy if exists "Admins manage beta access" on public.profile_beta_access;
create policy "Admins manage beta access"
  on public.profile_beta_access for all
  using (public.admin_has('admin.manage'))
  with check (public.admin_has('admin.manage'));

create or replace function public.admin_set_beta_access(
  p_profile_id uuid,
  p_is_active boolean,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  previous boolean;
begin
  if not public.admin_has('admin.manage') then
    raise exception 'Admin manage capability is required' using errcode = '42501';
  end if;

  if p_reason is null or length(trim(p_reason)) < 6 then
    raise exception 'A reason is required to change beta access' using errcode = '22023';
  end if;

  perform 1 from public.profiles where id = p_profile_id;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select is_active
    into previous
  from public.profile_beta_access
  where profile_id = p_profile_id;

  insert into public.profile_beta_access (
    profile_id,
    is_active,
    granted_by,
    reason,
    updated_at
  )
  values (
    p_profile_id,
    p_is_active,
    auth.uid(),
    trim(p_reason),
    now()
  )
  on conflict (profile_id) do update set
    is_active = excluded.is_active,
    granted_by = excluded.granted_by,
    reason = excluded.reason,
    updated_at = now();

  perform public.record_admin_action(
    'beta.access_change',
    'profile',
    p_profile_id::text,
    jsonb_build_object('is_active', previous),
    jsonb_build_object('is_active', p_is_active),
    trim(p_reason)
  );

  return p_is_active;
end;
$$;

revoke all on function public.admin_set_beta_access(uuid, boolean, text) from public;
grant execute on function public.admin_set_beta_access(uuid, boolean, text) to authenticated;
