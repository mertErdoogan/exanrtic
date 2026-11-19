import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

/** Text-only tab bar: quieter and more editorial than an icon row. */
function Dot({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: focused ? colors.brassDeep : 'transparent',
      }}
    />
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.ivory,
          borderTopColor: colors.line,
          height: 76,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemi,
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
        },
        tabBarIcon: ({ focused }) => <Dot focused={focused} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="sites" options={{ title: t('tabs.sites') }} />
      <Tabs.Screen name="collection" options={{ title: t('tabs.collection') }} />
      <Tabs.Screen name="devices" options={{ title: t('tabs.devices') }} />
    </Tabs>
  );
}
