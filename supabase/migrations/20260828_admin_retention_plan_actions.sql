begin;

create or replace function public.admin_set_retention_plan(
  p_profile_id uuid,
  p_plan text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous record;
  next_multiplier numeric(4, 2);
begin
  if not public.admin_has('admin.manage') then
    raise exception 'Only admins can manage retention plans' using errcode = '42501';
  end if;

  if p_plan not in ('standard', 'premium') then
    raise exception 'Retention plan is invalid' using errcode = '22023';
  end if;

  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A reason is required to change retention plans' using errcode = '22023';
  end if;

  perform 1 from public.profiles where id = p_profile_id;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select plan, retention_multiplier
    into previous
  from public.profile_retention_settings
  where profile_id = p_profile_id;

  next_multiplier := case when p_plan = 'premium' then 2 else 1 end;

  insert into public.profile_retention_settings (
    profile_id,
    plan,
    retention_multiplier,
    updated_by,
    updated_at
  )
  values (
    p_profile_id,
    p_plan,
    next_multiplier,
    auth.uid(),
    now()
  )
  on conflict (profile_id) do update set
    plan = excluded.plan,
    retention_multiplier = excluded.retention_multiplier,
    updated_by = excluded.updated_by,
    updated_at = now();

  perform public.record_admin_action(
    'retention.plan_change',
    'profile',
    p_profile_id::text,
    jsonb_build_object(
      'plan',
      coalesce(previous.plan, 'standard'),
      'retention_multiplier',
      coalesce(previous.retention_multiplier, 1)
    ),
    jsonb_build_object(
      'plan',
      p_plan,
      'retention_multiplier',
      next_multiplier
    ),
    p_reason
  );
end;
$$;

revoke all on function public.admin_set_retention_plan(uuid, text, text) from public;
grant execute on function public.admin_set_retention_plan(uuid, text, text) to authenticated;

commit;
