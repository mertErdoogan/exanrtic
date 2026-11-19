/**
 * Public runtime configuration. Only EXPO_PUBLIC_* values reach the app
 * bundle; secret keys (AI provider, weather) live in Supabase functions.
 */
export const config = {
  mapStyleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json',
  usingDemoMap: !process.env.EXPO_PUBLIC_MAP_STYLE_URL,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

export const backendConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
