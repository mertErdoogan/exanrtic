import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Gyroscope } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { sweepsPerMinute, verdict, type GyroSample, type TempoVerdict } from '@/features/coach/tempo';
import { colors, space } from '@/theme/tokens';

const WINDOW_MS = 6000;

export default function Coach() {
  const { t } = useTranslation();
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [spm, setSpm] = useState(0);
  const [state, setState] = useState<TempoVerdict>('idle');
  const samples = useRef<GyroSample[]>([]);
  const lastBuzz = useRef(0);

  useEffect(() => {
    void Gyroscope.isAvailableAsync().then(setAvailable);
  }, []);

  useEffect(() => {
    if (!running) return;
    Gyroscope.setUpdateInterval(40);
    const sub = Gyroscope.addListener(({ x, y, z }) => {
      const now = Date.now();
      samples.current.push({ x, y, z, t: now });
      samples.current = samples.current.filter((s) => now - s.t <= WINDOW_MS);
    });
    const tick = setInterval(() => {
      const value = sweepsPerMinute(samples.current);
      const v = verdict(value);
      setSpm(Math.round(value));
      setState(v);
      // Gentle haptic nudge at most every 4 s, only for "too fast".
      if (v === 'tooFast' && Date.now() - lastBuzz.current > 4000) {
        lastBuzz.current = Date.now();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }, 1000);
    return () => {
      sub.remove();
      clearInterval(tick);
      samples.current = [];
    };
  }, [running]);

  const message =
    state === 'tooFast' ? t('coach.tooFast') : state === 'tooSlow' ? t('coach.tooSlow') : state === 'good' ? t('coach.good') : t('coach.idle');

  return (
    <Screen tone="dark">
      <View style={{ gap: space.xs }}>
        <Button title={`← ${t('common.back')}`} kind="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.back()} />
        <Text variant="label" tone="dark">
          {t('coach.beta')}
        </Text>
        <Text variant="display" tone="dark">
          {t('coach.title')}
        </Text>
        <Text variant="muted" tone="dark">
          {t('coach.body')}
        </Text>
      </View>

      {available === false ? (
        <Text tone="dark">{t('coach.unavailable')}</Text>
      ) : (
        <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxxl }}>
          <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 96, lineHeight: 100, color: colors.textOnInk }}>
            {running ? spm : '—'}
          </Text>
          <Text variant="label" tone="dark" style={{ color: colors.textOnInkMuted }}>
            {t('coach.tempo')}
          </Text>
          <Text variant="title" tone="dark" accent={state === 'tooFast'}>
            {running ? message : ''}
          </Text>
        </View>
      )}

      <Button
        title={running ? t('coach.stop') : t('coach.start')}
        kind={running ? 'outlineDark' : 'brass'}
        size="lg"
        disabled={available === false}
        onPress={() => setRunning((r) => !r)}
      />
    </Screen>
  );
}
