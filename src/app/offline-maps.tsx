import type { OfflinePackStatus } from '@maplibre/maplibre-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Button, Chip, EmptyState, ListRow, Rule, Screen, Section, Text } from '@/components/ui';
import { currentPosition, ensureLocationPermission } from '@/features/hunt/service';
import { boundsAround, estimateSizeMb, estimateTileCount, OFFLINE_RADII_M, OFFLINE_ZOOM } from '@/features/maps/bounds';
import { deletePack, downloadPack, listPacks, watchPack, type PackInfo } from '@/features/maps/offline';
import { resolveStyle, usingDemoMap } from '@/features/maps/styles';
import { useSettings } from '@/features/settings/store';
import { colors, space } from '@/theme/tokens';

export default function OfflineMaps() {
  const params = useLocalSearchParams<{ siteId?: string; name?: string; lat?: string; lng?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const mapStyle = useSettings((s) => s.mapStyle);
  const style = resolveStyle(mapStyle);

  const [packs, setPacks] = useState<PackInfo[]>([]);
  const [progress, setProgress] = useState<Record<string, OfflinePackStatus>>({});
  const [radiusM, setRadiusM] = useState<number>(OFFLINE_RADII_M[1]);
  const [busy, setBusy] = useState(false);

  const fixedTarget =
    params.lat && params.lng ? { lat: Number(params.lat), lng: Number(params.lng), name: params.name ?? '' } : null;

  const refresh = useCallback(async () => {
    const list = await listPacks();
    setPacks(list);
    return list;
  }, []);

  // Keep showing progress for packs that are still downloading.
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    let cancelled = false;
    void (async () => {
      const list = await refresh();
      for (const p of list) {
        if (cancelled || p.status?.state !== 'active') continue;
        cleanups.push(
          await watchPack(
            p.pack.id,
            (s) => setProgress((prev) => ({ ...prev, [s.id]: s })),
            (message) => Alert.alert(t('offline.title'), t('offline.error', { message })),
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
      cleanups.forEach((c) => c());
    };
  }, [refresh, t]);

  const estimateTiles = estimateTileCount(boundsAround(41, 29, radiusM), OFFLINE_ZOOM.min, OFFLINE_ZOOM.max);
  const estimateMb = estimateSizeMb(estimateTiles, style.id === 'satellite');

  const start = async () => {
    setBusy(true);
    try {
      let target = fixedTarget;
      if (!target) {
        if ((await ensureLocationPermission()) === 'denied') return;
        const pos = await currentPosition();
        if (!pos) return;
        target = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: t('offline.here') };
      }
      await downloadPack({
        name: target.name || t('offline.here'),
        lat: target.lat,
        lng: target.lng,
        radiusM,
        style,
        siteId: params.siteId,
        onProgress: (s) => {
          setProgress((prev) => ({ ...prev, [s.id]: s }));
          if (s.state === 'complete') void refresh();
        },
        onError: (message) => Alert.alert(t('offline.title'), t('offline.error', { message })),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = (info: PackInfo) =>
    Alert.alert(t('offline.title'), t('offline.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deletePack(info.pack.id);
          await refresh();
        },
      },
    ]);

  const statusLabel = (info: PackInfo) => {
    const s = progress[info.pack.id] ?? info.status;
    if (!s) return '';
    if (s.state === 'complete') return t('offline.complete');
    if (s.state === 'active') return t('offline.downloading', { pct: Math.floor(s.percentage) });
    return t('offline.paused');
  };

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Button title={`← ${t('common.back')}`} kind="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.back()} />
        <Text variant="display">{t('offline.title')}</Text>
        <Text variant="muted">{t('offline.body')}</Text>
      </View>

      {usingDemoMap() ? (
        <Text variant="muted" style={{ color: colors.danger }}>
          {t('maps.demoWarning')}
        </Text>
      ) : null}

      <Section label={fixedTarget ? fixedTarget.name : t('offline.here')}>
        <Text variant="label" style={{ color: colors.textSubtle }}>
          {t('offline.radius')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {OFFLINE_RADII_M.map((r) => (
            <Chip
              key={r}
              label={t('offline.radiusValue', { km: r / 1000 })}
              selected={radiusM === r}
              onPress={() => setRadiusM(r)}
            />
          ))}
        </View>
        <Text variant="caption">{t('offline.estimate', { tiles: estimateTiles, mb: estimateMb })}</Text>
        <Text variant="caption">{t('offline.styleNote', { style: t(`maps.style.${style.id}`) })}</Text>
        <Button title={t('offline.download')} loading={busy} onPress={start} />
      </Section>

      <View>
        <Rule strong />
        {packs.length === 0 ? (
          <EmptyState title={t('offline.empty')} body={t('offline.emptyBody')} />
        ) : (
          packs.map((info) => (
            <ListRow
              key={info.pack.id}
              title={info.meta.name}
              subtitle={`${t(`maps.style.${info.meta.styleId as 'satellite'}`)} · ${t('offline.radiusValue', {
                km: (info.meta.radiusM ?? 0) / 1000,
              })}`}
              right={statusLabel(info)}
              onPress={() => remove(info)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
