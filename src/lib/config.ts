/**
 * Public runtime configuration. Only EXPO_PUBLIC_* values reach the app
 * bundle; secret keys (AI provider, weather) live in Supabase functions.
 * A MapTiler key is a public, domain/app-restricted key by design.
 */
export const config = {
  /** Optional single custom style URL; overrides the built-in style list. */
  customMapStyleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL || '',
  maptilerKey: process.env.EXPO_PUBLIC_MAPTILER_KEY || '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

export const backendConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
