import { Camera, GeoJSONSource, Layer, Map, UserLocation } from '@maplibre/maplibre-react-native';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DigResult } from '@/db/schema';
import { resolveStyle } from '@/features/maps/styles';
import { useSettings } from '@/features/settings/store';
import { splitSegments, type TimedPoint } from '@/lib/geo';
import { colors } from '@/theme/tokens';

type DigPin = { id: string; lat: number; lng: number; result: DigResult };

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

export function HuntMap({
  center,
  track,
  coverage,
  previousCoverage,
  digs,
  followUser = true,
  zoom = 17.5,
}: {
  center: { lat: number; lng: number };
  track: TimedPoint[];
  coverage: Feature<Polygon | MultiPolygon> | null;
  previousCoverage?: Feature<Polygon | MultiPolygon> | null;
  digs: DigPin[];
  followUser?: boolean;
  zoom?: number;
}) {
  const preferredStyle = useSettings((s) => s.mapStyle);
  const style = resolveStyle(preferredStyle);

  const lines = useMemo<FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: splitSegments(track)
        .filter((s) => s.length > 1)
        .map((s) => ({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: s.map((p) => [p.lng, p.lat]) },
        })),
    }),
    [track],
  );

  const pins = useMemo<FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: digs.map((d) => ({
        type: 'Feature',
        id: d.id,
        properties: { result: d.result },
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
      })),
    }),
    [digs],
  );

  const covered = useMemo<FeatureCollection>(
    () => (coverage ? { type: 'FeatureCollection', features: [coverage] } : EMPTY),
    [coverage],
  );
  const before = useMemo<FeatureCollection>(
    () => (previousCoverage ? { type: 'FeatureCollection', features: [previousCoverage] } : EMPTY),
    [previousCoverage],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Map style={StyleSheet.absoluteFill} mapStyle={style.url} logo={false} compass attribution>
        <Camera
          initialViewState={{ center: [center.lng, center.lat], zoom }}
          trackUserLocation={followUser ? 'default' : undefined}
        />
        <UserLocation />

        <GeoJSONSource id="previous-coverage" data={before}>
          <Layer id="previous-coverage-fill" type="fill" paint={{ 'fill-color': colors.textOnInkMuted, 'fill-opacity': 0.22 }} />
        </GeoJSONSource>

        <GeoJSONSource id="coverage" data={covered}>
          <Layer id="coverage-fill" type="fill" paint={{ 'fill-color': colors.brass, 'fill-opacity': 0.32 }} />
        </GeoJSONSource>

        <GeoJSONSource id="track" data={lines}>
          <Layer
            id="track-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.brass, 'line-width': 2 }}
          />
        </GeoJSONSource>

        <GeoJSONSource id="digs" data={pins}>
          <Layer
            id="digs-circle"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-stroke-width': 2,
              'circle-stroke-color': colors.ink,
              'circle-color': [
                'match',
                ['get', 'result'],
                ['coin', 'jewelry', 'relic'],
                colors.brass,
                'trash',
                '#6E685C',
                colors.textOnInk,
              ],
            }}
          />
        </GeoJSONSource>
      </Map>
    </View>
  );
}
