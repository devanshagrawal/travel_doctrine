-- Wander — planned/booked activities (tours, tickets, experiences)
-- Paste into the Supabase SQL editor and run. Safe to re-run.
-- Behaves like flights/hotels: price → expense, ticket → document, and it
-- surfaces on the itinerary (links keyed by the activity id via source_id).

create table if not exists public.activities (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references public.trips (id) on delete cascade,
  name              text not null default '',
  activity_date     date not null,
  time              text,
  location          text,
  price             numeric,
  currency          text,
  platform          text,
  booking_proof_uri text,
  notes             text,
  created_at        timestamptz not null default now()
);
create index if not exists activities_trip_idx on public.activities (trip_id);

alter table public.activities enable row level security;

drop policy if exists activities_member_all on public.activities;
create policy activities_member_all on public.activities
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activities'
  ) then
    execute 'alter publication supabase_realtime add table public.activities';
  end if;
end $$;
