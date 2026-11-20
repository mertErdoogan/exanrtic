import { config } from '@/lib/config';

/**
 * Map styles offered in the app. Satellite (hybrid) is the default for
 * detecting: field boundaries, hedges and soil colour are visible.
 * Without a MapTiler key we fall back to MapLibre's low-detail demo style,
 * which is only good enough for development.
 */
export type MapStyleId = 'satellite' | 'topo' | 'streets' | 'custom' | 'demo';

export type MapStyleOption = { id: MapStyleId; url: string };

const DEMO_STYLE = 'https://demotiles.maplibre.org/style.json';

const MAPTILER_STYLES: Record<'satellite' | 'topo' | 'streets', string> = {
  satellite: 'hybrid',
  topo: 'topo-v2',
  streets: 'streets-v2',
};

export function availableStyles(): MapStyleOption[] {
  const out: MapStyleOption[] = [];
  if (config.maptilerKey) {
    for (const [id, slug] of Object.entries(MAPTILER_STYLES)) {
      out.push({
        id: id as MapStyleId,
        url: `https://api.maptiler.com/maps/${slug}/style.json?key=${encodeURIComponent(config.maptilerKey)}`,
      });
    }
  }
  if (config.customMapStyleUrl) out.push({ id: 'custom', url: config.customMapStyleUrl });
  if (out.length === 0) out.push({ id: 'demo', url: DEMO_STYLE });
  return out;
}

/** Resolves the user's preferred style, falling back to the first available one. */
export function resolveStyle(preferred: MapStyleId | undefined): MapStyleOption {
  const styles = availableStyles();
  return styles.find((s) => s.id === preferred) ?? styles[0]!;
}

/** Next style in the list, for the one-tap layer toggle on the map. */
export function nextStyle(current: MapStyleId | undefined): MapStyleOption {
  const styles = availableStyles();
  const i = styles.findIndex((s) => s.id === current);
  return styles[(i + 1) % styles.length]!;
}

export const usingDemoMap = () => availableStyles()[0]?.id === 'demo';
