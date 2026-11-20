import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, EmptyState, Rule, Screen, Text } from '@/components/ui';
import { getLegalDocument, isLegalDocId } from '@/features/legal/documents';
import { space } from '@/theme/tokens';

export default function LegalDocumentScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  if (!isLegalDocId(doc)) {
    return (
      <Screen>
        <EmptyState title={t('common.notFound')} body={t('common.notFoundBody')} />
        <Button title={t('common.back')} kind="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const document = getLegalDocument(doc, i18n.language);

  return (
    <Screen>
      <Stack.Screen options={{ title: document.title }} />
      <View style={{ gap: space.sm }}>
        <Text variant="label">{t('settings.legal')}</Text>
        <Text variant="title">{document.title}</Text>
        <Text variant="caption">{document.updated}</Text>
        <Text variant="caption" accent>
          {document.draftNotice}
        </Text>
      </View>
      {document.sections.map((section) => (
        <View key={section.heading} style={{ gap: space.sm }}>
          <Rule />
          <Text variant="heading">{section.heading}</Text>
          {section.body.map((paragraph) => (
            <Text key={paragraph} variant="body">
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
      <Button title={t('common.back')} kind="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
