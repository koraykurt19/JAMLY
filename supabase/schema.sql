create extension if not exists "pgcrypto";

create type public.profile_role as enum ('creator', 'buyer');
create type public.account_status as enum ('active', 'suspended', 'banned');
create type public.listing_category as enum (
  'Beat',
  'Mixing',
  'Mastering',
  'Songwriting',
  'Vocal Feature',
  'Custom Production',
  'Guitar',
  'Lyrics',
  'Jingle',
  'Cover Art'
);
create type public.license_type as enum (
  'Basic Lease',
  'Premium Lease',
  'Exclusive',
  'Service'
);
create type public.license_tier as enum (
  'non_exclusive',
  'unlimited',
  'exclusive',
  'service'
);
create type public.order_status as enum (
  'requested',
  'in_review',
  'delivered',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role not null default 'buyer',
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9-]{1,31}$'),
  handle_updated_at timestamptz default now(),
  full_name text not null,
  headline text,
  avatar_url text,
  cover_url text,
  location text,
  bio text,
  specialties text[] default '{}',
  social_links jsonb not null default '{}'::jsonb
    check (jsonb_typeof(social_links) = 'object'),
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.profile_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.admin_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category public.listing_category not null,
  genre text not null,
  bpm integer check (bpm is null or (bpm >= 40 and bpm <= 240)),
  price numeric(10, 2) not null check (price >= 0),
  price_non_exclusive numeric(10, 2) check (price_non_exclusive is null or price_non_exclusive > 0),
  price_unlimited numeric(10, 2) check (price_unlimited is null or price_unlimited > 0),
  price_exclusive numeric(10, 2) check (price_exclusive is null or price_exclusive > 0),
  description text not null,
  audio_preview_url text not null,
  cover_image_url text not null,
  delivery_mp3_path text,
  delivery_unlimited_path text,
  delivery_exclusive_path text,
  license_type public.license_type not null,
  turnaround text,
  tags text[] default '{}',
  exclusive_sold boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint beat_license_prices_required check (
    category <> 'Beat'
    or (
      price_non_exclusive > 0
      and price_unlimited > 0
      and price_exclusive > 0
    )
  ),
  constraint exclusive_sale_closes_listing check (not exclusive_sold or not is_active)
);

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  budget numeric(10, 2),
  license_tier public.license_tier not null default 'service',
  license_price numeric(10, 2) check (license_price is null or license_price > 0),
  license_terms_version text,
  status public.order_status not null default 'requested',
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  order_request_id uuid references public.order_requests(id) on delete set null,
  last_message text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (buyer_id <> artist_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  message_type text not null default 'text',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('user', 'listing', 'review', 'message')),
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 3 and 1200),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.platform_skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  category_key text not null,
  label jsonb not null check (jsonb_typeof(label) = 'object'),
  synonyms text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9._-]{1,95}$'),
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index listings_creator_id_idx on public.listings(creator_id);
create index profile_follows_following_activity_idx
  on public.profile_follows(following_id, created_at desc);
create index profile_follows_follower_activity_idx
  on public.profile_follows(follower_id, created_at desc);
create index listings_category_idx on public.listings(category);
create index listings_genre_idx on public.listings(genre);
create index listings_price_idx on public.listings(price);
create index order_requests_buyer_id_idx on public.order_requests(buyer_id);
create index order_requests_creator_id_idx on public.order_requests(creator_id);
create unique index conversations_order_request_unique_idx
  on public.conversations(order_request_id)
  where order_request_id is not null;
create unique index conversations_listing_participants_unique_idx
  on public.conversations(buyer_id, artist_id, listing_id)
  where listing_id is not null and order_request_id is null;
create unique index conversations_general_participants_unique_idx
  on public.conversations(buyer_id, artist_id)
  where listing_id is null and order_request_id is null;
create index conversations_buyer_activity_idx
  on public.conversations(buyer_id, last_message_at desc);
create index conversations_artist_activity_idx
  on public.conversations(artist_id, last_message_at desc);
create index messages_conversation_created_at_idx
  on public.messages(conversation_id, created_at);
create index messages_unread_idx
  on public.messages(conversation_id, is_read)
  where is_read = false;
create index message_attachments_message_id_idx
  on public.message_attachments(message_id);
create index reports_status_created_at_idx
  on public.reports(status, created_at desc);
create index reports_target_idx
  on public.reports(target_type, target_id);
