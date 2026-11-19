import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Chip, Rule, Screen, Section, Text } from '@/components/ui';
import { devicesRepo, sitesRepo, type SiteWithStats } from '@/db/repo';
import type { Device, Session } from '@/db/schema';
import { currentPosition, ensureLocationPermission, startHunt, type PermissionLevel } from '@/features/hunt/service';
import { useSettings } from '@/features/settings/store';
import { nearestWithin } from '@/lib/geo';
import { colors, space } from '@/theme/tokens';

const TARGETS: Session['target'][] = ['general', 'coin', 'jewelry', 'relic', 'gold'];
/** A hunt within this distance of a saved site is treated as a revisit. */
const SITE_RADIUS_M = 400;

export default function StartHunt() {
  const { t } = useTranslation();
  const router = useRouter();
  const sweepWidthM = useSettings((s) => s.sweepWidthM);

  const [permission, setPermission] = useState<PermissionLevel | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState<SiteWithStats | null>(null);
  const [useNearby, setUseNearby] = useState(true);
  const [siteName, setSiteName] = useState('');
  const [target, setTarget] = useState<Session['target']>('general');
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await devicesRepo.list();
      if (cancelled) return;
      setDevices(list);
      setDeviceId(list[0]?.id ?? null);

      const level = await ensureLocationPermission();
      if (cancelled) return;
      setPermission(level);
      if (level === 'denied') return;

      const pos = await currentPosition();
      if (cancelled || !pos) return;
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPosition(here);
      const sites = await sitesRepo.list();
      const near = nearestWithin(
        here,
        sites.map((s) => ({ ...s, lat: s.centerLat, lng: s.centerLng })),
        SITE_RADIUS_M,
      );
      if (!cancelled) setNearby(near?.item ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const begin = async () => {
    if (!position || !permission || permission === 'denied') return;
    setStarting(true);
    try {
      const site =
        nearby && useNearby
          ? { id: nearby.id }
          : { name: siteName.trim() || t('start.newSite'), lat: position.lat, lng: position.lng };
      const session = await startHunt({
        site,
        deviceId,
        target,
        sweepWidthM,
        permission,
        notification: { title: t('hunt.active'), body: t('home.greeting') },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/hunt/${session.id}`);
    } catch (e) {
      Alert.alert(t('start.title'), String(e));
      setStarting(false);
    }
  };

  if (permission === 'denied') {
    return (
      <Screen>
        <Text variant="title">{t('start.permissionTitle')}</Text>
        <Text variant="muted">{t('start.permissionBody')}</Text>
        <Button title={t('start.openSettings')} onPress={() => Linking.openSettings()} />
        <Button title={t('common.close')} kind="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: space.sm }}>
        <Text variant="label">{t('start.title')}</Text>
        <Text variant="title">{t('start.where')}</Text>
      </View>

      {!position ? (
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <ActivityIndicator color={colors.ink} />
          <Text variant="muted">{t('start.locating')}</Text>
        </View>
      ) : (
        <View style={{ gap: space.lg }}>
          {nearby ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              <Chip
                label={`${nearby.name} · ${t('start.visit', { count: nearby.visits + 1 })}`}
                selected={useNearby}
                onPress={() => setUseNearby(true)}
              />
              <Chip label={t('start.newSite')} selected={!useNearby} onPress={() => setUseNearby(false)} />
            </View>
          ) : null}
          {!nearby || !useNearby ? (
            <Field
              label={t('start.siteName')}
              placeholder={t('start.siteNamePlaceholder')}
              value={siteName}
              onChangeText={setSiteName}
              autoFocus={!nearby}
              returnKeyType="done"
            />
          ) : null}
        </View>
      )}

      {permission === 'foreground' ? <Text variant="caption">{t('start.foregroundOnly')}</Text> : null}

      <Rule strong />

      <Section label={t('start.target')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {TARGETS.map((x) => (
            <Chip key={x} label={t(`target.${x}`)} selected={target === x} onPress={() => setTarget(x)} />
          ))}
        </View>
      </Section>

      {devices.length > 0 ? (
        <Section label={t('start.device')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {devices.map((d) => (
              <Chip
                key={d.id}
                label={`${d.brand} ${d.model}`}
                selected={deviceId === d.id}
                onPress={() => setDeviceId(d.id)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Button title={t('start.begin')} size="hero" disabled={!position} loading={starting} onPress={begin} />
        <Button title={t('common.cancel')} kind="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
