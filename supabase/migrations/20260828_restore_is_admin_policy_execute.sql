-- RLS policies still call public.is_admin(auth.uid()). PostgreSQL checks EXECUTE
-- privilege for those policy calls against the invoking role, so authenticated
-- users need permission even though the function runs as SECURITY DEFINER.
grant execute on function public.is_admin(uuid) to authenticated;