create index platform_skills_active_sort_idx
  on public.platform_skills(is_active, sort_order, slug);

alter table public.profiles enable row level security;
alter table public.profile_follows enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.listings enable row level security;
alter table public.order_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.reports enable row level security;
alter table public.platform_skills enable row level security;
alter table public.platform_settings enable row level security;

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_accounts
    join public.profiles on profiles.id = admin_accounts.user_id
    where admin_accounts.user_id = p_user_id
      and profiles.account_status = 'active'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

create policy "Public profiles are readable"
  on public.profiles for select
  using (true);

create policy "Users can update their profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profile follows are publicly readable"
  on public.profile_follows for select
  using (true);

create policy "Users can follow creators"
  on public.profile_follows for insert
  to authenticated
  with check (
    auth.uid() = follower_id
    and follower_id <> following_id
    and exists (
      select 1 from public.profiles
      where profiles.id = profile_follows.following_id
    )
  );

create policy "Users can unfollow creators"
  on public.profile_follows for delete
  to authenticated
  using (auth.uid() = follower_id);

create policy "Admins can read admin accounts"
  on public.admin_accounts for select
  using (public.is_admin(auth.uid()));

create policy "Admins can manage admin accounts"
  on public.admin_accounts for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can update account status"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change account status'
      using errcode = '42501';
  end if;

  if auth.uid() is distinct from new.id
     and public.is_admin(auth.uid())
     and (to_jsonb(new) - 'account_status') is distinct from (to_jsonb(old) - 'account_status') then
    raise exception 'Admins can only update account status through the admin policy'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger protect_profile_admin_fields_before_update
  before update on public.profiles
  for each row execute procedure public.protect_profile_admin_fields();

create or replace function public.enforce_monthly_handle_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.handle is distinct from old.handle then
    if old.handle_updated_at is not null
      and old.handle_updated_at > now() - interval '30 days' then
      raise exception 'Username can only be changed once every 30 days';
    end if;

    new.handle_updated_at := now();
  end if;

  return new;
end;
$$;

create trigger enforce_monthly_handle_change_before_profile_update
  before update on public.profiles
  for each row execute procedure public.enforce_monthly_handle_change();

create or replace function public.enforce_reserved_profile_headline()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_email text;
begin
  if lower(trim(coalesce(new.headline, ''))) = lower('Founder of Jamly') then
    select users.email
    into account_email
    from auth.users
    where users.id = new.id;

    if lower(coalesce(account_email, '')) <> 'koraykurt.vrdn@gmail.com' then
      raise exception 'Founder of Jamly is a reserved profile headline'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_reserved_profile_headline() from public;

create trigger enforce_reserved_profile_headline_before_write
  before insert or update of headline on public.profiles
  for each row execute procedure public.enforce_reserved_profile_headline();

create policy "Active listings are readable"
  on public.listings for select
  using (is_active = true);

create policy "Account owners can insert their listings"
  on public.listings for insert
  with check (auth.uid() = creator_id);

create policy "Account owners can update their listings"
  on public.listings for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Order participants can read ordered listings"
  on public.listings for select
  using (
    exists (
      select 1 from public.order_requests
      where order_requests.listing_id = listings.id
      and (order_requests.buyer_id = auth.uid() or order_requests.creator_id = auth.uid())
    )
  );

create policy "Admins can read all listings"
  on public.listings for select
  using (public.is_admin(auth.uid()));

create policy "Admins can moderate listings"
  on public.listings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Order participants can read requests"
  on public.order_requests for select
  using (auth.uid() = buyer_id or auth.uid() = creator_id);

create policy "Admins can read all requests"
  on public.order_requests for select
  using (public.is_admin(auth.uid()));

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

create policy "Order participants can update status"
  on public.order_requests for update
  using (auth.uid() = buyer_id or auth.uid() = creator_id)
  with check (auth.uid() = buyer_id or auth.uid() = creator_id);

create policy "Admins can update request status"
  on public.order_requests for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

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

create trigger protect_order_purchase_fields
  before update on public.order_requests
  for each row execute procedure public.protect_order_purchase_fields();

create policy "Participants can read conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = artist_id);

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

