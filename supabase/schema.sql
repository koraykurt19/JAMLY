create extension if not exists "pgcrypto";

create type public.profile_role as enum ('creator', 'buyer');
create type public.listing_category as enum (
  'Beat',
  'Mixing',
  'Mastering',
  'Songwriting',
  'Vocal Feature',
  'Custom Production'
);
create type public.license_type as enum (
  'Basic Lease',
  'Premium Lease',
  'Exclusive',
  'Service'
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
  handle text not null unique,
  full_name text not null,
  headline text,
  avatar_url text,
  cover_url text,
  location text,
  bio text,
  specialties text[] default '{}',
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
  description text not null,
  audio_preview_url text not null,
  cover_image_url text not null,
  license_type public.license_type not null,
  turnaround text,
  tags text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  budget numeric(10, 2),
  status public.order_status not null default 'requested',
  created_at timestamptz not null default now()
);

create index listings_creator_id_idx on public.listings(creator_id);
create index listings_category_idx on public.listings(category);
create index listings_genre_idx on public.listings(genre);
create index listings_price_idx on public.listings(price);
create index order_requests_buyer_id_idx on public.order_requests(buyer_id);
create index order_requests_creator_id_idx on public.order_requests(creator_id);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.order_requests enable row level security;

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

create policy "Active listings are readable"
  on public.listings for select
  using (is_active = true);

create policy "Creators can insert their listings"
  on public.listings for insert
  with check (
    auth.uid() = creator_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'creator'
    )
  );

create policy "Creators can update their listings"
  on public.listings for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Order participants can read requests"
  on public.order_requests for select
  using (auth.uid() = buyer_id or auth.uid() = creator_id);

create policy "Buyers can create order requests"
  on public.order_requests for insert
  with check (
    auth.uid() = buyer_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'buyer'
    )
  );

create policy "Order participants can update status"
  on public.order_requests for update
  using (auth.uid() = buyer_id or auth.uid() = creator_id)
  with check (auth.uid() = buyer_id or auth.uid() = creator_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  clean_handle text;
begin
  clean_handle := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)), '[^a-z0-9_]+', '', 'g'));

  insert into public.profiles (id, role, handle, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.profile_role, 'buyer'),
    clean_handle || '-' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'full_name', clean_handle)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values
  ('listing-covers', 'listing-covers', true),
  ('audio-previews', 'audio-previews', true)
on conflict (id) do nothing;

create policy "Public listing media is readable"
  on storage.objects for select
  using (bucket_id in ('listing-covers', 'audio-previews'));

create policy "Authenticated users can upload listing media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('listing-covers', 'audio-previews')
    and owner = auth.uid()
  );
