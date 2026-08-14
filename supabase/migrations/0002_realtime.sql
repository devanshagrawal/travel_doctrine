-- Wander — enable Realtime on the app's tables
-- Paste into the Supabase SQL editor and run. Safe to re-run.
-- After this, a collaborator's changes push to everyone viewing the trip.

do $$
declare t text;
begin
  foreach t in array array[
    'trips','trip_members','budget_categories','expenses','expense_splits',
    'cash_wallets','settlements','itinerary_items','todos','flights','hotels','documents'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
