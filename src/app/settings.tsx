import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Share, View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Chip, Rule, Screen, Section, Text } from '@/components/ui';
import { deleteAllData, exportAllData } from '@/db/repo';
import { availableStyles, resolveStyle, usingDemoMap } from '@/features/maps/styles';
import { useSettings } from '@/features/settings/store';
import { sweepFromDisplay, sweepToDisplay } from '@/lib/units';
import { space } from '@/theme/tokens';

export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const s = useSettings();
  const [sweep, setSweep] = useState(String(sweepToDisplay(s.sweepWidthM, s.units)));

  const saveSweep = () => {
    const v = Number(sweep.replace(',', '.'));
    if (Number.isFinite(v) && v > 0) void s.update({ sweepWidthM: sweepFromDisplay(v, s.units) });
  };

  const exportData = async () => {
    const data = await exportAllData();
    const file = new File(Paths.cache, `dedektor-asistani-${Date.now()}.json`);
    file.create({ overwrite: true });
    file.write(JSON.stringify(data, null, 2));
    await Share.share({ url: file.uri, title: t('settings.exported') });
  };

  const deleteAll = () =>
    Alert.alert(t('settings.deleteAll'), t('settings.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteAllData();
          router.replace('/');
        },
      },
    ]);

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Button title={`← ${t('common.back')}`} kind="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.back()} />
        <Text variant="display">{t('settings.title')}</Text>
      </View>

      <Section label={t('settings.language')}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="Türkçe" selected={s.language === 'tr'} onPress={() => s.update({ language: 'tr' })} />
          <Chip label="English" selected={s.language === 'en'} onPress={() => s.update({ language: 'en' })} />
        </View>
      </Section>

      <Section label={t('settings.units')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Chip label={t('onboarding.metric')} selected={s.units === 'metric'} onPress={() => s.update({ units: 'metric' })} />
          <Chip label={t('onboarding.imperial')} selected={s.units === 'imperial'} onPress={() => s.update({ units: 'imperial' })} />
        </View>
      </Section>

      <Field
        label={`${t('settings.sweep')} (${s.units === 'imperial' ? 'ft' : 'm'})`}
        hint={t('onboarding.sweepHelp')}
        keyboardType="decimal-pad"
        value={sweep}
        onChangeText={setSweep}
        onEndEditing={saveSweep}
      />

      <Section label={t('settings.mapLayer')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {availableStyles().map((st) => (
            <Chip
              key={st.id}
              label={t(`maps.style.${st.id}`)}
              selected={resolveStyle(s.mapStyle).id === st.id}
              onPress={() => s.update({ mapStyle: st.id })}
            />
          ))}
        </View>
        {usingDemoMap() ? <Text variant="caption">{t('maps.demoWarning')}</Text> : null}
      </Section>

      <Button title={t('settings.offlineMaps')} kind="secondary" onPress={() => router.push('/offline-maps')} />
      <Button title={t('settings.coach')} kind="secondary" onPress={() => router.push('/coach')} />

      <Rule strong />

      <Section label={t('settings.privacy')}>
        <Text variant="muted">{t('settings.privacyBody')}</Text>
        <Button title={t('settings.exportData')} kind="secondary" onPress={exportData} />
        <Button title={t('settings.deleteAll')} kind="danger" onPress={deleteAll} />
      </Section>

      <Section label={t('settings.legal')}>
        <Button title={t('settings.privacyPolicy')} kind="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.push('/legal/privacy')} />
        <Button title={t('settings.terms')} kind="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.push('/legal/terms')} />
      </Section>

      <Text variant="caption">{t('settings.version', { v: Constants.expoConfig?.version ?? '—' })}</Text>
    </Screen>
  );
}
