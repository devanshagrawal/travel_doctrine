-- Wander — attach a receipt image to any expense.
-- Paste into the Supabase SQL editor and run. Safe to re-run.

alter table public.expenses add column if not exists receipt_uri text;
