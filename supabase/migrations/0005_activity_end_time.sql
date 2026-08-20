-- Wander — optional start/end time on activities (and carry the end time
-- into the itinerary so the timeline can show a range).
-- Paste into the Supabase SQL editor and run. Safe to re-run.

alter table public.activities      add column if not exists end_time text;
alter table public.itinerary_items add column if not exists end_time text;
