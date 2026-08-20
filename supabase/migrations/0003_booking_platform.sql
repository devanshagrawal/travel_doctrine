-- Wander — optional "booked via" platform on flights & hotels
-- Paste into the Supabase SQL editor and run. Safe to re-run.

alter table public.flights add column if not exists platform text;
alter table public.hotels  add column if not exists platform text;
