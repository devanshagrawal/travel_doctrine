-- Wander — the "webhook" that calls the scan-receipt edge function.
-- This is exactly what Supabase's Database Webhooks UI creates under the hood:
-- a trigger that POSTs the new row to your edge function.
--
-- Fires ONLY for scanned receipts (pending + has an image), so normal expenses
-- don't call the function.
--
-- REQUIREMENTS:
--   • the scan-receipt function is deployed with "Verify JWT" OFF
--   • replace REPLACE_WITH_YOUR_SECRET below with the same value you set for
--     the SCAN_WEBHOOK_SECRET function secret (or leave it if you didn't set one)
--
-- Paste into the Supabase SQL editor and run.

drop trigger if exists scan_receipt_hook on public.expenses;

create trigger scan_receipt_hook
  after insert on public.expenses
  for each row
  when (new.status = 'pending' and new.receipt_uri is not null)
  execute function supabase_functions.http_request(
    'https://jyxzncoqmhubvoebolid.supabase.co/functions/v1/scan-receipt',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"REPLACE_WITH_YOUR_SECRET"}',
    '{}',
    '5000'
  );
