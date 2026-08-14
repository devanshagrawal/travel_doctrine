import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useStore } from '../store/useStore';
import { User } from './types';

interface AuthContextValue {
  session: Session | null;
  loading: boolean; // true until the initial session check resolves
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Pull the signed-in user's profile row and mirror it into the zustand store
// as `user` so existing screens (greeting, profile, "isMe" crew rows) keep
// working while the data layer is migrated table-by-table. Also claims any
// pending email invites addressed to this account.
async function syncProfile(session: Session) {
  await supabase.rpc('claim_invites').then(undefined, () => {});
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();
  const user: User = {
    id: session.user.id,
    fullName: data?.full_name || (session.user.user_metadata?.full_name as string) || '',
    email: data?.email || session.user.email || '',
    homeCurrency: data?.home_currency || 'USD',
    avatarColor: data?.avatar_color || '#C2703D',
  };
  useStore.setState({ user, isAuthed: true });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await syncProfile(data.session);
      else useStore.setState({ isAuthed: false, user: null });
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) syncProfile(s);
      else useStore.setState({ isAuthed: false, user: null });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
