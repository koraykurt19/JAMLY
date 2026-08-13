-- Jamly security hardening.
--
-- Closes the findings from the 2026-08-13 audit:
--   1. Licensed deliverables were downloadable before any payment existed.
--   2. Any authenticated user could permanently kill a beat listing by calling
--      the exclusive purchase RPC (exclusive_sold + is_active are one-way).
--   3. Buyers could drive their own order to `delivered` and mint revenue
--      splits, because the UPDATE policy had no state machine.
--   4. Public storage buckets accepted writes to arbitrary paths.
--   5. is_admin(uuid) let any authenticated user enumerate the admin roster.
--   6. profiles exposed moderation state (account_status) to anonymous callers.
--
-- Idempotent: safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Payment gate on orders
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_state') then
    create type public.payment_state as enum (
      'unpaid',
      'processing',
      'requires_action',
      'paid',
      'failed',
      'refunded',
      'partially_refunded',
      'disputed',
      'chargeback'
    );
  end if;
end
$$;

alter table public.order_requests
  add column if not exists payment_status public.payment_state not null default 'unpaid',
  add column if not exists currency text not null default 'USD',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists delivered_at timestamptz,
  add column if not exists paid_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'order_requests_currency_check'
  ) then
    alter table public.order_requests
      add constraint order_requests_currency_check check (currency in ('USD', 'TRY'));
  end if;
end
$$;

-- Historic rows predate payments; treat delivered ones as settled so the
-- entitlement policy below does not retroactively revoke real deliveries.
update public.order_requests
set payment_status = 'paid',
    paid_at = coalesce(paid_at, created_at)
where payment_status = 'unpaid'
  and status = 'delivered';

create index if not exists order_requests_payment_status_idx
  on public.order_requests (payment_status);

-- ---------------------------------------------------------------------------
-- 2. License snapshot — the buyer keeps what they bought
-- ---------------------------------------------------------------------------
--
-- Terms text and delivery paths were previously resolved from live code and
-- the mutable listing row, so a seller edit rewrote history. Snapshot both.

alter table public.order_requests
  add column if not exists license_snapshot jsonb,
  add column if not exists delivery_path_snapshot text,
  add column if not exists listing_title_snapshot text;

-- listings.on delete cascade destroyed sales history. Keep the order row.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'order_requests_listing_id_fkey'
      and confdeltype = 'c'
  ) then
    alter table public.order_requests drop constraint order_requests_listing_id_fkey;
    alter table public.order_requests
      add constraint order_requests_listing_id_fkey
      foreign key (listing_id) references public.listings(id) on delete restrict;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Order status state machine
-- ---------------------------------------------------------------------------
--
-- Direct UPDATE by participants is revoked. Transitions go through an RPC that
-- knows who is allowed to move where.

drop policy if exists "Order participants can update status" on public.order_requests;

create or replace function public.set_order_status(
  p_order_id uuid,
  p_next_status public.order_status,
  p_expected_status public.order_status default null
)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.order_requests;
  actor uuid := auth.uid();
  is_buyer boolean;
  is_creator boolean;
  allowed boolean := false;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into current_order
  from public.order_requests
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  -- Optimistic concurrency: callers may pin the status they think they saw.
  if p_expected_status is not null and current_order.status <> p_expected_status then
    raise exception 'Order status changed while you were working' using errcode = '40001';
  end if;

  if current_order.status = p_next_status then
    return current_order.status;
  end if;

  is_buyer := actor = current_order.buyer_id;
  is_creator := actor = current_order.creator_id;

  if not (is_buyer or is_creator or public.is_admin(actor)) then
    raise exception 'You cannot update this order' using errcode = '42501';
  end if;

  -- Terminal states never reopen for participants.
  if current_order.status in ('delivered', 'cancelled') and not public.is_admin(actor) then
    raise exception 'This order is already closed' using errcode = '42501';
  end if;

  if public.is_admin(actor) then
    allowed := true;
  elsif is_creator then
    -- The seller drives fulfilment, but may not deliver an unpaid order.
    allowed := (current_order.status, p_next_status) in (
      ('requested', 'in_review'),
      ('requested', 'cancelled'),
      ('in_review', 'delivered'),
      ('in_review', 'cancelled')
    );
    if p_next_status = 'delivered' and current_order.payment_status <> 'paid' then
      raise exception 'Order cannot be delivered before payment settles' using errcode = '42501';
    end if;
  elsif is_buyer then
    -- The buyer may only walk away before delivery.
    allowed := p_next_status = 'cancelled'
      and current_order.status in ('requested', 'in_review');
  end if;

  if not allowed then
    raise exception 'Transition % -> % is not allowed for this role',
      current_order.status, p_next_status using errcode = '42501';
  end if;

  update public.order_requests
  set status = p_next_status,
      updated_at = now(),
      delivered_at = case when p_next_status = 'delivered' then now() else delivered_at end
  where id = p_order_id;

  return p_next_status;
