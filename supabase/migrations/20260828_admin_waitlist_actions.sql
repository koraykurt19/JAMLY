-- Admin waitlist actions for pre-register operations.
--
-- The public pre-register host only collects intent. Beta/app access is still
-- explicitly controlled by admins after review.

begin;

create or replace function public.admin_set_waitlist_status(
  p_entry_id uuid,
  p_status public.waitlist_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous public.waitlist_entries;
  now_value timestamptz := now();
begin
  if not public.admin_has('waitlist.manage') then
    raise exception 'You do not have permission to manage the waitlist' using errcode = '42501';
  end if;

  if p_status = 'converted' then
    raise exception 'Use the account conversion workflow to mark a waitlist entry converted' using errcode = '22023';
  end if;

  select * into previous
  from public.waitlist_entries
  where id = p_entry_id
  for update;

  if not found then
    raise exception 'Waitlist entry was not found' using errcode = 'P0002';
  end if;

  if previous.status = 'converted' then
    raise exception 'Converted waitlist entries cannot be changed here' using errcode = '42501';
  end if;

  if previous.status = p_status then
    return;
  end if;

  update public.waitlist_entries
  set
    status = p_status,
    invited_at = case
      when p_status = 'invited' then coalesce(invited_at, now_value)
      when previous.status = 'invited' and p_status <> 'invited' then null
      else invited_at
    end,
    verified_at = case
      when p_status in ('verified', 'invited') then coalesce(verified_at, now_value)
      else verified_at
    end
  where id = p_entry_id;

  insert into public.waitlist_events (entry_id, event_type, metadata)
  values (
    p_entry_id,
    p_status::text,
    jsonb_build_object(
      'previous_status', previous.status,
      'reason', nullif(trim(coalesce(p_reason, '')), ''),
      'actor_id', auth.uid()
    )
  );

  perform public.record_admin_action(
    'waitlist.status_change',
    'waitlist_entry',
    p_entry_id::text,
    jsonb_build_object('status', previous.status),
    jsonb_build_object('status', p_status),
    p_reason
  );
end;
$$;

revoke all on function public.admin_set_waitlist_status(uuid, public.waitlist_status, text) from public;
grant execute on function public.admin_set_waitlist_status(uuid, public.waitlist_status, text) to authenticated;

commit;
