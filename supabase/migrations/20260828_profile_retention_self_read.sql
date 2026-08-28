begin;

drop policy if exists "Members read own retention settings" on public.profile_retention_settings;
create policy "Members read own retention settings"
  on public.profile_retention_settings for select
  using (profile_id = auth.uid() or public.admin_has('admin.manage'));

commit;
