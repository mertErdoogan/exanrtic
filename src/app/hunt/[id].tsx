import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Stat, Text } from '@/components/ui';
import { digsRepo, sessionsRepo, sitesRepo, trackRepo } from '@/db/repo';
import type { Dig, Session, Site } from '@/db/schema';
import { HuntMap } from '@/features/hunt/HuntMap';
import {
  currentPosition,
  ensureLocationPermission,
  finishHunt,
  pauseHunt,
  resumeHunt,
} from '@/features/hunt/service';
import { useTrack } from '@/features/hunt/useTrack';
import { useSettings } from '@/features/settings/store';
import { cleanTrack, computeCoverage } from '@/lib/geo';
import { useData } from '@/lib/useData';
import { formatArea, formatDistance, formatDuration } from '@/lib/units';
import { colors, fonts, radius, space, touch } from '@/theme/tokens';

function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function ActiveHunt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const units = useSettings((s) => s.units);
  const now = useNow();

  const [busy, setBusy] = useState(false);

  const { data: loaded, reload: loadSession } = useData<{ session?: Session; site?: Site }>(async () => {
    const s = await sessionsRepo.get(id);
    return { session: s, site: s ? await sitesRepo.get(s.siteId) : undefined };
  }, [id]);
  const session = loaded?.session;
  const site = loaded?.site;

  const { data: digs = [], reload: reloadDigs } = useData<Dig[]>(() => digsRepo.forSession(id), [id]);

  // Coverage from earlier visits to this site, drawn underneath today's.
  const { data: previous } = useData(async () => {
    const s = await sessionsRepo.get(id);
    if (!s) return null;
    const others = (await sessionsRepo.bySite(s.siteId)).filter((x) => x.id !== id);
    if (others.length === 0) return null;
    const pts = await trackRepo.forSessions(others.map((o) => o.id));
    // Give each earlier session its own segment space so lines never join across visits.
    const keyed = pts.map((p) => ({ ...p, segment: others.findIndex((o) => o.id === p.sessionId) * 10_000 + p.segment }));
    return computeCoverage(cleanTrack(keyed), s.sweepWidthM).polygon;
  }, [id]);

  const track = useTrack(session?.id, session?.sweepWidthM ?? 1);

  const notification = { title: t('hunt.active'), body: site?.name ?? t('home.greeting') };

  const onDug = async () => {
    if (!session || busy) return;
    setBusy(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const last = await trackRepo.last(session.id);
      const recent = last && Date.now() - last.ts < 10_000 && (last.accuracy ?? 99) <= 15;
      let lat = last?.lat;
      let lng = last?.lng;
      let accuracy = last?.accuracy ?? null;
      if (!recent) {
        const pos = await currentPosition(4000);
        if (pos) {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          accuracy = pos.coords.accuracy ?? null;
        }
      }
      if (lat == null || lng == null) {
        Alert.alert(t('hunt.waitingGps'));
        return;
      }
      const dig = await digsRepo.create({ sessionId: session.id, siteId: session.siteId, lat, lng, accuracy });
      await reloadDigs();
      router.push({ pathname: '/dig/[id]', params: { id: dig.id, fresh: '1' } });
    } finally {
      setBusy(false);
    }
  };

  const onPauseResume = async () => {
    if (!session) return;
    if (session.status === 'active') {
      await pauseHunt(session);
    } else {
      const level = await ensureLocationPermission();
      if (level === 'denied') return;
      await resumeHunt(session, level, notification);
    }
    await Haptics.selectionAsync();
    await loadSession();
  };

  const onFinish = () => {
    if (!session) return;
    Alert.alert(t('hunt.finishConfirmTitle'), t('hunt.finishConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('hunt.finish'),
        style: 'destructive',
        onPress: async () => {
          await finishHunt(session);
          router.replace(`/hunt/summary/${session.id}`);
        },
      },
    ]);
  };

  if (!session || !site) return <View style={{ flex: 1, backgroundColor: colors.ink }} />;

  const goodFinds = digs.filter((d) => d.result === 'coin' || d.result === 'jewelry' || d.result === 'relic').length;
  const accuracy = track.lastAccuracy;
  const gpsLabel =
    accuracy == null ? t('hunt.waitingGps') : accuracy > 20 ? t('hunt.gpsWeak') : t('hunt.gpsAccuracy', { m: Math.round(accuracy) });

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <View style={styles.mapWrap}>
        <HuntMap
          center={{ lat: site.centerLat, lng: site.centerLng }}
          track={track.points}
          coverage={track.coverage.polygon}
          previousCoverage={previous ?? null}
          digs={digs}
        />
        <SafeAreaView edges={['top']} style={styles.mapHeader} pointerEvents="box-none">
          <View style={styles.headerCard}>
            <Text variant="label" tone="dark">
              {session.status === 'active' ? t('hunt.active') : t('hunt.paused')} · {formatDuration(now - session.startedAt)}
            </Text>
            <Text variant="heading" tone="dark">
              {site.name}
            </Text>
            <Text variant="caption" tone="dark">
              {gpsLabel}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.panel}>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Stat tone="dark" value={formatDistance(track.distanceM, units, i18n.language)} label={t('hunt.distance')} />
          <Stat tone="dark" value={formatArea(track.coverage.areaM2, units, i18n.language)} label={t('hunt.covered')} />
          <Stat tone="dark" value={String(digs.length)} label={t('hunt.digs')} />
          <Stat tone="dark" value={String(goodFinds)} label={t('hunt.finds')} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('hunt.dug')}
          disabled={busy || session.status !== 'active'}
          onPress={onDug}
          style={({ pressed }) => [
            styles.dug,
            { opacity: session.status !== 'active' ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Text style={styles.dugText}>{t('hunt.dug')}</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title={session.status === 'active' ? t('hunt.pause') : t('hunt.resume')}
            kind="outlineDark"
            style={{ flex: 1 }}
            onPress={onPauseResume}
          />
          <Button title={t('hunt.finish')} kind="brass" style={{ flex: 1 }} onPress={onFinish} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1, backgroundColor: colors.inkRaised },
  mapHeader: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: space.lg },
  headerCard: {
    marginTop: space.sm,
    backgroundColor: 'rgba(21,19,15,0.88)',
    borderRadius: radius.md,
    padding: space.lg,
    gap: 2,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  panel: { backgroundColor: colors.ink, paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg },
  dug: {
    minHeight: touch.hero + 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dugText: { fontFamily: fonts.bodyBold, fontSize: 22, letterSpacing: 8, color: colors.ink },
});
