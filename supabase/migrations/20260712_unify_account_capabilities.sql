-- Jamly account model update:
-- Keep the legacy profile_role enum for compatibility, but stop using it as a
-- hard gate for buying, selling, messaging, or uploading.

drop policy if exists "Creators can insert their listings" on public.listings;
create policy "Account owners can insert their listings"
  on public.listings for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Creators can update their listings" on public.listings;
create policy "Account owners can update their listings"
  on public.listings for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists "Buyers can create order requests" on public.order_requests;
create policy "Accounts can create service order requests"
  on public.order_requests for insert
  with check (
    auth.uid() = buyer_id
    and buyer_id <> creator_id
    and order_requests.license_tier = 'service'
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

  select *
  into selected_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if selected_listing.creator_id = buyer_user_id then
    raise exception 'You cannot purchase your own listing';
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

drop policy if exists "Participants can create conversations" on public.conversations;
create policy "Participants can create conversations"
  on public.conversations for insert
  with check (
    (auth.uid() = buyer_id or auth.uid() = artist_id)
    and buyer_id <> artist_id
    and (
      listing_id is null
      or exists (
        select 1 from public.listings
        where listings.id = conversations.listing_id
        and listings.creator_id = conversations.artist_id
      )
    )
    and (
      order_request_id is null
      or exists (
        select 1 from public.order_requests
        where order_requests.id = conversations.order_request_id
        and order_requests.buyer_id = conversations.buyer_id
        and order_requests.creator_id = conversations.artist_id
      )
    )
  );

drop policy if exists "Authenticated users can upload listing media" on storage.objects;
create policy "Authenticated users can upload listing media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('listing-covers', 'audio-previews')
    and owner = auth.uid()
  );

drop policy if exists "Creators can upload private license packages" on storage.objects;
create policy "Authenticated users can upload private license packages"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'license-deliverables'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
