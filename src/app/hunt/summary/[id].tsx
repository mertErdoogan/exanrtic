import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ListRow, Rule, Screen, Section, Stat, Text } from '@/components/ui';
import { digsRepo, sessionsRepo, sitesRepo, trackRepo } from '@/db/repo';
import type { DigResult } from '@/db/schema';
import { HuntMap } from '@/features/hunt/HuntMap';
import { useSettings } from '@/features/settings/store';
import { formatDate, formatTime } from '@/lib/format';
import { cleanTrack, computeCoverage } from '@/lib/geo';
import { useData } from '@/lib/useData';
import { formatArea, formatDistance, formatDuration } from '@/lib/units';
import { colors, space } from '@/theme/tokens';

const GOOD: DigResult[] = ['coin', 'jewelry', 'relic'];

export default function HuntSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const units = useSettings((s) => s.units);

  const { data } = useData(async () => {
    const session = await sessionsRepo.get(id);
    if (!session) return null;
    const [site, digs, raw] = await Promise.all([
      sitesRepo.get(session.siteId),
      digsRepo.forSession(id),
      trackRepo.forSession(id),
    ]);
    const track = cleanTrack(raw);
    return { session, site, digs, track, coverage: computeCoverage(track, session.sweepWidthM) };
  }, [id]);

  if (!data) return <Screen>{null}</Screen>;
  const { session, site, digs, track, coverage } = data;

  const counts = digs.reduce<Partial<Record<DigResult, number>>>((acc, d) => {
    acc[d.result] = (acc[d.result] ?? 0) + 1;
    return acc;
  }, {});
  const good = digs.filter((d) => GOOD.includes(d.result)).length;
  const rate = digs.length ? Math.round((good / digs.length) * 100) : 0;
  const duration = (session.endedAt ?? session.startedAt) - session.startedAt;

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text variant="label">{t('summary.title')}</Text>
        <Text variant="display">{site?.name ?? '—'}</Text>
        <Text variant="muted">{formatDate(session.startedAt, i18n.language)}</Text>
      </View>

      {site ? (
        <View style={{ height: 260, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.inkRaised }}>
          <HuntMap
            center={{ lat: track[0]?.lat ?? site.centerLat, lng: track[0]?.lng ?? site.centerLng }}
            track={track}
            coverage={coverage.polygon}
            digs={digs}
            followUser={false}
            zoom={17}
          />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Stat value={formatDuration(duration)} label={t('summary.duration')} />
        <Stat value={formatDistance(session.distanceM, units, i18n.language)} label={t('hunt.distance')} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Stat value={formatArea(session.coveredM2, units, i18n.language)} label={t('hunt.covered')} />
        <Stat value={`%${rate}`} label={t('summary.goodRate')} />
      </View>
      <Text variant="caption">{t('hunt.coverageNote')}</Text>

      <Section label={t('summary.results')}>
        <Rule strong />
        {digs.length === 0 ? (
          <Text variant="muted">{t('summary.noDigs')}</Text>
        ) : (
          (Object.keys(counts) as DigResult[]).map((r) => (
            <ListRow key={r} title={t(`dig.result.${r}`)} right={String(counts[r])} />
          ))
        )}
      </Section>

      {good > 0 ? (
        <Section label={t('summary.highlights')}>
          <Rule strong />
          {digs
            .filter((d) => GOOD.includes(d.result))
            .map((d) => (
              <ListRow
                key={d.id}
                title={d.title || t(`dig.result.${d.result}`)}
                subtitle={[d.targetId != null ? `ID ${d.targetId}` : null, d.depthCm != null ? `${d.depthCm} cm` : null]
                  .filter(Boolean)
                  .join(' · ')}
                right={formatTime(d.ts, i18n.language)}
                onPress={() => router.push(`/dig/${d.id}`)}
              />
            ))}
        </Section>
      ) : null}

      <Button title={t('summary.backHome')} onPress={() => router.replace('/')} />
    </Screen>
  );
}
