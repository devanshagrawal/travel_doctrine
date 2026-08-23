import { supabase } from '../lib/supabase';
import { Collaborator, CollaboratorRole } from '../lib/types';

export interface MemberRow {
  id: string;
  trip_id: string;
  user_id: string | null;
  name: string;
  email: string;
  avatar_color: string;
  role: CollaboratorRole;
}

export function rowToCollaborator(r: MemberRow, meId: string | null): Collaborator {
  return {
    id: r.id,
    tripId: r.trip_id,
    name: r.name,
    email: r.email,
    avatarColor: r.avatar_color,
    role: r.role,
    isMe: !!meId && r.user_id === meId,
    pending: !r.user_id,
  };
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function listMembers(tripId: string): Promise<Collaborator[]> {
  const meId = await currentUserId();
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as MemberRow[]).map((r) => rowToCollaborator(r, meId));
}

// Avatar colours assigned to invited collaborators in order (matches the prototype).
const CREW_COLORS = ['#0D9488', '#9333EA', '#E11D48', '#0EA5E9', '#CA8A04', '#16A34A', '#F97316'];

// Invite someone by email. user_id stays null until they sign in and
// claim_invites() links the row to their account (see AuthProvider).
export async function inviteMember(tripId: string, name: string, email: string): Promise<void> {
  const { count } = await supabase
    .from('trip_members')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId);
  const color = CREW_COLORS[(count ?? 0) % CREW_COLORS.length];
  const { error } = await supabase.from('trip_members').insert({
    trip_id: tripId,
    user_id: null,
    name: name.trim() || email.trim().split('@')[0],
    email: email.trim(),
    avatar_color: color,
    role: 'editor',
  });
  if (error) throw error;
}

export async function removeMember(id: string): Promise<void> {
  const { error } = await supabase.from('trip_members').delete().eq('id', id);
  if (error) throw error;
}

// Redeem an email-locked invite link (the pending member row's id). Returns
// the trip_id on success; throws with a friendly message otherwise.
export async function redeemInvite(memberId: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_invite', { p_member: memberId });
  if (error) throw error;
  return data as string;
}
