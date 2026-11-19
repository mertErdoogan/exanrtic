import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, EmptyState, ListRow, Rule, Screen, Text } from '@/components/ui';
import { devicesRepo } from '@/db/repo';
import { warrantyMonthsLeft } from '@/features/devices/catalog';
import { useData } from '@/lib/useData';
import { space } from '@/theme/tokens';

export default function Devices() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: devices } = useData(() => devicesRepo.list());

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text variant="label">{t('tabs.devices')}</Text>
        <Text variant="display">{t('devices.title')}</Text>
      </View>
      <View>
        <Rule strong />
        {devices && devices.length === 0 ? (
          <EmptyState title={t('devices.empty')} body={t('devices.emptyBody')} />
        ) : (
          devices?.map((d) => {
            const left = warrantyMonthsLeft(d);
            return (
              <ListRow
                key={d.id}
                title={`${d.brand} ${d.model}`}
                subtitle={[t(`devices.tech.${d.technology}`), d.coil].filter(Boolean).join(' · ')}
                right={left == null ? undefined : left < 0 ? t('devices.warrantyExpired') : t('devices.warrantyLeft', { months: left })}
                onPress={() => router.push({ pathname: '/device/edit', params: { id: d.id } })}
              />
            );
          })
        )}
      </View>
      <Button title={t('devices.add')} onPress={() => router.push('/device/edit')} />
      <Button title={t('coach.title')} kind="secondary" onPress={() => router.push('/coach')} />
    </Screen>
  );
}
