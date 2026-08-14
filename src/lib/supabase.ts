import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// URL + anon key are public by design (the anon key is safe to ship in a
// client bundle — row-level security is what actually protects the data).
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://jyxzncoqmhubvoebolid.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_u-Alef_7tYivmfUcWdgY8Q_G5AH0t-6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // email/password flow, no OAuth redirect to parse
  },
});
