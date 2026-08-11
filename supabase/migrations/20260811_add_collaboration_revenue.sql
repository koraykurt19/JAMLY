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
