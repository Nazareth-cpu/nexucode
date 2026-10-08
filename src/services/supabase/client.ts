/**
 * Centralized Supabase Browser Client Singleton
 *
 * Exclusively uses client-safe public keys.
 * Do not instantiate multiple clients.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, requireSupabaseConfig } from './config';

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client instance.
 * Throws a descriptive error if environment variables are not properly configured.
 */
export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();

  clientInstance = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'student_chapter_auth_token',
    },
  });

  return clientInstance;
}

/**
 * Returns the singleton instance if configured, or null if credentials are not yet set.
 * Useful for non-fatal status verification checks in the UI.
 */
export function getOptionalSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }
  return getSupabaseClient();
}

/**
 * Exported singleton proxy for seamless consumption across services.
 * Fails clearly and predictably if required Supabase environment variables are missing.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabaseClient();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
