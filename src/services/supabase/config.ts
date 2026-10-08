/**
 * Supabase Environment Configuration & Validation
 *
 * Reads client-side Supabase configuration strictly from Vite environment variables.
 * Never expose the Supabase service-role or secret keys to the browser.
 */

export interface SupabaseEnvConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

/**
 * Validates and retrieves the Supabase public configuration.
 * Returns null if the configuration is missing or invalid.
 */
export function getSupabaseConfig(): SupabaseEnvConfig | null {
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  // Standardize on VITE_SUPABASE_PUBLISHABLE_KEY, with fallback to VITE_SUPABASE_ANON_KEY if set
  const supabasePublishableKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )?.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  // Normalize URL to origin if a path like /rest/v1 or trailing slash was included
  try {
    const parsed = new URL(supabaseUrl);
    supabaseUrl = parsed.origin;
  } catch {
    // Keep as is if URL cannot be parsed
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

/**
 * Helper to check if Supabase is properly configured in the current environment.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

/**
 * Ensures valid configuration exists or throws a detailed descriptive error.
 */
export function requireSupabaseConfig(): SupabaseEnvConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      '[Supabase Config Error]: Missing required environment variables.\n' +
      'Please ensure both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are defined in your .env.local file.\n' +
      'See .env.example for variable templates.'
    );
  }
  return config;
}
