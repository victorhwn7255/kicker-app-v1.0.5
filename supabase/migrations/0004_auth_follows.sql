-- Phase 6 - auth, follows. RLS so a user only ever touches their OWN rows, and a
-- trigger that provisions a public.users row on signup (follows FK needs it).

-- Provision public.users on auth signup (runs as definer, so it bypasses RLS).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- users: a user may read their own row.
drop policy if exists "own user read" on public.users;
create policy "own user read" on public.users for select using (auth.uid() = id);
grant select on public.users to authenticated;

-- follows: a user reads, adds, and removes only their own follows.
drop policy if exists "own follows read" on public.follows;
drop policy if exists "own follows insert" on public.follows;
drop policy if exists "own follows delete" on public.follows;
create policy "own follows read" on public.follows for select using (auth.uid() = user_id);
create policy "own follows insert" on public.follows for insert with check (auth.uid() = user_id);
create policy "own follows delete" on public.follows for delete using (auth.uid() = user_id);
grant select, insert, delete on public.follows to authenticated;