create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Participants can mark messages read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Participants can read message attachments"
  on public.message_attachments for select
  using (
    exists (
      select 1
      from public.messages
      join public.conversations on conversations.id = messages.conversation_id
      where messages.id = message_attachments.message_id
      and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Message senders can add attachments"
  on public.message_attachments for insert
  with check (
    exists (
      select 1
      from public.messages
      join public.conversations on conversations.id = messages.conversation_id
      where messages.id = message_attachments.message_id
      and messages.sender_id = auth.uid()
      and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Authenticated users can create reports"
  on public.reports for insert
  to authenticated
  with check (reported_by = auth.uid());

create policy "Admins can read reports"
  on public.reports for select
  using (public.is_admin(auth.uid()));

create policy "Admins can update reports"
  on public.reports for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Active platform skills are readable"
  on public.platform_skills for select
  using (is_active = true);

create policy "Admins can manage platform skills"
  on public.platform_skills for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can read platform settings"
  on public.platform_settings for select
  using (public.is_admin(auth.uid()));

create policy "Admins can manage platform settings"
  on public.platform_settings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.admin_set_profile_status(
  p_profile_id uuid,
  p_status public.account_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  update public.profiles
  set account_status = p_status
  where id = p_profile_id;

  if not found then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_profile_status(uuid, public.account_status) from public;
grant execute on function public.admin_set_profile_status(uuid, public.account_status) to authenticated;

create or replace function public.get_admin_overview()
returns table (
  total_users bigint,
  active_users bigint,
  suspended_users bigint,
  banned_users bigint,
  admin_users bigint,
  artist_count bigint,
  buyer_count bigint,
  listing_count bigint,
  active_listing_count bigint,
  inactive_listing_count bigint,
  order_count bigint,
  open_order_count bigint,
  reported_content_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where account_status = 'active'),
    (select count(*) from public.profiles where account_status = 'suspended'),
    (select count(*) from public.profiles where account_status = 'banned'),
    (select count(*) from public.admin_accounts),
    (select count(*) from public.profiles where role = 'creator'),
    (select count(*) from public.profiles where role = 'buyer'),
    (select count(*) from public.listings),
    (select count(*) from public.listings where is_active = true),
    (select count(*) from public.listings where is_active = false),
    (select count(*) from public.order_requests),
    (select count(*) from public.order_requests where status in ('requested', 'in_review')),
    (select count(*) from public.reports where status in ('pending', 'reviewing'));
end;
$$;

revoke all on function public.get_admin_overview() from public;
grant execute on function public.get_admin_overview() to authenticated;

create or replace function public.protect_message_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'is_read') is distinct from (to_jsonb(old) - 'is_read') then
    raise exception 'Only is_read can be updated on a message';
  end if;
  return new;
end;
$$;

create trigger protect_message_fields
  before update on public.messages
  for each row execute procedure public.protect_message_update();

create or replace function public.sync_conversation_last_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations
  set last_message = new.body,
      last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger sync_conversation_after_message
  after insert on public.messages
  for each row execute procedure public.sync_conversation_last_message();

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  clean_handle text;
begin
  clean_handle := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)), '[^a-z0-9-]+', '-', 'g'));
  clean_handle := regexp_replace(clean_handle, '-+', '-', 'g');
  clean_handle := trim(both '-' from clean_handle);
  if clean_handle = '' then
    clean_handle := 'jamly';
  end if;

  insert into public.profiles (id, role, handle, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.profile_role, 'buyer'),
    clean_handle,
    coalesce(new.raw_user_meta_data->>'full_name', clean_handle)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.platform_skills (slug, category_key, label, synonyms, sort_order)
values
  ('beat-production', 'Beat', '{"tr":"Beat prodüksiyonu","en":"Beat Production"}', array['beat', 'instrumental', '808'], 10),
  ('mixing', 'Mixing', '{"tr":"Miks","en":"Mixing"}', array['mix', 'miks', 'stem'], 20),
  ('mastering', 'Mastering', '{"tr":"Mastering","en":"Mastering"}', array['master', 'loudness', 'release'], 30),
  ('songwriting', 'Songwriting', '{"tr":"Şarkı yazımı","en":"Songwriting"}', array['lyrics', 'söz', 'topline', 'hook'], 40),
  ('vocal-feature', 'Vocal Feature', '{"tr":"Vokal katkı","en":"Vocal Feature"}', array['vocal', 'vokal', 'singer'], 50),
  ('guitar', 'Guitar', '{"tr":"Gitar","en":"Guitar"}', array['guitar', 'gitar', 'riff', 'session'], 60),
  ('jingle', 'Jingle', '{"tr":"Jingle","en":"Jingle"}', array['jingle', 'brand', 'slogan', 'reklam'], 70),
  ('cover-art', 'Cover Art', '{"tr":"Kapak görseli","en":"Cover Art"}', array['cover', 'artwork', 'kapak'], 80)
