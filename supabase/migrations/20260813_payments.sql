-- Payment records, webhook idempotency and the payout ledger.
--
-- Money is never stored as a float and never as a single mutable balance: the
-- ledger is append-only and a balance is derived by summing entries.
--
-- Amounts are integer minor units (cents/kuruş) so arithmetic is exact.
--
-- Idempotent: safe to re-run.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payout_state') then
    create type public.payout_state as enum (
      'pending', 'held', 'available', 'scheduled', 'processing', 'paid', 'failed', 'reversed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ledger_entry_type') then
    create type public.ledger_entry_type as enum (
      'sale', 'platform_fee', 'processor_fee', 'split', 'refund',
      'chargeback', 'payout', 'adjustment'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.order_requests(id) on delete restrict,
  provider text not null default 'sandbox',
  provider_payment_id text,
  status public.payment_state not null default 'unpaid',
  -- Integer minor units. 24.99 USD is stored as 2499.
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'TRY')),
  platform_fee_minor bigint not null default 0 check (platform_fee_minor >= 0),
  processor_fee_minor bigint not null default 0 check (processor_fee_minor >= 0),
  net_minor bigint generated always as
    (amount_minor - platform_fee_minor - processor_fee_minor) stored,
  -- Client-supplied key that makes retrying a checkout safe.
  idempotency_key text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_reference_key
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create unique index if not exists payments_idempotency_key
  on public.payments (idempotency_key)
  where idempotency_key is not null;
create index if not exists payments_order_idx on public.payments (order_id);

-- ---------------------------------------------------------------------------
-- Webhook events — replay protection
-- ---------------------------------------------------------------------------

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  -- The provider's own event id. A replayed delivery collides here and is
  -- ignored rather than double-applied.
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  process_error text,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists payment_webhook_unprocessed_idx
  on public.payment_webhook_events (received_at)
  where processed_at is null;

-- ---------------------------------------------------------------------------
-- Ledger — append only
-- ---------------------------------------------------------------------------

create table if not exists public.ledger_entries (
  id bigint primary key generated always as identity,
  account_id uuid references public.profiles(id) on delete restrict,
  order_id uuid references public.order_requests(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete restrict,
  entry_type public.ledger_entry_type not null,
  -- Signed: credit is positive, debit is negative. The sum over an account is
  -- its balance; there is no mutable balance column to drift.
  amount_minor bigint not null,
  currency text not null default 'USD' check (currency in ('USD', 'TRY')),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_account_idx
  on public.ledger_entries (account_id, created_at desc);
create index if not exists ledger_entries_order_idx on public.ledger_entries (order_id);

create or replace function public.block_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'The ledger is append-only; post a reversing entry instead'
    using errcode = '42501';
end;
$$;

drop trigger if exists block_ledger_update on public.ledger_entries;
create trigger block_ledger_update
  before update or delete on public.ledger_entries
  for each row execute function public.block_ledger_mutation();

-- ---------------------------------------------------------------------------
-- Payouts
-- ---------------------------------------------------------------------------

create table if not exists public.payout_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null default 'sandbox',
  provider_account_id text,
  -- KYC/onboarding is owned by the provider; we only mirror its verdict.
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'pending', 'verified', 'restricted', 'rejected')),
  payouts_enabled boolean not null default false,
  default_currency text not null default 'USD' check (default_currency in ('USD', 'TRY')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  status public.payout_state not null default 'pending',
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'USD' check (currency in ('USD', 'TRY')),
  provider text not null default 'sandbox',
  provider_payout_id text,
  -- Funds are held until the dispute window closes.
  available_at timestamptz,
  scheduled_for timestamptz,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payouts_profile_idx on public.payouts (profile_id, created_at desc);
create index if not exists payouts_status_idx on public.payouts (status);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payout_accounts enable row level security;
alter table public.payouts enable row level security;

-- Buyers and sellers may see the payment for their own order, nothing else.
drop policy if exists "Order participants read payments" on public.payments;
create policy "Order participants read payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.order_requests o
      where o.id = payments.order_id
        and (o.buyer_id = auth.uid() or o.creator_id = auth.uid())
    )
    or public.admin_has('finance.view')
  );

-- A seller sees only their own ledger. Buyers never see seller economics.
drop policy if exists "Accounts read their ledger" on public.ledger_entries;
create policy "Accounts read their ledger"
  on public.ledger_entries for select
  using (auth.uid() = account_id or public.admin_has('finance.view'));

drop policy if exists "Sellers read their payout account" on public.payout_accounts;
create policy "Sellers read their payout account"
  on public.payout_accounts for select
  using (auth.uid() = profile_id or public.admin_has('finance.view'));

drop policy if exists "Sellers read their payouts" on public.payouts;
create policy "Sellers read their payouts"
  on public.payouts for select
  using (auth.uid() = profile_id or public.admin_has('finance.view'));

drop policy if exists "Finance reads webhook events" on public.payment_webhook_events;
create policy "Finance reads webhook events"
  on public.payment_webhook_events for select
  using (public.admin_has('finance.manage'));

-- No INSERT/UPDATE policies anywhere: every write goes through the
-- security-definer functions below, which the browser cannot call.

-- ---------------------------------------------------------------------------
-- Fee model
-- ---------------------------------------------------------------------------

insert into public.platform_settings (key, value)
values (
  'commission',
  jsonb_build_object('percent', 10, 'minimum_minor', 100, 'currency', 'USD')
)
on conflict (key) do nothing;

