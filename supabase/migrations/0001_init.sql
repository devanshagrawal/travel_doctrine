-- Wander — initial schema
-- Paste this whole file into the Supabase SQL editor (Dashboard → SQL → New query) and run it.
-- Safe to re-run: everything is guarded with IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, auto-created on sign-up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  email         text not null default '',
  home_currency text not null default 'USD',
  avatar_color  text not null default '#C2703D',
  created_at    timestamptz not null default now()
);

-- Keep profiles in sync with auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  destination   text not null default '',
  start_date    date not null,
  end_date      date not null,
  base_currency text not null default 'USD',
  total_budget  numeric not null default 0,
  cover_color   text not null default '#C2703D',
  cover_image   text,
  emoji         text not null default '🌍',
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- trip_members — collaborators (join table). user_id is null for people who
-- were invited by email but haven't signed up / been claimed yet.
-- ---------------------------------------------------------------------------
create table if not exists public.trip_members (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete set null,
  name         text not null default '',
  email        text not null default '',
  avatar_color text not null default '#C2703D',
  role         text not null default 'editor' check (role in ('owner','editor')),
  created_at   timestamptz not null default now()
);
create index if not exists trip_members_trip_idx  on public.trip_members (trip_id);
create index if not exists trip_members_user_idx  on public.trip_members (user_id);
create index if not exists trip_members_email_idx on public.trip_members (lower(email));

-- ---------------------------------------------------------------------------
-- budget_categories
-- ---------------------------------------------------------------------------
create table if not exists public.budget_categories (
  id       uuid primary key default gen_random_uuid(),
  trip_id  uuid not null references public.trips (id) on delete cascade,
  name     text not null,
  planned  numeric not null default 0,
  color    text not null default '#94A3B8',
  icon     text not null default 'pricetag-outline'
);
create index if not exists budget_categories_trip_idx on public.budget_categories (trip_id);

-- ---------------------------------------------------------------------------
-- expenses (+ expense_splits join for equal splits)
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips (id) on delete cascade,
  category_id uuid references public.budget_categories (id) on delete set null,
  amount      numeric not null default 0,
  currency    text not null default 'USD',
  description text not null default '',
  spent_at    date not null default current_date,
  paid_by     text,                                   -- legacy display label
  paid_by_id  uuid references public.trip_members (id) on delete set null,
  split_type  text not null default 'none' check (split_type in ('none','equal')),
  paid_from   text not null default 'regular' check (paid_from in ('regular','cash')),
  source_id   uuid,                                   -- flight/hotel that generated it
  created_at  timestamptz not null default now()
);
create index if not exists expenses_trip_idx on public.expenses (trip_id);

create table if not exists public.expense_splits (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  member_id  uuid not null references public.trip_members (id) on delete cascade,
  primary key (expense_id, member_id)
);

-- ---------------------------------------------------------------------------
-- cash_wallets (Model A)
-- ---------------------------------------------------------------------------
create table if not exists public.cash_wallets (
  id       uuid primary key default gen_random_uuid(),
  trip_id  uuid not null references public.trips (id) on delete cascade,
  currency text not null,
  balance  numeric not null default 0,
  loaded   numeric not null default 0,
  unique (trip_id, currency)
);

-- ---------------------------------------------------------------------------
-- settlements — recorded payoffs between two members
-- ---------------------------------------------------------------------------
create table if not exists public.settlements (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips (id) on delete cascade,
  from_id    uuid not null references public.trip_members (id) on delete cascade,
  to_id      uuid not null references public.trip_members (id) on delete cascade,
  amount     numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists settlements_trip_idx on public.settlements (trip_id);

-- ---------------------------------------------------------------------------
-- itinerary_items
-- ---------------------------------------------------------------------------
create table if not exists public.itinerary_items (
  id        uuid primary key default gen_random_uuid(),
  trip_id   uuid not null references public.trips (id) on delete cascade,
  day_date  date not null,
  time      text,
  title     text not null,
  type      text not null default 'other' check (type in ('activity','transport','food','stay','other')),
  location  text,
  notes     text,
  source_id uuid
);
create index if not exists itinerary_trip_idx on public.itinerary_items (trip_id);

-- ---------------------------------------------------------------------------
-- documents — trip_id null = lives in the owner's global wallet
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  trip_id     uuid references public.trips (id) on delete cascade,
  type        text not null default 'other' check (type in ('passport','id','visa','insurance','other')),
  title       text not null,
  file_uri    text,
  number      text,
  expiry_date date,
  source_id   uuid,
  source_tag  text,
  created_at  timestamptz not null default now()
);
create index if not exists documents_owner_idx on public.documents (owner_id);
create index if not exists documents_trip_idx  on public.documents (trip_id);

-- ---------------------------------------------------------------------------
-- todos
-- ---------------------------------------------------------------------------
create table if not exists public.todos (
  id       uuid primary key default gen_random_uuid(),
  trip_id  uuid not null references public.trips (id) on delete cascade,
  title    text not null,
  category text not null default 'todo' check (category in ('todo','packing','shopping','notes')),
  done     boolean not null default false
);
create index if not exists todos_trip_idx on public.todos (trip_id);

