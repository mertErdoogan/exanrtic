import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState, ListRow, Rule, Screen, Text } from '@/components/ui';
import { sitesRepo } from '@/db/repo';
import { formatShortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { space } from '@/theme/tokens';

export default function Sites() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: sites } = useData(() => sitesRepo.list());

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text variant="label">{t('tabs.sites')}</Text>
        <Text variant="display">{t('sites.title')}</Text>
      </View>
      <View>
        <Rule strong />
        {sites && sites.length === 0 ? (
          <EmptyState title={t('sites.empty')} body={t('sites.emptyBody')} />
        ) : (
          sites?.map((s) => (
            <ListRow
              key={s.id}
              title={s.name}
              subtitle={[
                t('sites.visits', { count: s.visits }),
                `${s.digCount} ${t('hunt.digs')}`,
                s.lastVisit ? t('sites.lastVisit', { date: formatShortDate(s.lastVisit, i18n.language) }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              onPress={() => router.push(`/site/${s.id}`)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