on conflict (slug) do update
set category_key = excluded.category_key,
    label = excluded.label,
    synonyms = excluded.synonyms,
    sort_order = excluded.sort_order;

insert into public.admin_accounts (user_id, notes)
select profiles.id, 'Founder bootstrap admin'
from public.profiles
join auth.users on users.id = profiles.id
where lower(coalesce(users.email, '')) = 'koraykurt.vrdn@gmail.com'
on conflict (user_id) do nothing;

insert into storage.buckets (id, name, public)
values
  ('listing-covers', 'listing-covers', true),
  ('profile-media', 'profile-media', true),
  ('audio-previews', 'audio-previews', true),
  ('license-deliverables', 'license-deliverables', false)
on conflict (id) do nothing;

create policy "Public listing media is readable"
  on storage.objects for select
  using (bucket_id in ('listing-covers', 'profile-media', 'audio-previews'));

create policy "Authenticated users can upload listing media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('listing-covers', 'profile-media', 'audio-previews')
    and owner = auth.uid()
    and (
      bucket_id <> 'profile-media'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Authenticated users can upload private license packages"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'license-deliverables'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

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

create table if not exists public.collab_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 5000),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collab_participants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.collab_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'other'
    check (role in ('producer', 'composer', 'mixing', 'mastering', 'other')),
  revenue_share numeric(5, 2) not null default 0
    check (revenue_share >= 0 and revenue_share <= 100),
  invite_status text not null default 'pending'
    check (invite_status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.collab_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.collab_projects(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_path text not null check (char_length(trim(file_path)) between 1 and 1024),
  version_note text check (version_note is null or char_length(version_note) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.collab_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.collab_projects(id) on delete cascade,
  version_id uuid not null references public.collab_versions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 4000),
  timestamp_seconds numeric(12, 3)
    check (timestamp_seconds is null or timestamp_seconds >= 0),
  parent_comment_id uuid references public.collab_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (parent_comment_id is null or parent_comment_id <> id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('collab_invite', 'new_version', 'new_comment')),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists collab_projects_owner_activity_idx
  on public.collab_projects(owner_id, updated_at desc);
create index if not exists collab_participants_user_invites_idx
  on public.collab_participants(user_id, invite_status, created_at desc);
create index if not exists collab_participants_project_idx
  on public.collab_participants(project_id, invite_status);
create index if not exists collab_versions_project_activity_idx
  on public.collab_versions(project_id, created_at desc);
create index if not exists collab_comments_version_timeline_idx
  on public.collab_comments(version_id, timestamp_seconds, created_at);
create index if not exists collab_comments_parent_idx
  on public.collab_comments(parent_comment_id)
  where parent_comment_id is not null;
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, is_read, created_at desc);

alter table public.collab_projects enable row level security;
alter table public.collab_participants enable row level security;
alter table public.collab_versions enable row level security;
alter table public.collab_comments enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_collab_project_member(
  p_project_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null and (
    exists (
      select 1 from public.collab_projects
      where id = p_project_id and owner_id = p_user_id
    )
    or exists (
      select 1 from public.collab_participants
      where project_id = p_project_id
        and user_id = p_user_id
        and invite_status = 'accepted'
    )
  );
$$;

revoke all on function public.is_collab_project_member(uuid, uuid) from public;
grant execute on function public.is_collab_project_member(uuid, uuid) to authenticated;

create or replace function public.set_collab_project_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_collab_project_updated_at on public.collab_projects;
create trigger set_collab_project_updated_at
  before update on public.collab_projects
  for each row execute procedure public.set_collab_project_updated_at();

create or replace function public.protect_collab_participant_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  project_owner uuid;
begin
  select owner_id into project_owner
  from public.collab_projects
  where id = old.project_id;

  if auth.uid() = project_owner then
    return new;
  end if;

  if auth.uid() = old.user_id then
    if (to_jsonb(new) - 'invite_status') is distinct from
       (to_jsonb(old) - 'invite_status') then
      raise exception 'Invitees can only update invite_status'
        using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'Collaboration participant update denied'
    using errcode = '42501';
end;
$$;

drop trigger if exists protect_collab_participant_fields on public.collab_participants;
create trigger protect_collab_participant_fields
  before update on public.collab_participants
  for each row execute procedure public.protect_collab_participant_update();

create or replace function public.validate_collab_comment_links()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.collab_versions
    where id = new.version_id and project_id = new.project_id
  ) then
    raise exception 'Version does not belong to collaboration project'
      using errcode = '23514';
  end if;

  if new.parent_comment_id is not null and not exists (
    select 1 from public.collab_comments
    where id = new.parent_comment_id
      and project_id = new.project_id
      and version_id = new.version_id
  ) then
    raise exception 'Parent comment does not belong to this project version'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_collab_comment_links_before_write on public.collab_comments;
create trigger validate_collab_comment_links_before_write
  before insert or update on public.collab_comments
  for each row execute procedure public.validate_collab_comment_links();

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_projects' and policyname = 'Project members can read collaboration projects') then
    create policy "Project members can read collaboration projects"
      on public.collab_projects for select to authenticated
      using (public.is_collab_project_member(id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_projects' and policyname = 'Users can create owned collaboration projects') then
    create policy "Users can create owned collaboration projects"
      on public.collab_projects for insert to authenticated
      with check (owner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_projects' and policyname = 'Owners can update collaboration projects') then
    create policy "Owners can update collaboration projects"
      on public.collab_projects for update to authenticated
      using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_projects' and policyname = 'Owners can delete collaboration projects') then
    create policy "Owners can delete collaboration projects"
      on public.collab_projects for delete to authenticated
      using (owner_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_participants' and policyname = 'Project members can read participants') then
    create policy "Project members can read participants"
      on public.collab_participants for select to authenticated
      using (user_id = auth.uid() or public.is_collab_project_member(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_participants' and policyname = 'Project owners can invite participants') then
    create policy "Project owners can invite participants"
      on public.collab_participants for insert to authenticated
      with check (exists (
        select 1 from public.collab_projects
        where id = project_id and owner_id = auth.uid()
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_participants' and policyname = 'Owners and invitees can update participants') then
    create policy "Owners and invitees can update participants"
      on public.collab_participants for update to authenticated
      using (
        user_id = auth.uid()
        or exists (select 1 from public.collab_projects where id = project_id and owner_id = auth.uid())
      )
      with check (
        user_id = auth.uid()
        or exists (select 1 from public.collab_projects where id = project_id and owner_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_participants' and policyname = 'Project owners can remove participants') then
    create policy "Project owners can remove participants"
      on public.collab_participants for delete to authenticated
      using (exists (
        select 1 from public.collab_projects
        where id = project_id and owner_id = auth.uid()
      ));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_versions' and policyname = 'Project members can read versions') then
    create policy "Project members can read versions"
      on public.collab_versions for select to authenticated
      using (public.is_collab_project_member(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_versions' and policyname = 'Project members can upload versions') then
    create policy "Project members can upload versions"
      on public.collab_versions for insert to authenticated
      with check (uploaded_by = auth.uid() and public.is_collab_project_member(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_versions' and policyname = 'Uploaders and owners can delete versions') then
    create policy "Uploaders and owners can delete versions"
      on public.collab_versions for delete to authenticated
      using (
        uploaded_by = auth.uid()
        or exists (select 1 from public.collab_projects where id = project_id and owner_id = auth.uid())
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_comments' and policyname = 'Project members can read comments') then
    create policy "Project members can read comments"
      on public.collab_comments for select to authenticated
      using (public.is_collab_project_member(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_comments' and policyname = 'Project members can create comments') then
    create policy "Project members can create comments"
      on public.collab_comments for insert to authenticated
      with check (user_id = auth.uid() and public.is_collab_project_member(project_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_comments' and policyname = 'Authors and owners can delete comments') then
    create policy "Authors and owners can delete comments"
      on public.collab_comments for delete to authenticated
      using (
        user_id = auth.uid()
        or exists (select 1 from public.collab_projects where id = project_id and owner_id = auth.uid())
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Users can read own notifications') then
    create policy "Users can read own notifications"
      on public.notifications for select to authenticated
      using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Users can mark own notifications read') then
    create policy "Users can mark own notifications read"
      on public.notifications for update to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Users can delete own notifications') then
    create policy "Users can delete own notifications"
      on public.notifications for delete to authenticated
      using (user_id = auth.uid());
  end if;
end $$;


create or replace function public.protect_notification_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'is_read') is distinct from
     (to_jsonb(old) - 'is_read') then
    raise exception 'Only is_read can be updated on a notification'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_notification_fields on public.notifications;
create trigger protect_notification_fields
  before update on public.notifications
  for each row execute procedure public.protect_notification_update();

create or replace function public.notify_collab_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, payload)
  values (
    new.user_id,
    'collab_invite',
    jsonb_build_object('project_id', new.project_id, 'participant_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists notify_after_collab_invite on public.collab_participants;
create trigger notify_after_collab_invite
  after insert on public.collab_participants
  for each row execute procedure public.notify_collab_invite();

create or replace function public.notify_collab_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, payload)
  select recipient.user_id, 'new_version',
    jsonb_build_object('project_id', new.project_id, 'version_id', new.id)
  from (
    select owner_id as user_id from public.collab_projects where id = new.project_id
    union
    select user_id from public.collab_participants
    where project_id = new.project_id and invite_status = 'accepted'
  ) recipient
  where recipient.user_id <> new.uploaded_by;
  return new;
end;
$$;

drop trigger if exists notify_after_collab_version on public.collab_versions;
create trigger notify_after_collab_version
  after insert on public.collab_versions
  for each row execute procedure public.notify_collab_version();

create or replace function public.notify_collab_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, payload)
  select recipient.user_id, 'new_comment',
    jsonb_build_object(
      'project_id', new.project_id,
      'version_id', new.version_id,
      'comment_id', new.id
    )
  from (
    select owner_id as user_id from public.collab_projects where id = new.project_id
    union
    select user_id from public.collab_participants
    where project_id = new.project_id and invite_status = 'accepted'
  ) recipient
  where recipient.user_id <> new.user_id;
  return new;
end;
$$;

drop trigger if exists notify_after_collab_comment on public.collab_comments;
create trigger notify_after_collab_comment
  after insert on public.collab_comments
  for each row execute procedure public.notify_collab_comment();

insert into storage.buckets (id, name, public)
values ('collab-files', 'collab-files', false)
on conflict (id) do update set public = false;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Collab members can read project files') then
    create policy "Collab members can read project files"
      on storage.objects for select to authenticated
      using (
        bucket_id = 'collab-files'
        and exists (
          select 1 from public.collab_projects
          where id::text = (storage.foldername(name))[1]
            and public.is_collab_project_member(id)
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Collab members can upload project files') then
    create policy "Collab members can upload project files"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'collab-files'
        and owner = auth.uid()
        and exists (
          select 1 from public.collab_projects
          where id::text = (storage.foldername(name))[1]
            and public.is_collab_project_member(id)
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Uploaders and owners can delete project files') then
    create policy "Uploaders and owners can delete project files"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'collab-files'
        and (
          owner = auth.uid()
          or exists (
            select 1 from public.collab_projects
            where id::text = (storage.foldername(name))[1]
              and owner_id = auth.uid()
          )
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collab_projects') then
    alter publication supabase_realtime add table public.collab_projects;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collab_participants') then
    alter publication supabase_realtime add table public.collab_participants;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collab_versions') then
    alter publication supabase_realtime add table public.collab_versions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collab_comments') then
    alter publication supabase_realtime add table public.collab_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

alter table public.collab_projects
  add column if not exists listing_id uuid references public.listings(id) on delete set null;

create unique index if not exists collab_projects_listing_unique_idx
  on public.collab_projects(listing_id)
  where listing_id is not null;

create table if not exists public.revenue_splits (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests(id) on delete cascade,
  project_id uuid not null references public.collab_projects(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  percentage numeric(5, 2) not null check (percentage > 0 and percentage <= 100),
  gross_amount numeric(12, 2) not null check (gross_amount >= 0),
  split_amount numeric(12, 2) not null check (split_amount >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'TRY')),
  created_at timestamptz not null default now(),
  unique (order_request_id, recipient_id)
);

create index if not exists revenue_splits_recipient_activity_idx
  on public.revenue_splits(recipient_id, created_at desc);
create index if not exists revenue_splits_project_idx
  on public.revenue_splits(project_id, created_at desc);

alter table public.revenue_splits enable row level security;

drop policy if exists "Recipients and owners can read revenue splits"
  on public.revenue_splits;
create policy "Recipients and owners can read revenue splits"
  on public.revenue_splits for select to authenticated
  using (
    recipient_id = auth.uid()
    or exists (
      select 1 from public.collab_projects
      where collab_projects.id = revenue_splits.project_id
        and collab_projects.owner_id = auth.uid()
    )
  );

create or replace function public.validate_collab_revenue_share_total()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allocated numeric;
begin
  select coalesce(sum(revenue_share), 0)
    into allocated
  from public.collab_participants
  where project_id = new.project_id
    and invite_status <> 'declined'
    and id <> new.id;

  if new.invite_status <> 'declined' then
    allocated := allocated + new.revenue_share;
  end if;

  if allocated > 100 then
    raise exception 'Collaboration revenue shares cannot exceed 100 percent'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_collab_revenue_share_before_write
  on public.collab_participants;
create trigger validate_collab_revenue_share_before_write
  before insert or update of revenue_share, invite_status, project_id
  on public.collab_participants
  for each row execute procedure public.validate_collab_revenue_share_total();


create or replace function public.validate_collab_project_listing()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  share_total numeric;
begin
  if new.listing_id is not null and not exists (
    select 1 from public.listings
    where listings.id = new.listing_id
      and listings.creator_id = new.owner_id
  ) then
    raise exception 'Collaboration listing must belong to the project owner'
      using errcode = '23514';
  end if;

  if new.status = 'completed' then
    select coalesce(sum(revenue_share), 0)
      into share_total
    from public.collab_participants
    where project_id = new.id
      and invite_status = 'accepted';

    if share_total > 100 then
      raise exception 'Accepted collaboration revenue shares cannot exceed 100 percent'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_collab_project_before_write on public.collab_projects;
create trigger validate_collab_project_before_write
  before insert or update on public.collab_projects
  for each row execute procedure public.validate_collab_project_listing();

create or replace function public.get_my_collab_invitations()
returns table (
  participant_id uuid,
  project_id uuid,
  project_title text,
  project_description text,
  owner_id uuid,
  owner_handle text,
  participant_role text,
  revenue_share numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    participant.id,
    project.id,
    project.title,
    project.description,
    project.owner_id,
    owner_profile.handle,
    participant.role,
    participant.revenue_share,
    participant.created_at
  from public.collab_participants participant
  join public.collab_projects project on project.id = participant.project_id
  left join public.profiles owner_profile on owner_profile.id = project.owner_id
  where participant.user_id = auth.uid()
    and participant.invite_status = 'pending'
  order by participant.created_at desc;
$$;

revoke all on function public.get_my_collab_invitations() from public;
grant execute on function public.get_my_collab_invitations() to authenticated;

create or replace function public.create_order_revenue_splits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_record public.collab_projects%rowtype;
  gross numeric(12, 2);
  participant_total numeric(5, 2);
begin
  if new.status <> 'delivered' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'delivered' then
    return new;
  end if;

  select * into project_record
  from public.collab_projects
  where listing_id = new.listing_id
    and status = 'completed'
  limit 1;

  if project_record.id is null then
    return new;
  end if;

  gross := coalesce(new.license_price, new.budget, 0);

  select coalesce(sum(revenue_share), 0)
    into participant_total
  from public.collab_participants
  where project_id = project_record.id
    and invite_status = 'accepted';

  if participant_total > 100 then
    raise exception 'Collaboration revenue shares exceed 100 percent'
      using errcode = '23514';
  end if;

  insert into public.revenue_splits (
    order_request_id,
    project_id,
    recipient_id,
    percentage,
    gross_amount,
    split_amount
  )
  select
    new.id,
    project_record.id,
    recipient.user_id,
    sum(recipient.percentage),
    gross,
    round(gross * sum(recipient.percentage) / 100, 2)
  from (
    select user_id, revenue_share as percentage
    from public.collab_participants
    where project_id = project_record.id
      and invite_status = 'accepted'
      and revenue_share > 0
    union all
    select project_record.owner_id, 100 - participant_total
    where participant_total < 100
  ) recipient
  group by recipient.user_id
  on conflict (order_request_id, recipient_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_revenue_splits_after_order_delivery
  on public.order_requests;
create trigger create_revenue_splits_after_order_delivery
  after insert or update of status on public.order_requests
  for each row execute procedure public.create_order_revenue_splits();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'revenue_splits'
  ) then
    alter publication supabase_realtime add table public.revenue_splits;
  end if;
end $$;
