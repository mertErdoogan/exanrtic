/** Pure helpers for offline map regions (kept free of native imports for testing). */

export type LngLatBounds = [west: number, south: number, east: number, north: number];

const M_PER_DEG_LAT = 111_320;

/** Square region of `radiusM` around a point, as [west, south, east, north]. */
export function boundsAround(lat: number, lng: number, radiusM: number): LngLatBounds {
  const dLat = radiusM / M_PER_DEG_LAT;
  const dLng = radiusM / (M_PER_DEG_LAT * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
}

function lngToTileX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

function latToTileY(lat: number, z: number): number {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

/** Number of map tiles a region needs across a zoom range (per tile source). */
export function estimateTileCount(bounds: LngLatBounds, minZoom: number, maxZoom: number): number {
  const [west, south, east, north] = bounds;
  let total = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    const x = Math.abs(lngToTileX(east, z) - lngToTileX(west, z)) + 1;
    const y = Math.abs(latToTileY(south, z) - latToTileY(north, z)) + 1;
    total += x * y;
  }
  return total;
}

/** Rough download size: satellite tiles average ~30 KB, vector ~10 KB. */
export function estimateSizeMb(tiles: number, satellite: boolean): number {
  return Math.round((tiles * (satellite ? 30 : 10)) / 1024);
}

export const OFFLINE_ZOOM = { min: 12, max: 18 } as const;
export const OFFLINE_RADII_M = [1000, 2000, 3000] as const;
