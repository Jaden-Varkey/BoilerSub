alter table public.users enable row level security;
alter table public.listings enable row level security;

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
  on public.users
  for select
  to authenticated
  using (true);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "listings_select_authenticated" on public.listings;
create policy "listings_select_authenticated"
  on public.listings
  for select
  to authenticated
  using (true);

drop policy if exists "listings_insert_owner" on public.listings;
create policy "listings_insert_owner"
  on public.listings
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "listings_update_owner" on public.listings;
create policy "listings_update_owner"
  on public.listings
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "listings_delete_owner" on public.listings;
create policy "listings_delete_owner"
  on public.listings
  for delete
  to authenticated
  using (auth.uid() = owner_id);
