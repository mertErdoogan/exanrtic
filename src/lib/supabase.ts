import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { backendConfigured, config } from './config';

/**
 * Supabase is optional at this stage: the app is fully local-first and only
 * the AI site report needs the backend. Sessions are anonymous by default,
 * so nobody has to create an account to use the report.
 */
let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!backendConfigured) return null;
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export async function ensureAnonymousSession(): Promise<SupabaseClient | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    const { error } = await sb.auth.signInAnonymously();
    if (error) throw error;
  }
  return sb;
}
