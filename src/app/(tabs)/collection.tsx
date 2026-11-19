import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, Rule, Screen, Text } from '@/components/ui';
import { digsRepo } from '@/db/repo';
import { formatShortDate } from '@/lib/format';
import { useData } from '@/lib/useData';
import { colors, space } from '@/theme/tokens';

export default function Collection() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { data } = useData(async () => {
    const rows = await digsRepo.collection();
    const photos = await digsRepo.firstPhotos(rows.map((r) => r.dig.id));
    return rows.map((r) => ({ ...r, photo: photos.get(r.dig.id) ?? null }));
  });

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text variant="label">{t('tabs.collection')}</Text>
        <Text variant="display">{t('collection.title')}</Text>
      </View>
      <Rule strong />
      {data && data.length === 0 ? (
        <EmptyState title={t('collection.empty')} body={t('collection.emptyBody')} />
      ) : (
        <View style={styles.grid}>
          {data?.map(({ dig, siteName, photo }) => (
            <Pressable
              key={dig.id}
              accessibilityRole="button"
              onPress={() => router.push(`/dig/${dig.id}`)}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={styles.frame}>
                {photo ? (
                  <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <View style={styles.coin} />
                )}
              </View>
              <View style={styles.caption}>
                <Text variant="heading" numberOfLines={1}>
                  {dig.title || t(`dig.result.${dig.result}`)}
                </Text>
                <Text variant="label" style={{ color: colors.textSubtle }} numberOfLines={1}>
                  {siteName} · {formatShortDate(dig.ts, i18n.language)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.xl },
  card: { width: '47.5%', gap: space.sm },
  frame: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.ivoryDeep,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coin: { width: '46%', aspectRatio: 1, borderRadius: 999, backgroundColor: colors.brass, opacity: 0.85 },
  caption: { borderTopWidth: 1, borderTopColor: colors.ink, paddingTop: space.sm, gap: 2 },
});
