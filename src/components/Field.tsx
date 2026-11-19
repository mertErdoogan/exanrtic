import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, space, touch } from '@/theme/tokens';

import { Text } from './ui';

export function Field({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text variant="label" style={{ color: colors.textSubtle }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        {...input}
      />
      {hint ? <Text variant="caption">{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: touch.min,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.text,
    paddingVertical: space.sm,
  },
});
