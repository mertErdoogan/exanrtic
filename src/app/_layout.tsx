// Side-effect imports: register the background task and i18n before anything renders.
import '@/features/hunt/locationTask';
import '@/i18n';

import {
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { recoverActiveHunt } from '@/features/hunt/service';
import { useSettings } from '@/features/settings/store';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const { success: migrated, error: migrationError } = useMigrations(db, migrations);
  const hydrated = useSettings((s) => s.hydrated);
  const hydrate = useSettings((s) => s.hydrate);
  const onboarded = useSettings((s) => s.onboarded);

  useEffect(() => {
    if (migrated) void hydrate();
  }, [migrated, hydrate]);

  useEffect(() => {
    if (!migrated) return;
    void recoverActiveHunt({ title: t('hunt.active'), body: t('home.greeting') });
  }, [migrated, t]);

  const ready = fontsLoaded && migrated && hydrated;

  useEffect(() => {
    if (ready || migrationError) void SplashScreen.hideAsync();
  }, [ready, migrationError]);

  if (migrationError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.ivory }}>
        <Text>Database error: {migrationError.message}</Text>
      </View>
    );
  }
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ivory },
        }}
      >
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="hunt/start" options={{ presentation: 'modal' }} />
          <Stack.Screen name="hunt/[id]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="hunt/summary/[id]" />
          <Stack.Screen name="dig/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="site/[id]" />
          <Stack.Screen name="device/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" />
          <Stack.Screen name="coach" />
          <Stack.Screen name="report" />
          <Stack.Screen name="offline-maps" />
          <Stack.Screen name="legal/[doc]" />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
