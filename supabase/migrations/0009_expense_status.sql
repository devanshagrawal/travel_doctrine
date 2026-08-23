-- Wander — pending/confirmed status for expenses (for scanned-receipt review).
-- Paste into the Supabase SQL editor and run. Safe to re-run.
-- Scanned receipts land as 'pending' and don't count toward the budget until a
-- trip member approves them; normal expenses default to 'confirmed'.

alter table public.expenses
  add column if not exists status text not null default 'confirmed'
  check (status in ('pending', 'confirmed'));
