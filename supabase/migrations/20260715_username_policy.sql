alter table public.profiles
  add column if not exists handle_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_handle_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_handle_format_check
      check (handle ~ '^[a-z0-9][a-z0-9-]{1,31}$') not valid;
  end if;
end;
$$;

update public.profiles
set handle_updated_at = created_at
where handle_updated_at is null;

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

drop trigger if exists enforce_monthly_handle_change_before_profile_update on public.profiles;

create trigger enforce_monthly_handle_change_before_profile_update
  before update on public.profiles
  for each row execute procedure public.enforce_monthly_handle_change();

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

  insert into public.profiles (id, role, handle, full_name, handle_updated_at)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.profile_role, 'buyer'),
    clean_handle,
    coalesce(new.raw_user_meta_data->>'full_name', clean_handle),
    now()
  );

  return new;
end;
$$;
