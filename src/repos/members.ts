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
