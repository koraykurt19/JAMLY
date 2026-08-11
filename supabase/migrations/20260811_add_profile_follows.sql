create table if not exists public.profile_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists profile_follows_following_activity_idx
  on public.profile_follows(following_id, created_at desc);

create index if not exists profile_follows_follower_activity_idx
  on public.profile_follows(follower_id, created_at desc);

alter table public.profile_follows enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_follows'
      and policyname = 'Profile follows are publicly readable'
  ) then
    create policy "Profile follows are publicly readable"
      on public.profile_follows for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_follows'
      and policyname = 'Users can follow creators'
  ) then
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_follows'
      and policyname = 'Users can unfollow creators'
  ) then
    create policy "Users can unfollow creators"
      on public.profile_follows for delete
      to authenticated
      using (auth.uid() = follower_id);
  end if;
end
$$;