end;
$$;

revoke all on function public.set_order_status(uuid, public.order_status, public.order_status) from public;
grant execute on function public.set_order_status(uuid, public.order_status, public.order_status) to authenticated;

-- Admins keep a direct path for support overrides; it is audited separately.
drop policy if exists "Admins can update request status" on public.order_requests;
create policy "Admins can update request status"
  on public.order_requests for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Revenue splits follow payment, not a status flag
-- ---------------------------------------------------------------------------

create or replace function public.create_order_revenue_splits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_record public.collab_projects;
  gross numeric(12, 2);
  participant_total numeric(6, 2);
  allocated numeric(12, 2) := 0;
  remainder numeric(12, 2);
  split_row record;
  last_recipient uuid;
begin
  -- Only mint splits once the order is both delivered and actually paid.
  if new.status <> 'delivered' or new.payment_status <> 'paid' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.status = 'delivered'
     and old.payment_status = 'paid' then
    return new;
  end if;

  select * into project_record
  from public.collab_projects
  where listing_id = new.listing_id;

  if not found then
    return new;
  end if;

  gross := coalesce(new.license_price, new.budget, 0);
  if gross <= 0 then
    return new;
  end if;

  select coalesce(sum(revenue_share), 0)
  into participant_total
  from public.collab_participants
  where project_id = project_record.id
    and invite_status <> 'declined'
    and user_id <> project_record.owner_id;

  -- Allocate each participant, then hand the rounding remainder to the owner so
  -- the split always reconciles to gross to the cent.
  for split_row in
    select user_id as recipient_id, revenue_share as percentage
    from public.collab_participants
    where project_id = project_record.id
      and invite_status <> 'declined'
      and user_id <> project_record.owner_id
    order by user_id
  loop
    declare
      amount numeric(12, 2) := round(gross * split_row.percentage / 100, 2);
    begin
      insert into public.revenue_splits (
        order_request_id, project_id, recipient_id, percentage,
        gross_amount, split_amount, currency
      )
      values (
        new.id, project_record.id, split_row.recipient_id, split_row.percentage,
        gross, amount, coalesce(new.currency, 'USD')
      )
      on conflict (order_request_id, recipient_id) do nothing;
      allocated := allocated + amount;
      last_recipient := split_row.recipient_id;
    end;
  end loop;

  remainder := gross - allocated;
  if remainder > 0 or participant_total < 100 then
    insert into public.revenue_splits (
      order_request_id, project_id, recipient_id, percentage,
      gross_amount, split_amount, currency
    )
    values (
      new.id, project_record.id, project_record.owner_id, greatest(100 - participant_total, 0),
      gross, greatest(remainder, 0), coalesce(new.currency, 'USD')
    )
    on conflict (order_request_id, recipient_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists create_order_revenue_splits_trigger on public.order_requests;
create trigger create_order_revenue_splits_trigger
  after insert or update of status, payment_status on public.order_requests
  for each row
  execute function public.create_order_revenue_splits();

-- ---------------------------------------------------------------------------
-- 5. Field protection must allow the new server-managed columns
-- ---------------------------------------------------------------------------

create or replace function public.protect_order_purchase_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  managed text[] := array[
    'status', 'payment_status', 'updated_at', 'delivered_at', 'paid_at',
    'license_snapshot', 'delivery_path_snapshot', 'listing_title_snapshot'
  ];
  old_rest jsonb := to_jsonb(old);
  new_rest jsonb := to_jsonb(new);
  key text;
begin
  foreach key in array managed loop
    old_rest := old_rest - key;
    new_rest := new_rest - key;
  end loop;

  if old_rest is distinct from new_rest then
    raise exception 'Only order fulfilment fields can be updated' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Purchase RPC: no entitlement, no takedown, before payment
-- ---------------------------------------------------------------------------

create or replace function public.purchase_listing_license(
  p_listing_id uuid,
  p_license_tier public.license_tier,
  p_license_snapshot jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_listing public.listings;
  buyer uuid := auth.uid();
  resolved_price numeric(10, 2);
  delivery_path text;
  new_order_id uuid;
begin
  if buyer is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_license_tier not in ('non_exclusive', 'unlimited', 'exclusive') then
    raise exception 'Unsupported license tier' using errcode = '22023';
  end if;

  select * into selected_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;

  if selected_listing.category <> 'Beat' then
    raise exception 'This listing is not licensable' using errcode = '22023';
  end if;

  if selected_listing.creator_id = buyer then
    raise exception 'You cannot license your own listing' using errcode = '22023';
  end if;

  if not selected_listing.is_active or selected_listing.exclusive_sold then
    raise exception 'This listing is no longer available' using errcode = '22023';
  end if;

  resolved_price := case p_license_tier
    when 'non_exclusive' then selected_listing.price_non_exclusive
    when 'unlimited' then selected_listing.price_unlimited
    when 'exclusive' then selected_listing.price_exclusive
  end;

  if resolved_price is null or resolved_price <= 0 then
    raise exception 'This license tier is not configured' using errcode = '22023';
  end if;

  delivery_path := case p_license_tier
    when 'non_exclusive' then selected_listing.delivery_mp3_path
    when 'unlimited' then selected_listing.delivery_unlimited_path
    when 'exclusive' then selected_listing.delivery_exclusive_path
  end;

  if delivery_path is null or length(trim(delivery_path)) = 0 then
    raise exception 'This license tier has no deliverable' using errcode = '22023';
  end if;

  -- One unpaid attempt per buyer/listing/tier keeps retries from piling up.
  select id into new_order_id
  from public.order_requests
  where listing_id = p_listing_id
    and buyer_id = buyer
    and license_tier = p_license_tier
    and payment_status in ('unpaid', 'requires_action', 'failed')
    and status = 'requested'
  limit 1;

  if new_order_id is not null then
    return new_order_id;
  end if;

  insert into public.order_requests (
    listing_id, buyer_id, creator_id, license_tier, license_price, budget,
    license_terms_version, status, payment_status, currency,
    license_snapshot, delivery_path_snapshot, listing_title_snapshot
  )
  values (
    selected_listing.id, buyer, selected_listing.creator_id, p_license_tier,
    resolved_price, resolved_price,
    coalesce(p_license_snapshot ->> 'version', '2026-07-07'),
    'requested', 'unpaid', 'USD',
    p_license_snapshot, delivery_path, selected_listing.title
  )
  returning id into new_order_id;

  -- NOTE: exclusivity is now claimed by settle_order_payment, never here.
  -- Reserving it pre-payment let anyone delete any listing for free.

  return new_order_id;
end;
$$;

revoke all on function public.purchase_listing_license(uuid, public.license_tier, jsonb) from public;
grant execute on function public.purchase_listing_license(uuid, public.license_tier, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Payment settlement (server-only; the browser can never call this)
-- ---------------------------------------------------------------------------

create or replace function public.settle_order_payment(
  p_order_id uuid,
  p_payment_status public.payment_state,
  p_provider_reference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.order_requests;
begin
  select * into current_order
  from public.order_requests
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  if current_order.payment_status = p_payment_status then
    return;
  end if;

  update public.order_requests
  set payment_status = p_payment_status,
      paid_at = case when p_payment_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
      updated_at = now()
  where id = p_order_id;

  -- Exclusivity is claimed only once real money has settled.
  if p_payment_status = 'paid' and current_order.license_tier = 'exclusive' then
    update public.listings
    set exclusive_sold = true,
        is_active = false
    where id = current_order.listing_id
      and not exclusive_sold;
  end if;

  -- A refunded/charged-back exclusive releases the listing again.
  if p_payment_status in ('refunded', 'chargeback')
     and current_order.license_tier = 'exclusive' then
    update public.listings
    set exclusive_sold = false
    where id = current_order.listing_id;
  end if;
end;
$$;

-- Only the service role (server webhook handler) may settle payments.
revoke all on function public.settle_order_payment(uuid, public.payment_state, text) from public;
revoke all on function public.settle_order_payment(uuid, public.payment_state, text) from authenticated;
revoke all on function public.settle_order_payment(uuid, public.payment_state, text) from anon;

-- Admin-only manual release for a refunded exclusive.
create or replace function public.admin_release_exclusive(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  update public.listings
  set exclusive_sold = false
  where id = p_listing_id;
end;
$$;

revoke all on function public.admin_release_exclusive(uuid) from public;
grant execute on function public.admin_release_exclusive(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Entitlement: paid orders only, and tiers now supersede downward
-- ---------------------------------------------------------------------------

drop policy if exists "License participants can read purchased delivery" on storage.objects;

create policy "License participants can read purchased delivery"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'license-deliverables'
    and (
      owner = auth.uid()
      or exists (
        select 1
        from public.order_requests
        join public.listings on listings.id = order_requests.listing_id
        where order_requests.buyer_id = auth.uid()
          and order_requests.payment_status = 'paid'
          and order_requests.status <> 'cancelled'
          and order_requests.listing_id::text = (storage.foldername(name))[2]
          -- the uploader must own the listing the folder claims
          and listings.creator_id::text = (storage.foldername(name))[1]
          and (
            (order_requests.license_tier = 'non_exclusive'
              and (storage.foldername(name))[3] = 'mp3')
            or (order_requests.license_tier = 'unlimited'
              and (storage.foldername(name))[3] in ('mp3', 'unlimited'))
            or (order_requests.license_tier = 'exclusive'
              and (storage.foldername(name))[3] in ('mp3', 'unlimited', 'exclusive'))
          )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 9. Public buckets: per-user folder isolation + type/size limits
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated users can upload listing media" on storage.objects;

create policy "Authenticated users can upload listing media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('listing-covers', 'profile-media', 'audio-previews')
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can replace their own media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('listing-covers', 'profile-media', 'audio-previews')
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('listing-covers', 'profile-media', 'audio-previews')
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can delete their own media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('listing-covers', 'profile-media', 'audio-previews', 'license-deliverables')
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

update storage.buckets
set file_size_limit = 12582912,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id in ('listing-covers', 'profile-media');

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm']
where id = 'audio-previews';

update storage.buckets
set file_size_limit = 524288000,
    allowed_mime_types = array[
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
      'application/zip', 'application/x-zip-compressed'
    ]
where id = 'license-deliverables';

-- ---------------------------------------------------------------------------
-- 10. is_admin no longer leaks the admin roster
-- ---------------------------------------------------------------------------

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(auth.uid());
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

-- Policies call is_admin internally as the definer, so authenticated callers
-- no longer need direct access to the arbitrary-uuid form.
revoke execute on function public.is_admin(uuid) from authenticated;

-- ---------------------------------------------------------------------------
-- 11. Public profile surface excludes moderation state
-- ---------------------------------------------------------------------------

create or replace view public.public_profiles as
  select
    id, role, handle, full_name, headline, avatar_url, cover_url,
    location, bio, specialties, social_links, created_at
  from public.profiles
  where account_status = 'active';

grant select on public.public_profiles to anon, authenticated;

commit;
