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

update public.profiles as profile
set headline = null
where lower(trim(coalesce(profile.headline, ''))) = lower('Founder of Jamly')
  and not exists (
    select 1
    from auth.users as account
    where account.id = profile.id
      and lower(coalesce(account.email, '')) = 'koraykurt.vrdn@gmail.com'
  );

drop trigger if exists enforce_reserved_profile_headline_before_write on public.profiles;

create trigger enforce_reserved_profile_headline_before_write
  before insert or update of headline on public.profiles
  for each row execute procedure public.enforce_reserved_profile_headline();
