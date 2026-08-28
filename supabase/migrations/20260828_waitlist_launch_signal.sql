-- Persist pre-register launch/game signals for admin triage.

alter table public.waitlist_entries
  add column if not exists launch_signal jsonb not null default '{}'::jsonb;

alter table public.waitlist_entries
  drop constraint if exists waitlist_launch_signal_object_check;

alter table public.waitlist_entries
  add constraint waitlist_launch_signal_object_check
  check (jsonb_typeof(launch_signal) = 'object');

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
  p_ip_hash text default null,
  p_launch_signal jsonb default '{}'::jsonb
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
  clean_launch_signal jsonb := case
    when jsonb_typeof(coalesce(p_launch_signal, '{}'::jsonb)) = 'object'
      then coalesce(p_launch_signal, '{}'::jsonb)
    else '{}'::jsonb
  end;
begin
  if normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(normalized_email) > 254 then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  if not p_accepted_terms then
    raise exception 'Terms must be accepted' using errcode = '22023';
  end if;

  select * into existing
  from public.waitlist_entries
  where email = normalized_email;

  if found then
    update public.waitlist_entries
    set launch_signal = case
          when clean_launch_signal = '{}'::jsonb then launch_signal
          else launch_signal || clean_launch_signal
        end
    where id = existing.id
    returning * into existing;

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

  if split_part(normalized_email, '@', 2) = any (array[
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
    'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
    'getnada.com', 'temp-mail.org'
  ]) then
    flags := array_append(flags, 'disposable_email');
  end if;

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
    verification_token_hash, verification_sent_at, risk_flags, signup_ip_hash,
    launch_signal
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
    p_ip_hash,
    clean_launch_signal
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
    jsonb_build_object(
      'persona', p_persona,
      'locale', p_locale,
      'referred', referrer.id is not null,
      'launch_signal', clean_launch_signal
    )
  );

  return query
    select inserted.id, inserted.queue_position, inserted.referral_code,
           inserted.status, false;
end;
$$;

revoke all on function public.join_waitlist(
  text, text, text, public.waitlist_persona, text[], text, text, jsonb, boolean, boolean, text, text
) from public;
revoke all on function public.join_waitlist(
  text, text, text, public.waitlist_persona, text[], text, text, jsonb, boolean, boolean, text, text, jsonb
) from public;
grant execute on function public.join_waitlist(
  text, text, text, public.waitlist_persona, text[], text, text, jsonb, boolean, boolean, text, text, jsonb
) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
