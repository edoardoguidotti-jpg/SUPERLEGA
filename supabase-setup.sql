-- Esegui questo DOPO aver creato players, matches e appearances.

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.appearances enable row level security;

create policy "public read players" on public.players for select to anon, authenticated using (true);
create policy "public read matches" on public.matches for select to anon, authenticated using (true);
create policy "public read appearances" on public.appearances for select to anon, authenticated using (true);

create policy "authenticated manage players" on public.players for all to authenticated using (true) with check (true);
create policy "authenticated manage matches" on public.matches for all to authenticated using (true) with check (true);
create policy "authenticated manage appearances" on public.appearances for all to authenticated using (true) with check (true);
