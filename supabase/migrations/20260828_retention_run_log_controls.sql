begin;

create or replace function public.admin_retention_plan(
  p_execute boolean default false,
  p_record_run boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rate_cutoff timestamptz := now() - interval '48 hours';
  waitlist_event_cutoff timestamptz := now() - interval '30 days';
  read_notification_base_days integer := 14;
  unread_notification_base_days integer := 30;
  message_base_days integer := 30;
  orphan_conversation_cutoff timestamptz := now() - interval '30 days';
  retention_run_cutoff timestamptz := now() - interval '90 days';
  rate_count integer := 0;
  waitlist_event_count integer := 0;
  read_notification_count integer := 0;
  unread_notification_count integer := 0;
  message_count integer := 0;
  orphan_conversation_count integer := 0;
  retention_run_count integer := 0;
  deleted_rate_count integer := 0;
  deleted_waitlist_event_count integer := 0;
  deleted_read_notification_count integer := 0;
  deleted_unread_notification_count integer := 0;
  deleted_message_count integer := 0;
  deleted_orphan_conversation_count integer := 0;
  deleted_retention_run_count integer := 0;
  summary jsonb;
  run_id uuid := null;
begin
  if not public.admin_has('admin.manage') then
    raise exception 'Only admins can inspect or execute retention cleanup' using errcode = '42501';
  end if;

  select count(*) into rate_count
  from public.rate_limit_counters
  where window_started_at < rate_cutoff;

  select count(*) into waitlist_event_count
  from public.waitlist_events
  where created_at < waitlist_event_cutoff
    and event_type in ('verification_sent', 'rejected');

  select count(*) into read_notification_count
  from public.notifications n
  where n.is_read
    and n.created_at < now() - make_interval(
      days => ceil(read_notification_base_days * public.retention_multiplier_for_profile(n.user_id))::integer
    );

  select count(*) into unread_notification_count
  from public.notifications n
  where not n.is_read
    and n.created_at < now() - make_interval(
      days => ceil(unread_notification_base_days * public.retention_multiplier_for_profile(n.user_id))::integer
    );

  select count(*) into message_count
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where c.order_request_id is null
    and m.created_at < now() - make_interval(
      days => ceil(
        message_base_days * greatest(
          public.retention_multiplier_for_profile(c.buyer_id),
          public.retention_multiplier_for_profile(c.artist_id)
        )
      )::integer
    );

  select count(*) into orphan_conversation_count
  from public.conversations c
  where c.order_request_id is null
    and c.created_at < orphan_conversation_cutoff
    and not exists (
      select 1 from public.messages m where m.conversation_id = c.id
    );

  select count(*) into retention_run_count
  from public.retention_policy_runs
  where mode = 'dry_run'
    and status = 'completed'
    and created_at < retention_run_cutoff;

  if p_execute then
    delete from public.rate_limit_counters
    where window_started_at < rate_cutoff;
    get diagnostics deleted_rate_count = row_count;

    delete from public.waitlist_events
    where created_at < waitlist_event_cutoff
      and event_type in ('verification_sent', 'rejected');
    get diagnostics deleted_waitlist_event_count = row_count;

    delete from public.notifications n
    where n.is_read
      and n.created_at < now() - make_interval(
        days => ceil(read_notification_base_days * public.retention_multiplier_for_profile(n.user_id))::integer
      );
    get diagnostics deleted_read_notification_count = row_count;

    delete from public.notifications n
    where not n.is_read
      and n.created_at < now() - make_interval(
        days => ceil(unread_notification_base_days * public.retention_multiplier_for_profile(n.user_id))::integer
      );
    get diagnostics deleted_unread_notification_count = row_count;

    delete from public.messages m
    using public.conversations c
    where c.id = m.conversation_id
      and c.order_request_id is null
      and m.created_at < now() - make_interval(
        days => ceil(
          message_base_days * greatest(
            public.retention_multiplier_for_profile(c.buyer_id),
            public.retention_multiplier_for_profile(c.artist_id)
          )
        )::integer
      );
    get diagnostics deleted_message_count = row_count;

    delete from public.conversations c
    where c.order_request_id is null
      and c.created_at < orphan_conversation_cutoff
      and not exists (
        select 1 from public.messages m where m.conversation_id = c.id
      );
    get diagnostics deleted_orphan_conversation_count = row_count;

    delete from public.retention_policy_runs
    where mode = 'dry_run'
      and status = 'completed'
      and created_at < retention_run_cutoff;
    get diagnostics deleted_retention_run_count = row_count;
  end if;

  summary := jsonb_build_object(
    'mode', case when p_execute then 'execute' else 'dry_run' end,
    'generatedAt', now(),
    'recorded', p_record_run,
    'totals', jsonb_build_object(
      'eligibleRows',
        rate_count + waitlist_event_count + read_notification_count +
        unread_notification_count + message_count + orphan_conversation_count +
        retention_run_count,
      'deletedRows',
        deleted_rate_count + deleted_waitlist_event_count +
        deleted_read_notification_count + deleted_unread_notification_count +
        deleted_message_count + deleted_orphan_conversation_count +
        deleted_retention_run_count
    ),
    'policies', jsonb_build_array(
      jsonb_build_object(
        'key', 'rate_limit_counters',
        'label', 'Rate-limit counters',
        'retentionDays', 2,
        'premiumRetentionDays', 2,
        'cutoff', rate_cutoff,
        'eligibleRows', rate_count,
        'deletedRows', deleted_rate_count,
        'protects', jsonb_build_array('raw IP addresses are never stored')
      ),
      jsonb_build_object(
        'key', 'waitlist_events',
        'label', 'Expired waitlist operational events',
        'retentionDays', 30,
        'premiumRetentionDays', 30,
        'cutoff', waitlist_event_cutoff,
        'eligibleRows', waitlist_event_count,
        'deletedRows', deleted_waitlist_event_count,
        'protects', jsonb_build_array('waitlist_entries', 'reserved usernames', 'referral counts')
      ),
      jsonb_build_object(
        'key', 'notifications_read',
        'label', 'Read notifications',
        'retentionDays', read_notification_base_days,
        'premiumRetentionDays', read_notification_base_days * 2,
        'eligibleRows', read_notification_count,
        'deletedRows', deleted_read_notification_count,
        'protects', jsonb_build_array('profiles', 'orders', 'admin audit')
      ),
      jsonb_build_object(
        'key', 'notifications_unread',
        'label', 'Unread notifications',
        'retentionDays', unread_notification_base_days,
        'premiumRetentionDays', unread_notification_base_days * 2,
        'eligibleRows', unread_notification_count,
        'deletedRows', deleted_unread_notification_count,
        'protects', jsonb_build_array('profiles', 'orders', 'admin audit')
      ),
      jsonb_build_object(
        'key', 'non_order_messages',
        'label', 'Non-order conversation messages',
        'retentionDays', message_base_days,
        'premiumRetentionDays', message_base_days * 2,
        'eligibleRows', message_count,
        'deletedRows', deleted_message_count,
        'protects', jsonb_build_array('order conversations', 'paid order history', 'profiles')
      ),
      jsonb_build_object(
        'key', 'empty_non_order_conversations',
        'label', 'Empty non-order conversations',
        'retentionDays', 30,
        'premiumRetentionDays', 60,
        'cutoff', orphan_conversation_cutoff,
        'eligibleRows', orphan_conversation_count,
        'deletedRows', deleted_orphan_conversation_count,
        'protects', jsonb_build_array('order conversations', 'profiles')
      ),
      jsonb_build_object(
        'key', 'retention_dry_run_logs',
        'label', 'Completed dry-run retention logs',
        'retentionDays', 90,
        'premiumRetentionDays', 90,
        'cutoff', retention_run_cutoff,
        'eligibleRows', retention_run_count,
        'deletedRows', deleted_retention_run_count,
        'protects', jsonb_build_array('execute runs', 'failed runs', 'admin audit')
      )
    ),
    'neverDelete', jsonb_build_array(
      'profiles',
      'auth.users',
      'admin_accounts',
      'admin_audit_log',
      'order_requests',
      'payments',
      'ledger_entries',
      'revenue_splits',
      'reports',
      'paid license snapshots'
    )
  );

  if p_record_run then
    insert into public.retention_policy_runs (mode, status, summary, executed_by)
    values (case when p_execute then 'execute' else 'dry_run' end, 'completed', summary, auth.uid())
    returning id into run_id;
  end if;

  return summary || jsonb_build_object('runId', run_id);
exception
  when others then
    if p_record_run then
      insert into public.retention_policy_runs (mode, status, summary, executed_by, error_message)
      values (
        case when p_execute then 'execute' else 'dry_run' end,
        'failed',
        jsonb_build_object('generatedAt', now(), 'recorded', p_record_run),
        auth.uid(),
        sqlerrm
      );
    end if;
    raise;
end;
$$;

create or replace function public.admin_retention_plan(p_execute boolean default false)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.admin_retention_plan(p_execute, true);
$$;

revoke all on function public.admin_retention_plan(boolean, boolean) from public;
grant execute on function public.admin_retention_plan(boolean, boolean) to authenticated;

revoke all on function public.admin_retention_plan(boolean) from public;
grant execute on function public.admin_retention_plan(boolean) to authenticated;

commit;
