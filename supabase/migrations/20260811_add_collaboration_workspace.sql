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
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collab_participants' and policyname = 'Owners and invitees can remove participants') then
    create policy "Owners and invitees can remove participants"
      on public.collab_participants for delete to authenticated
      using (
        user_id = auth.uid()
        or exists (select 1 from public.collab_projects where id = project_id and owner_id = auth.uid())
      );
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
