alter table public.collab_projects enable row level security;
alter table public.collab_participants enable row level security;
alter table public.collab_versions enable row level security;
alter table public.collab_comments enable row level security;

drop policy if exists "Owners and invitees can remove participants"
  on public.collab_participants;
drop policy if exists "Project owners can remove participants"
  on public.collab_participants;

create policy "Project owners can remove participants"
  on public.collab_participants for delete to authenticated
  using (exists (
    select 1
    from public.collab_projects
    where collab_projects.id = collab_participants.project_id
      and collab_projects.owner_id = auth.uid()
  ));
