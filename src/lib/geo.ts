import { area } from '@turf/area';
import { buffer } from '@turf/buffer';
import { featureCollection, lineString, point } from '@turf/helpers';
import { simplify } from '@turf/simplify';
import { union } from '@turf/union';
import type { Feature, MultiPolygon, Polygon } from 'geojson';

export type LatLng = { lat: number; lng: number };
export type TimedPoint = LatLng & { ts: number; accuracy?: number | null; segment?: number };

const EARTH_RADIUS_M = 6_371_008.8;

/** Great-circle distance in metres. */
export function haversineM(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Tuning for field GPS noise while walking slowly with a detector. */
export const TRACK_FILTER = {
  maxAccuracyM: 30,
  /** A detectorist rarely moves faster than a brisk walk; larger jumps are GPS spikes. */
  maxSpeedMps: 3.5,
  /** Ignore jitter while standing still and digging. */
  minStepM: 1.5,
} as const;

/**
 * Drops low-accuracy fixes, GPS spikes and stationary jitter.
 * Keeps segment boundaries so paused periods are not joined by a line.
 */
export function cleanTrack<T extends TimedPoint>(points: T[]): T[] {
  const out: T[] = [];
  for (const p of points) {
    if (p.accuracy != null && p.accuracy > TRACK_FILTER.maxAccuracyM) continue;
    const prev = out[out.length - 1];
    if (!prev || (prev.segment ?? 0) !== (p.segment ?? 0)) {
      out.push(p);
      continue;
    }
    const d = haversineM(prev, p);
    const dt = Math.max(1, (p.ts - prev.ts) / 1000);
    if (d / dt > TRACK_FILTER.maxSpeedMps) continue;
    if (d < TRACK_FILTER.minStepM) continue;
    out.push(p);
  }
  return out;
}

/** Splits a cleaned track into its segments (pause/resume creates a new segment). */
export function splitSegments<T extends TimedPoint>(points: T[]): T[][] {
  const segments: T[][] = [];
  let current: T[] = [];
  let seg: number | undefined;
  for (const p of points) {
    const s = p.segment ?? 0;
    if (seg !== undefined && s !== seg) {
      if (current.length) segments.push(current);
      current = [];
    }
    seg = s;
    current.push(p);
  }
  if (current.length) segments.push(current);
  return segments;
}

/** Walked distance in metres, not counting gaps between segments. */
export function pathLengthM(points: TimedPoint[]): number {
  let total = 0;
  for (const seg of splitSegments(points)) {
    for (let i = 1; i < seg.length; i++) {
      const a = seg[i - 1];
      const b = seg[i];
      if (a && b) total += haversineM(a, b);
    }
  }
  return total;
}

export type Coverage = {
  polygon: Feature<Polygon | MultiPolygon> | null;
  areaM2: number;
};

/**
 * Approximate swept area: each segment's path buffered by half the sweep width.
 * Phone GPS is ~3–5 m accurate, so this is a guide, not a survey.
 */
export function computeCoverage(points: TimedPoint[], sweepWidthM: number): Coverage {
  const radiusKm = Math.max(0.2, sweepWidthM) / 2 / 1000;
  const polygons: Feature<Polygon | MultiPolygon>[] = [];

  for (const seg of splitSegments(points)) {
    if (seg.length === 1) {
      const only = seg[0];
      if (!only) continue;
      const b = buffer(point([only.lng, only.lat]), radiusKm, { units: 'kilometers' });
      if (b) polygons.push(b as Feature<Polygon | MultiPolygon>);
      continue;
    }
    const line = lineString(seg.map((p) => [p.lng, p.lat]));
    // ~0.5 m tolerance keeps buffering fast on long hunts.
    const simple = simplify(line, { tolerance: 0.000005, highQuality: false });
    const b = buffer(simple, radiusKm, { units: 'kilometers', steps: 4 });
    if (b) polygons.push(b as Feature<Polygon | MultiPolygon>);
  }

  if (polygons.length === 0) return { polygon: null, areaM2: 0 };
  const first = polygons[0];
  const merged =
    polygons.length === 1 || !first
      ? first ?? null
      : (union(featureCollection(polygons)) as Feature<Polygon | MultiPolygon> | null);
  return { polygon: merged, areaM2: merged ? area(merged) : 0 };
}

/** Closest site within maxDistanceM, if any. */
export function nearestWithin<T extends LatLng>(
  origin: LatLng,
  candidates: T[],
  maxDistanceM: number,
): { item: T; distanceM: number } | null {
  let best: { item: T; distanceM: number } | null = null;
  for (const c of candidates) {
    const d = haversineM(origin, c);
    if (d <= maxDistanceM && (!best || d < best.distanceM)) best = { item: c, distanceM: d };
  }
  return best;
}

/** Mean of points, used as a site's centre. */
export function centroid(points: LatLng[]): LatLng | null {
  if (points.length === 0) return null;
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / points.length, lng: lng / points.length };
}
