import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, EmptyState, ListRow, Rule, Screen, Section, Text } from '@/components/ui';
import { sessionsRepo, sitesRepo } from '@/db/repo';
import { useSettings } from '@/features/settings/store';
import { formatShortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { formatArea, formatDistance } from '@/lib/units';
import { colors, space } from '@/theme/tokens';

export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const units = useSettings((s) => s.units);

  const { data } = useData(async () => {
    const active = await sessionsRepo.getActive();
    const activeSite = active ? await sitesRepo.get(active.siteId) : undefined;
    const recent = await sessionsRepo.recent(8);
    return { active, activeSite, recent };
  });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label">{t('home.greeting')}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} hitSlop={12}>
          <Text variant="label" style={{ color: colors.text }}>
            {t('home.settings')}
          </Text>
        </Pressable>
      </View>

      <Text variant="display">{t('home.title')}</Text>

      {data?.active ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/hunt/${data.active!.id}`)}
          style={{ backgroundColor: colors.ink, padding: space.xl, gap: space.sm, borderRadius: 2 }}
        >
          <Text variant="label" tone="dark">
            {t('home.activeHunt')}
          </Text>
          <Text variant="title" tone="dark">
            {data.activeSite?.name ?? '—'}
          </Text>
          <Text variant="label" tone="dark" style={{ color: colors.textOnInk }}>
            {t('home.resumeHunt')} →
          </Text>
        </Pressable>
      ) : (
        <Button title={t('home.startHunt')} kind="primary" size="hero" onPress={() => router.push('/hunt/start')} />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/report')}
        style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.ink, paddingVertical: space.xl, gap: space.xs }}
      >
        <Text variant="label">{t('home.siteReport')}</Text>
        <Text variant="heading">{t('home.siteReportBody')}</Text>
      </Pressable>

      <Section label={t('home.recent')}>
        <Rule strong />
        {data && data.recent.length === 0 ? (
          <EmptyState title={t('home.noHuntsTitle')} body={t('home.noHuntsBody')} />
        ) : (
          data?.recent.map(({ session, siteName }) => (
            <ListRow
              key={session.id}
              title={siteName}
              subtitle={`${formatDistance(session.distanceM, units, i18n.language)} · ${formatArea(
                session.coveredM2,
                units,
                i18n.language,
              )}`}
              right={formatShortDate(session.startedAt, i18n.language)}
              onPress={() => router.push(`/hunt/summary/${session.id}`)}
            />
          ))
        )}
      </Section>
    </Screen>
  );
}
