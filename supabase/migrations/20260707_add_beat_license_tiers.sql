do $$
begin
  create type public.license_tier as enum (
    'non_exclusive',
    'unlimited',
    'exclusive',
    'service'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.listings
  add column if not exists price_non_exclusive numeric(10, 2),
  add column if not exists price_unlimited numeric(10, 2),
  add column if not exists price_exclusive numeric(10, 2),
  add column if not exists delivery_mp3_path text,
  add column if not exists delivery_unlimited_path text,
  add column if not exists delivery_exclusive_path text,
  add column if not exists exclusive_sold boolean not null default false;

update public.listings
set price_non_exclusive = greatest(price, 1),
    price_unlimited = greatest(round(price * 2.5, 2), 1),
    price_exclusive = greatest(round(price * 10, 2), 1)
where category = 'Beat'
and (
  price_non_exclusive is null
  or price_unlimited is null
  or price_exclusive is null
);

alter table public.listings
  drop constraint if exists listings_price_non_exclusive_check,
  drop constraint if exists listings_price_unlimited_check,
  drop constraint if exists listings_price_exclusive_check,
  drop constraint if exists beat_license_prices_required,
  drop constraint if exists exclusive_sale_closes_listing;

alter table public.listings
  add constraint listings_price_non_exclusive_check
    check (price_non_exclusive is null or price_non_exclusive > 0),
  add constraint listings_price_unlimited_check
    check (price_unlimited is null or price_unlimited > 0),
  add constraint listings_price_exclusive_check
    check (price_exclusive is null or price_exclusive > 0),
  add constraint beat_license_prices_required
    check (
      category <> 'Beat'
      or (
        price_non_exclusive > 0
        and price_unlimited > 0
        and price_exclusive > 0
      )
    ),
  add constraint exclusive_sale_closes_listing
    check (not exclusive_sold or not is_active);

alter table public.order_requests
  add column if not exists license_tier public.license_tier not null default 'service',
  add column if not exists license_price numeric(10, 2),
  add column if not exists license_terms_version text;

alter table public.order_requests
  drop constraint if exists order_requests_license_price_check;

alter table public.order_requests
  add constraint order_requests_license_price_check
    check (license_price is null or license_price > 0);

drop policy if exists "Buyers can create order requests" on public.order_requests;
create policy "Buyers can create order requests"
  on public.order_requests for insert
  with check (
    auth.uid() = buyer_id
    and order_requests.license_tier = 'service'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'buyer'
    )
    and exists (
      select 1 from public.listings
      where listings.id = order_requests.listing_id
      and listings.creator_id = order_requests.creator_id
      and listings.is_active = true
      and listings.category <> 'Beat'
    )
  );

create or replace function public.purchase_listing_license(
  p_listing_id uuid,
  p_license_tier public.license_tier,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  buyer_user_id uuid := auth.uid();
  selected_listing public.listings%rowtype;
  selected_price numeric(10, 2);
  selected_delivery_path text;
  order_id uuid;
begin
  if buyer_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_license_tier not in ('non_exclusive', 'unlimited', 'exclusive') then
    raise exception 'A beat license tier is required';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = buyer_user_id and role = 'buyer'
  ) then
    raise exception 'Only buyer accounts can purchase licenses';
  end if;

  select *
  into selected_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if selected_listing.creator_id = buyer_user_id then
    raise exception 'Creators cannot purchase their own listing';
  end if;

  if selected_listing.category <> 'Beat' then
    raise exception 'Tiered licensing is available for beat listings only';
  end if;

  if not selected_listing.is_active or selected_listing.exclusive_sold then
    raise exception 'This listing is no longer available';
  end if;

  case p_license_tier
    when 'non_exclusive' then
      selected_price := selected_listing.price_non_exclusive;
      selected_delivery_path := selected_listing.delivery_mp3_path;
    when 'unlimited' then
      selected_price := selected_listing.price_unlimited;
      selected_delivery_path := selected_listing.delivery_unlimited_path;
    when 'exclusive' then
      selected_price := selected_listing.price_exclusive;
      selected_delivery_path := selected_listing.delivery_exclusive_path;
    else
      raise exception 'Unsupported license tier';
  end case;

  if selected_price is null or selected_price <= 0 then
    raise exception 'Selected license price is not configured';
  end if;

  if selected_delivery_path is null or length(trim(selected_delivery_path)) = 0 then
    raise exception 'Selected license delivery package is not available';
  end if;

  insert into public.order_requests (
    listing_id,
    buyer_id,
    creator_id,
    message,
    budget,
    license_tier,
    license_price,
    license_terms_version
  )
  values (
    selected_listing.id,
    buyer_user_id,
    selected_listing.creator_id,
    nullif(trim(p_message), ''),
    selected_price,
    p_license_tier,
    selected_price,
    '2026-07-07'
  )
  returning id into order_id;

  if p_license_tier = 'exclusive' then
    update public.listings
    set exclusive_sold = true,
        is_active = false
    where id = selected_listing.id;
  end if;

  return order_id;
end;
$$;

revoke all on function public.purchase_listing_license(uuid, public.license_tier, text) from public;
grant execute on function public.purchase_listing_license(uuid, public.license_tier, text) to authenticated;

create or replace function public.protect_order_purchase_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Only order status can be updated';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_order_purchase_fields on public.order_requests;
create trigger protect_order_purchase_fields
  before update on public.order_requests
  for each row execute procedure public.protect_order_purchase_fields();

insert into storage.buckets (id, name, public)
values ('license-deliverables', 'license-deliverables', false)
on conflict (id) do update set public = false;

drop policy if exists "Creators can upload private license packages" on storage.objects;
create policy "Creators can upload private license packages"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'license-deliverables'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'creator'
    )
  );

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
        where order_requests.buyer_id = auth.uid()
        and order_requests.status <> 'cancelled'
        and order_requests.listing_id::text = (storage.foldername(name))[2]
        and (
          (order_requests.license_tier = 'non_exclusive' and (storage.foldername(name))[3] = 'mp3')
          or (order_requests.license_tier = 'unlimited' and (storage.foldername(name))[3] = 'unlimited')
          or (order_requests.license_tier = 'exclusive' and (storage.foldername(name))[3] = 'exclusive')
        )
      )
    )
  );
