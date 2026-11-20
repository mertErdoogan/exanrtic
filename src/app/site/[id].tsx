import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, ListRow, Rule, Screen, Section, Stat, Text } from '@/components/ui';
import { digsRepo, sessionsRepo, sitesRepo, trackRepo } from '@/db/repo';
import type { Site } from '@/db/schema';
import { HuntMap } from '@/features/hunt/HuntMap';
import { useSettings } from '@/features/settings/store';
import { bucketIdLibrary } from '@/features/sites/idLibrary';
import { formatShortDate, parseDayMonthYear, toDayMonthYear } from '@/lib/format';
import { cleanTrack, computeCoverage } from '@/lib/geo';
import { useData } from '@/lib/useData';
import { formatArea, formatDistance } from '@/lib/units';
import { colors, space } from '@/theme/tokens';

const DAY = 24 * 60 * 60 * 1000;

export default function SiteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const units = useSettings((s) => s.units);

  const { data, reload } = useData(async () => {
    const site = await sitesRepo.get(id);
    if (!site) return null;
    const sessions = await sessionsRepo.bySite(id);
    const [digs, points, library] = await Promise.all([
      digsRepo.forSite(id),
      trackRepo.forSessions(sessions.map((s) => s.id)),
      digsRepo.idLibrary(id),
    ]);
    const keyed = points.map((p) => ({
      ...p,
      segment: sessions.findIndex((s) => s.id === p.sessionId) * 10_000 + p.segment,
    }));
    const track = cleanTrack(keyed);
    const sweep = sessions[0]?.sweepWidthM ?? 1;
    const daysLeft = site.permitUntil ? Math.ceil((site.permitUntil - Date.now()) / DAY) : null;
    return {
      site,
      sessions,
      digs,
      track,
      daysLeft,
      coverage: computeCoverage(track, sweep),
      library: bucketIdLibrary(library),
    };
  }, [id]);

  if (!data) return <Screen>{null}</Screen>;
  const { site, sessions, digs, track, coverage, library, daysLeft } = data;

  const good = digs.filter((d) => d.result === 'coin' || d.result === 'jewelry' || d.result === 'relic').length;

  const remove = () =>
    Alert.alert(t('common.delete'), site.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await sitesRepo.remove(id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Button title={`← ${t('common.back')}`} kind="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.back()} />
        <Text variant="label">{t('sites.stats')}</Text>
        <Text variant="display">{site.name}</Text>
      </View>

      <View style={{ height: 280, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.inkRaised }}>
        <HuntMap
          center={{ lat: site.centerLat, lng: site.centerLng }}
          track={track}
          coverage={coverage.polygon}
          digs={digs}
          followUser={false}
          zoom={16.5}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Stat value={String(sessions.length)} label={t('sites.history')} />
        <Stat value={formatArea(coverage.areaM2, units, i18n.language)} label={t('hunt.covered')} />
        <Stat value={`${good}/${digs.length}`} label={t('hunt.finds')} />
      </View>

      {daysLeft != null && daysLeft <= 14 ? (
        <Text variant="body" style={{ color: daysLeft < 0 ? colors.danger : colors.brassDeep }}>
          {daysLeft < 0 ? t('sites.permitExpired') : t('sites.permitExpiring', { days: daysLeft })}
        </Text>
      ) : null}

      {library.length > 0 ? (
        <Section label="ID">
          <Rule strong />
          {library.map((b) => (
            <ListRow
              key={b.from}
              title={`${b.from}–${b.to}`}
              subtitle={`${b.total} ${t('hunt.digs')} · ${t(`dig.result.${b.top}`)}`}
              right={`%${Math.round(b.goodShare * 100)}`}
            />
          ))}
        </Section>
      ) : null}

      <Button
        title={t('offline.forSite')}
        kind="secondary"
        onPress={() =>
          router.push({
            pathname: '/offline-maps',
            params: { siteId: site.id, name: site.name, lat: String(site.centerLat), lng: String(site.centerLng) },
          })
        }
      />

      <SiteForm key={`${site.id}-${site.updatedAt}`} site={site} onSaved={reload} />

      <Section label={t('sites.history')}>
        <Rule strong />
        {sessions.map((s) => (
          <ListRow
            key={s.id}
            title={formatShortDate(s.startedAt, i18n.language)}
            subtitle={`${formatDistance(s.distanceM, units, i18n.language)} · ${formatArea(s.coveredM2, units, i18n.language)}`}
            onPress={() => router.push(s.status === 'ended' ? `/hunt/summary/${s.id}` : `/hunt/${s.id}`)}
          />
        ))}
      </Section>

      <Button title={t('common.delete')} kind="danger" onPress={remove} />
    </Screen>
  );
}

/** Permission and notes form; remounts (via key) whenever the saved site changes. */
function SiteForm({ site, onSaved }: { site: Site; onSaved: () => Promise<void> }) {
  const { t } = useTranslation();
  const [name, setName] = useState(site.name);
  const [owner, setOwner] = useState(site.ownerName ?? '');
  const [contact, setContact] = useState(site.ownerContact ?? '');
  const [permitUntil, setPermitUntil] = useState(toDayMonthYear(site.permitUntil));
  const [notes, setNotes] = useState(site.notes ?? '');

  const save = async () => {
    await sitesRepo.update(site.id, {
      name: name.trim() || site.name,
      ownerName: owner.trim() || null,
      ownerContact: contact.trim() || null,
      permitUntil: parseDayMonthYear(permitUntil),
      notes: notes.trim() || null,
    });
    await onSaved();
  };

  return (
    <Section label={t('sites.permit')}>
      <Rule strong />
      <Field label={t('sites.rename')} value={name} onChangeText={setName} />
      <Field label={t('sites.owner')} value={owner} onChangeText={setOwner} />
      <Field label={t('sites.ownerContact')} value={contact} onChangeText={setContact} />
      <Field
        label={`${t('sites.permitUntil')} (GG.AA.YYYY)`}
        value={permitUntil}
        onChangeText={setPermitUntil}
        keyboardType="numbers-and-punctuation"
      />
      <Field label={t('sites.notes')} value={notes} onChangeText={setNotes} multiline />
      <Button title={t('common.save')} onPress={save} />
    </Section>
  );
}