-- ---------------------------------------------------------------------------
-- flights
-- ---------------------------------------------------------------------------
create table if not exists public.flights (
  id                 uuid primary key default gen_random_uuid(),
  trip_id            uuid not null references public.trips (id) on delete cascade,
  airline            text not null default '',
  depart_at          timestamptz not null,
  price              numeric,
  currency           text,
  booking_proof_uri  text,
  boarding_pass_uri  text,
  flight_no          text,
  from_code          text,
  to_code            text,
  from_city          text,
  to_city            text,
  arrive_at          timestamptz,
  seat               text
);
create index if not exists flights_trip_idx on public.flights (trip_id);

-- ---------------------------------------------------------------------------
-- hotels
-- ---------------------------------------------------------------------------
create table if not exists public.hotels (
  id               uuid primary key default gen_random_uuid(),
  trip_id          uuid not null references public.trips (id) on delete cascade,
  name             text not null default '',
  check_in         date not null,
  check_out        date not null,
  total_price      numeric,
  currency         text,
  proof_uri        text,
  address          text,
  confirmation_no  text,
  price_per_night  numeric
);
create index if not exists hotels_trip_idx on public.hotels (trip_id);

-- ---------------------------------------------------------------------------
-- Membership helper (SECURITY DEFINER avoids recursive RLS on trip_members)
-- ---------------------------------------------------------------------------
create or replace function public.is_trip_member(p_trip uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip and m.user_id = auth.uid()
  );
$$;

-- Claim any invites addressed to the signed-in user's email.
-- Call this once right after login (RPC): select public.claim_invites();
create or replace function public.claim_invites()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  my_email text;
  claimed  integer;
begin
  select email into my_email from public.profiles where id = auth.uid();
  if my_email is null then return 0; end if;

  update public.trip_members
     set user_id = auth.uid()
   where user_id is null
     and lower(email) = lower(my_email);

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.trips             enable row level security;
alter table public.trip_members      enable row level security;
alter table public.budget_categories enable row level security;
alter table public.expenses          enable row level security;
alter table public.expense_splits    enable row level security;
alter table public.cash_wallets      enable row level security;
alter table public.settlements       enable row level security;
alter table public.itinerary_items   enable row level security;
alter table public.documents         enable row level security;
alter table public.todos             enable row level security;
alter table public.flights           enable row level security;
alter table public.hotels            enable row level security;

-- profiles: readable by any signed-in user (needed to show crew names);
-- writable only by the owner.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- trips: any member can read; owner can write.
drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips
  for select to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id));
drop policy if exists trips_insert on public.trips;
create policy trips_insert on public.trips
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists trips_update on public.trips;
create policy trips_update on public.trips
  for update to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id));
drop policy if exists trips_delete on public.trips;
create policy trips_delete on public.trips
  for delete to authenticated using (owner_id = auth.uid());

-- trip_members: a member can see the crew; the trip owner manages it.
drop policy if exists members_select on public.trip_members;
create policy members_select on public.trip_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_trip_member(trip_id));
drop policy if exists members_write on public.trip_members;
create policy members_write on public.trip_members
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

-- All per-trip child tables: any member can read & write.
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'budget_categories','expenses','cash_wallets','settlements',
    'itinerary_items','todos','flights','hotels'
  ] loop
    execute format('drop policy if exists %I_member_all on public.%I', tbl, tbl);
    execute format(
      'create policy %I_member_all on public.%I for all to authenticated '
      || 'using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id))',
      tbl, tbl);
  end loop;
end $$;

-- expense_splits: gated through its parent expense's trip.
drop policy if exists expense_splits_all on public.expense_splits;
create policy expense_splits_all on public.expense_splits
  for all to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_trip_member(e.trip_id)))
  with check (exists (select 1 from public.expenses e where e.id = expense_id and public.is_trip_member(e.trip_id)));

-- documents: global docs (trip_id null) are private to the owner; trip docs
-- are visible to every member of that trip.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select to authenticated
  using (owner_id = auth.uid() or (trip_id is not null and public.is_trip_member(trip_id)));
drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents
  for all to authenticated
  using (owner_id = auth.uid() or (trip_id is not null and public.is_trip_member(trip_id)))
  with check (owner_id = auth.uid() or (trip_id is not null and public.is_trip_member(trip_id)));

-- ---------------------------------------------------------------------------
-- Storage buckets for cover photos and document scans
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Covers: public read; any signed-in user may upload/manage their own files.
drop policy if exists covers_read on storage.objects;
create policy covers_read on storage.objects
  for select using (bucket_id = 'covers');
drop policy if exists covers_write on storage.objects;
create policy covers_write on storage.objects
  for all to authenticated
  using (bucket_id = 'covers' and owner = auth.uid())
  with check (bucket_id = 'covers' and owner = auth.uid());

-- Documents: private; only the uploader can read/write their objects.
drop policy if exists documents_obj_all on storage.objects;
create policy documents_obj_all on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and owner = auth.uid())
  with check (bucket_id = 'documents' and owner = auth.uid());
