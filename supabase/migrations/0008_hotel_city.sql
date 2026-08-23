-- Wander — optional city on hotels (improves the "Open in Maps" search).
-- Paste into the Supabase SQL editor and run. Safe to re-run.

alter table public.hotels add column if not exists city text;
