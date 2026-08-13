-- Transactional email outbox.
--
-- No provider credentials exist yet, so mail is not sent directly. Messages are
-- written to an outbox with their rendered payload; a worker (or the admin
-- console) drains it once a provider is configured. This keeps delivery
-- auditable and makes the provider swap a one-file change.
--
-- Idempotent: safe to re-run.

begin;

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  template text not null check (char_length(template) between 3 and 60),
  to_email text not null,
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  -- 'transactional' mail ignores marketing opt-out; 'marketing' must respect it.
  kind text not null default 'transactional' check (kind in ('transactional', 'marketing')),
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'failed', 'suppressed')),
  attempts integer not null default 0,
  last_error text,
  provider_message_id text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_outbox_status_idx
  on public.email_outbox (status, scheduled_for);
create index if not exists email_outbox_to_idx
  on public.email_outbox (to_email, created_at desc);

alter table public.email_outbox enable row level security;

-- Admins may inspect the queue; nobody may read another person's mail contents
-- through the API, and nothing may be written except by the definer below.
drop policy if exists "Admins read email outbox" on public.email_outbox;
create policy "Admins read email outbox"
  on public.email_outbox for select
  using (public.admin_has('config.manage'));

create or replace function public.enqueue_email(
  p_template text,
  p_to_email text,
  p_subject text,
  p_payload jsonb default '{}'::jsonb,
  p_locale text default 'tr',
  p_kind text default 'transactional'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  normalized_email text := lower(trim(coalesce(p_to_email, '')));
begin
  if normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid recipient is required' using errcode = '22023';
  end if;

  -- Respect marketing opt-out at enqueue time, not at send time.
  if p_kind = 'marketing' and exists (
    select 1 from public.waitlist_entries
    where email = normalized_email
      and (not marketing_opt_in or status in ('suppressed', 'blocked'))
  ) then
    insert into public.email_outbox (
      template, to_email, subject, payload, locale, kind, status
    )
    values (p_template, normalized_email, p_subject, p_payload,
            coalesce(p_locale, 'tr'), p_kind, 'suppressed')
    returning id into new_id;
    return new_id;
  end if;

  insert into public.email_outbox (template, to_email, subject, payload, locale, kind)
  values (p_template, normalized_email, p_subject, p_payload, coalesce(p_locale, 'tr'), p_kind)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.enqueue_email(text, text, text, jsonb, text, text) from public;
grant execute on function public.enqueue_email(text, text, text, jsonb, text, text) to anon, authenticated;

commit;
