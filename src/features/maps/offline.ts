import { OfflineManager, type OfflinePack, type OfflinePackStatus } from '@maplibre/maplibre-react-native';

import { boundsAround, OFFLINE_ZOOM } from './bounds';
import type { MapStyleOption } from './styles';

/**
 * Offline map packs for places with no signal. A pack stores every tile of
 * one style for a square around a point, zoom 12–18, so the hunt map keeps
 * working in airplane mode. MapLibre also keeps an ambient cache of tiles
 * the user has already viewed.
 */
export type PackMeta = { name: string; siteId?: string; styleId: string; radiusM: number; createdAt: number };

export type PackInfo = { pack: OfflinePack; meta: PackMeta; status: OfflinePackStatus | null };

export async function listPacks(): Promise<PackInfo[]> {
  const packs = await OfflineManager.getPacks();
  const infos = await Promise.all(
    packs.map(async (pack) => ({
      pack,
      meta: pack.metadata as unknown as PackMeta,
      status: await pack.status().catch(() => null),
    })),
  );
  return infos.sort((a, b) => (b.meta.createdAt ?? 0) - (a.meta.createdAt ?? 0));
}

export async function downloadPack(input: {
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  style: MapStyleOption;
  siteId?: string;
  onProgress?: (status: OfflinePackStatus) => void;
  onError?: (message: string) => void;
}): Promise<OfflinePack> {
  const meta: PackMeta = {
    name: input.name,
    siteId: input.siteId,
    styleId: input.style.id,
    radiusM: input.radiusM,
    createdAt: Date.now(),
  };
  return OfflineManager.createPack(
    {
      mapStyle: input.style.url,
      bounds: boundsAround(input.lat, input.lng, input.radiusM),
      minZoom: OFFLINE_ZOOM.min,
      maxZoom: OFFLINE_ZOOM.max,
      metadata: meta,
    },
    (_pack, status) => input.onProgress?.(status),
    (_pack, error) => input.onError?.(error.message),
  );
}

export async function deletePack(id: string): Promise<void> {
  OfflineManager.removeListener(id);
  await OfflineManager.deletePack(id);
}

/** Re-attach progress listeners to packs that were still downloading when the screen closed. */
export async function watchPack(
  id: string,
  onProgress: (status: OfflinePackStatus) => void,
  onError: (message: string) => void,
): Promise<() => void> {
  await OfflineManager.addListener(
    id,
    (_pack, status) => onProgress(status),
    (_pack, error) => onError(error.message),
  );
  return () => OfflineManager.removeListener(id);
}
