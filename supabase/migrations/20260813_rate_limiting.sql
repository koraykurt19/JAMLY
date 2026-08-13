-- Distributed rate limiting.
--
-- Vercel runs every request in a fresh isolate, so an in-process counter is not
-- a rate limit — it is a suggestion. This uses Postgres as the shared store: a
-- fixed-window counter keyed by (bucket, identity), incremented atomically.
--
-- Idempotent: safe to re-run.

begin;

create table if not exists public.rate_limit_counters (
  bucket text not null,
  -- Hashed identity (IP hash, user id, or email hash). Never a raw IP.
  identity text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  primary key (bucket, identity, window_started_at)
);

create index if not exists rate_limit_counters_window_idx
  on public.rate_limit_counters (window_started_at);

alter table public.rate_limit_counters enable row level security;
-- No policies at all: only the security-definer function below may touch it.

-- ---------------------------------------------------------------------------
-- consume: atomically record one hit and report whether it is allowed
-- ---------------------------------------------------------------------------

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_identity text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  window_start timestamptz;
  current_count integer;
begin
  if p_bucket is null or p_identity is null or p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;

  -- Fixed window: floor(now / window) * window
  window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters (bucket, identity, window_started_at, request_count)
  values (p_bucket, p_identity, window_start, 1)
  on conflict (bucket, identity, window_started_at)
  do update set request_count = public.rate_limit_counters.request_count + 1
  returning request_count into current_count;

  return query select
    current_count <= p_limit,
    greatest(p_limit - current_count, 0),
    case
      when current_count <= p_limit then 0
      else ceil(extract(epoch from (window_start + make_interval(secs => p_window_seconds) - now())))::integer
    end;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to anon, authenticated;

-- Housekeeping: drop windows older than a day. Call from a cron job, or let it
-- ride along with the next consume (cheap because of the window index).
create or replace function public.prune_rate_limit_counters()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.rate_limit_counters
  where window_started_at < now() - interval '1 day';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.prune_rate_limit_counters() from public;
grant execute on function public.prune_rate_limit_counters() to authenticated;

commit;
