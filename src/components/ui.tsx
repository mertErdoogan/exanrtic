import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, fonts, radius, space, touch } from '@/theme/tokens';

type Tone = 'light' | 'dark';

/* ------------------------------------------------------------------ Text */

type Variant = 'display' | 'title' | 'heading' | 'body' | 'muted' | 'label' | 'stat' | 'caption';

const variantStyles: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.4 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34 },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 27 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase' },
  stat: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
};

export type TextProps = RNTextProps & { variant?: Variant; tone?: Tone; accent?: boolean };

export function Text({ variant = 'body', tone = 'light', accent, style, ...rest }: TextProps) {
  const muted = variant === 'muted' || variant === 'caption';
  let color: string = tone === 'dark' ? colors.textOnInk : colors.text;
  if (muted) color = tone === 'dark' ? colors.textOnInkMuted : colors.textMuted;
  if (variant === 'label') color = tone === 'dark' ? colors.brass : colors.brassDeep;
  if (accent) color = tone === 'dark' ? colors.brass : colors.brassDeep;
  return <RNText {...rest} style={[variantStyles[variant], { color }, style]} />;
}

/* ---------------------------------------------------------------- Screen */

export function Screen({
  children,
  tone = 'light',
  scroll = true,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  tone?: Tone;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const bg = tone === 'dark' ? colors.ink : colors.ivory;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.screenContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/* ---------------------------------------------------------------- Button */

type ButtonKind = 'primary' | 'secondary' | 'brass' | 'ghost' | 'danger' | 'outlineDark';

export function Button({
  title,
  kind = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  ...rest
}: Omit<PressableProps, 'style'> & {
  title: string;
  kind?: ButtonKind;
  size?: 'md' | 'lg' | 'hero';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.ink, fg: colors.ivory, border: colors.ink },
    secondary: { bg: 'transparent', fg: colors.ink, border: colors.ink },
    brass: { bg: colors.brass, fg: colors.ink, border: colors.brass },
    ghost: { bg: 'transparent', fg: colors.brassDeep, border: 'transparent' },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
    outlineDark: { bg: 'transparent', fg: colors.textOnInk, border: colors.lineDark },
  };
  const p = palette[kind];
  const height = size === 'hero' ? touch.hero : size === 'lg' ? touch.large : touch.min;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: height,
          backgroundColor: p.bg,
          borderColor: p.border,
          borderRadius: size === 'hero' ? radius.lg : radius.sharp,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <RNText
          style={{
            color: p.fg,
            fontFamily: fonts.bodyBold,
            fontSize: size === 'hero' ? 18 : 13,
            letterSpacing: size === 'hero' ? 5 : 1.8,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </RNText>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------ Layout bits */

export function Rule({ tone = 'light', strong }: { tone?: Tone; strong?: boolean }) {
  const c = tone === 'dark' ? colors.lineDark : strong ? colors.ink : colors.line;
  return <View style={{ height: StyleSheet.hairlineWidth * (strong ? 2 : 1), backgroundColor: c }} />;
}

export function Section({ label, title, children, tone = 'light' }: {
  label?: string;
  title?: string;
  children?: ReactNode;
  tone?: Tone;
}) {
  return (
    <View style={{ gap: space.md }}>
      {label ? <Text variant="label" tone={tone}>{label}</Text> : null}
      {title ? <Text variant="title" tone={tone}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Stat({ value, label, tone = 'light' }: { value: string; label: string; tone?: Tone }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="stat" tone={tone}>{value}</Text>
      <Text variant="label" tone={tone} style={{ color: tone === 'dark' ? colors.textOnInkMuted : colors.textSubtle }}>
        {label}
      </Text>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  tone = 'light',
}: {
  title: string;
  subtitle?: string;
  right?: string;
  onPress?: () => void;
  tone?: Tone;
}) {
  const content = (
    <View style={[styles.row, tone === 'dark' && { borderBottomColor: colors.lineDark }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading" tone={tone}>{title}</Text>
        {subtitle ? <Text variant="muted" tone={tone}>{subtitle}</Text> : null}
      </View>
      {right ? <Text variant="label" tone={tone}>{right}</Text> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

export function EmptyState({ title, body, tone = 'light' }: { title: string; body: string; tone?: Tone }) {
  return (
    <View style={{ paddingVertical: space.xxl, gap: space.sm }}>
      <Text variant="heading" tone={tone}>{title}</Text>
      <Text variant="muted" tone={tone}>{body}</Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <RNText
        style={{
          color: selected ? colors.ivory : colors.ink,
          fontFamily: fonts.bodySemi,
          fontSize: 13,
          letterSpacing: 0.6,
        }}
      >
        {label}
      </RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.xxxl * 2,
    gap: space.xxl,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  chip: {
    minHeight: touch.min,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: radius.sharp,
  },
});
