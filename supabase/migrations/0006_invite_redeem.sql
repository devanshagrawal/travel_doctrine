-- Wander — redeem an email-locked invite link.
-- Paste into the Supabase SQL editor and run. Safe to re-run.
--
-- The invite is the pending trip_members row (user_id null). Its id is the
-- link token. redeem_invite links the signed-in user to the trip ONLY if
-- their account email matches the invited email. Returns the trip_id.

create or replace function public.redeem_invite(p_member uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_trip     uuid;
  v_email    text;
  v_user     uuid;
  v_my_email text;
begin
  select trip_id, lower(email), user_id
    into v_trip, v_email, v_user
    from public.trip_members
   where id = p_member;

  if v_trip is null then
    raise exception 'This invite link is not valid.';
  end if;

  select lower(email) into v_my_email from public.profiles where id = auth.uid();
  if v_my_email is null then
    raise exception 'Please sign in to accept this invite.';
  end if;

  -- Already linked?
  if v_user is not null then
    if v_user = auth.uid() then
      return v_trip; -- already a member; treat as success
    end if;
    raise exception 'This invite has already been used.';
  end if;

  if v_email <> v_my_email then
    raise exception 'This invite is for a different email address.';
  end if;

  update public.trip_members set user_id = auth.uid() where id = p_member;
  return v_trip;
end;
$$;

grant execute on function public.redeem_invite(uuid) to authenticated;
