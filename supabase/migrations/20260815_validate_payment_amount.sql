-- Payment settlement must match the amount and currency captured on the order.
-- A provider event for a smaller amount must never unlock the full license.
-- Idempotent: safe to re-run.

begin;

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
  expected_amount_minor bigint;
  expected_currency text;
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

  expected_amount_minor := round(
    coalesce(target_order.license_price, target_order.budget, 0) * 100
  )::bigint;
  expected_currency := upper(coalesce(target_order.currency, 'USD'));

  if p_amount_minor <= 0 or p_amount_minor <> expected_amount_minor then
    raise exception 'Payment amount does not match the order'
      using errcode = '22023';
  end if;

  if upper(coalesce(p_currency, '')) <> expected_currency then
    raise exception 'Payment currency does not match the order'
      using errcode = '22023';
  end if;

  if coalesce(p_processor_fee_minor, 0) < 0 then
    raise exception 'Processor fee cannot be negative'
      using errcode = '22023';
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
    expected_currency, platform_fee, coalesce(p_processor_fee_minor, 0)
  )
  returning id into payment_id;

  insert into public.ledger_entries
    (account_id, order_id, payment_id, entry_type, amount_minor, currency, description)
  values
    (target_order.creator_id, p_order_id, payment_id, 'sale',
     p_amount_minor, expected_currency, 'Order settled'),
    (target_order.creator_id, p_order_id, payment_id, 'platform_fee',
     -platform_fee, expected_currency, 'Platform commission');

  if coalesce(p_processor_fee_minor, 0) > 0 then
    insert into public.ledger_entries
      (account_id, order_id, payment_id, entry_type, amount_minor, currency, description)
    values
      (target_order.creator_id, p_order_id, payment_id, 'processor_fee',
       -p_processor_fee_minor, expected_currency, 'Processor fee');
  end if;

  perform public.settle_order_payment(p_order_id, 'paid', p_provider_payment_id);
  return payment_id;
end;
$$;

revoke all on function public.record_payment_settlement(uuid, text, text, bigint, text, bigint) from public;
revoke all on function public.record_payment_settlement(uuid, text, text, bigint, text, bigint) from anon;
revoke all on function public.record_payment_settlement(uuid, text, text, bigint, text, bigint) from authenticated;

commit;
