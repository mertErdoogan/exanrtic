import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Chip, Rule, Screen, Section, Text } from '@/components/ui';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/i18n';
import { sweepFromDisplay, sweepToDisplay, type UnitSystem } from '@/lib/units';
import { space } from '@/theme/tokens';

export default function Onboarding() {
  const { t } = useTranslation();
  const settings = useSettings();
  const [language, setLanguage] = useState<Language>(settings.language);
  const [units, setUnits] = useState<UnitSystem>(settings.units);
  const [sweep, setSweep] = useState(String(sweepToDisplay(settings.sweepWidthM, settings.units)));

  const chooseLanguage = (l: Language) => {
    setLanguage(l);
    void settings.update({ language: l });
  };

  const finish = async () => {
    const value = Number(sweep.replace(',', '.'));
    const sweepWidthM = Number.isFinite(value) && value > 0 ? sweepFromDisplay(value, units) : 1;
    await settings.update({ language, units, sweepWidthM, onboarded: true });
  };

  return (
    <Screen>
      <View style={{ gap: space.lg, paddingTop: space.xxl }}>
        <Text variant="label">{t('onboarding.eyebrow')}</Text>
        <Text variant="display">{t('onboarding.title')}</Text>
        <Text variant="muted">{t('onboarding.body')}</Text>
      </View>

      <Rule strong />

      <Section label={t('onboarding.language')}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="Türkçe" selected={language === 'tr'} onPress={() => chooseLanguage('tr')} />
          <Chip label="English" selected={language === 'en'} onPress={() => chooseLanguage('en')} />
        </View>
      </Section>

      <Section label={t('onboarding.units')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Chip label={t('onboarding.metric')} selected={units === 'metric'} onPress={() => setUnits('metric')} />
          <Chip label={t('onboarding.imperial')} selected={units === 'imperial'} onPress={() => setUnits('imperial')} />
        </View>
      </Section>

      <Field
        label={`${t('onboarding.sweep')} (${units === 'imperial' ? 'ft' : 'm'})`}
        hint={t('onboarding.sweepHelp')}
        keyboardType="decimal-pad"
        value={sweep}
        onChangeText={setSweep}
      />

      <View style={{ gap: space.sm }}>
        <Text variant="heading">{t('onboarding.privacyTitle')}</Text>
        <Text variant="muted">{t('onboarding.privacyBody')}</Text>
      </View>

      <Button title={t('onboarding.start')} size="lg" onPress={finish} />
    </Screen>
  );
}
