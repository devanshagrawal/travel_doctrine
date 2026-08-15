import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User } from './types';

interface AuthContextValue {
  session: Session | null;
  user: User | null; // the signed-in user's profile
  loading: boolean; // true until the initial session check resolves
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Load the signed-in user's profile row (claiming any pending email invites
// first) and shape it into the app's User type.
async function fetchProfile(session: Session): Promise<User> {
  await supabase.rpc('claim_invites').then(undefined, () => {});
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();
  return {
    id: session.user.id,
    fullName: data?.full_name || (session.user.user_metadata?.full_name as string) || '',
    email: data?.email || session.user.email || '',
    homeCurrency: data?.home_currency || 'USD',
    avatarColor: data?.avatar_color || '#C2703D',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session ? await fetchProfile(data.session) : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fetchProfile(s).then((u) => { if (active) setUser(u); });
      else setUser(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (fullName, email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      // With "Confirm email" on there's a user but no session until they click
      // the link; with it off we get a session straight away.
      return { needsConfirmation: !data.session };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    updateProfile: async (patch) => {
      const uid = session?.user.id;
      if (!uid) return;
      const row: Record<string, unknown> = {};
      if (patch.fullName !== undefined) row.full_name = patch.fullName;
      if (patch.email !== undefined) row.email = patch.email;
      if (patch.homeCurrency !== undefined) row.home_currency = patch.homeCurrency;
      if (patch.avatarColor !== undefined) row.avatar_color = patch.avatarColor;
      const { error } = await supabase.from('profiles').update(row).eq('id', uid);
      if (error) throw error;
      setUser((u) => (u ? { ...u, ...patch } : u));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