create or replace function public.calculate_platform_fee(p_amount_minor bigint)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  config jsonb;
  percent numeric;
  minimum bigint;
  fee bigint;
begin
  select value into config from public.platform_settings where key = 'commission';
  percent := coalesce((config ->> 'percent')::numeric, 10);
  minimum := coalesce((config ->> 'minimum_minor')::bigint, 0);

  -- Round half up on integer minor units; never floats.
  fee := ((p_amount_minor * percent) + 50) / 100;
  return greatest(fee, minimum);
end;
$$;

-- ---------------------------------------------------------------------------
-- Recording a settled payment
-- ---------------------------------------------------------------------------
--
-- Called only by the server-side webhook handler. Writes the payment, the
-- ledger entries and flips the order — all inside one transaction.

create or replace function public.record_payment_settlement(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_amount_minor bigint,
  p_currency text default 'USD',
  p_processor_fee_minor bigint default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.order_requests;
  platform_fee bigint;
  payment_id uuid;
begin
  select * into target_order
  from public.order_requests
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  -- Idempotent: a replayed settlement returns the existing payment.
  select id into payment_id
  from public.payments
  where provider = p_provider and provider_payment_id = p_provider_payment_id;

  if payment_id is not null then
    return payment_id;
  end if;

  platform_fee := public.calculate_platform_fee(p_amount_minor);

  insert into public.payments (
    order_id, provider, provider_payment_id, status, amount_minor,
    currency, platform_fee_minor, processor_fee_minor
  )
  values (
    p_order_id, p_provider, p_provider_payment_id, 'paid', p_amount_minor,
    p_currency, platform_fee, coalesce(p_processor_fee_minor, 0)
  )
  returning id into payment_id;

  -- Gross sale credited to the seller, fees debited back out.
  insert into public.ledger_entries
    (account_id, order_id, payment_id, entry_type, amount_minor, currency, description)
  values
    (target_order.creator_id, p_order_id, payment_id, 'sale',
     p_amount_minor, p_currency, 'Order settled'),
    (target_order.creator_id, p_order_id, payment_id, 'platform_fee',
     -platform_fee, p_currency, 'Platform commission');

  if coalesce(p_processor_fee_minor, 0) > 0 then
    insert into public.ledger_entries
      (account_id, order_id, payment_id, entry_type, amount_minor, currency, description)
    values
      (target_order.creator_id, p_order_id, payment_id, 'processor_fee',
       -p_processor_fee_minor, p_currency, 'Processor fee');
  end if;

  perform public.settle_order_payment(p_order_id, 'paid', p_provider_payment_id);

  return payment_id;
end;
$$;

revoke all on function public.record_payment_settlement(uuid, text, text, bigint, text, bigint) from public;
revoke all on function public.record_payment_settlement(uuid, text, text, bigint, text, bigint) from anon;
revoke all on function public.record_payment_settlement(uuid, text, text, bigint, text, bigint) from authenticated;

-- ---------------------------------------------------------------------------
-- Refunds post reversing entries; they never edit history
-- ---------------------------------------------------------------------------

create or replace function public.record_payment_refund(
  p_payment_id uuid,
  p_amount_minor bigint,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_payment public.payments;
  refunded_total bigint;
  next_status public.payment_state;
begin
  select * into target_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;

  if p_amount_minor <= 0 or p_amount_minor > target_payment.amount_minor then
    raise exception 'Invalid refund amount' using errcode = '22023';
  end if;

  select coalesce(-sum(amount_minor), 0) into refunded_total
  from public.ledger_entries
  where payment_id = p_payment_id and entry_type = 'refund';

  if refunded_total + p_amount_minor > target_payment.amount_minor then
    raise exception 'Refund exceeds the captured amount' using errcode = '22023';
  end if;

  insert into public.ledger_entries
    (account_id, order_id, payment_id, entry_type, amount_minor, currency, description)
  select o.creator_id, target_payment.order_id, p_payment_id, 'refund',
         -p_amount_minor, target_payment.currency, coalesce(p_reason, 'Refund')
  from public.order_requests o
  where o.id = target_payment.order_id;

  next_status := case
    when refunded_total + p_amount_minor >= target_payment.amount_minor then 'refunded'
    else 'partially_refunded'
  end;

  update public.payments
  set status = next_status, updated_at = now()
  where id = p_payment_id;

  perform public.settle_order_payment(target_payment.order_id, next_status, null);
end;
$$;

revoke all on function public.record_payment_refund(uuid, bigint, text) from public;
revoke all on function public.record_payment_refund(uuid, bigint, text) from anon;
revoke all on function public.record_payment_refund(uuid, bigint, text) from authenticated;

-- ---------------------------------------------------------------------------
-- Derived balance
-- ---------------------------------------------------------------------------

create or replace function public.get_account_balance(p_profile_id uuid default auth.uid())
returns table (currency text, balance_minor bigint, pending_payout_minor bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.currency,
    coalesce(sum(l.amount_minor), 0),
    coalesce((
      select sum(p.amount_minor)
      from public.payouts p
      where p.profile_id = p_profile_id
        and p.currency = l.currency
        and p.status in ('pending', 'held', 'scheduled', 'processing')
    ), 0)
  from public.ledger_entries l
  where l.account_id = p_profile_id
    and (p_profile_id = auth.uid() or public.admin_has('finance.view'))
  group by l.currency;
$$;

revoke all on function public.get_account_balance(uuid) from public;
grant execute on function public.get_account_balance(uuid) to authenticated;

commit;
