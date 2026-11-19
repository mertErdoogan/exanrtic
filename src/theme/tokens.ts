/**
 * Design tokens. Same visual language as the website:
 * ivory ground, ink sections, brass accent, serif display + sans body.
 * Contrast pairs are chosen to pass WCAG AA for body text.
 */
export const colors = {
  ivory: '#F3EFE7',
  ivoryDeep: '#EAE4D8',
  ink: '#15130F',
  inkSoft: '#1B1A16',
  inkRaised: '#24221D',
  line: '#D9D1C2',
  lineDark: '#3A352C',
  text: '#15130F',
  textMuted: '#4A4439',
  textSubtle: '#6A6255',
  textOnInk: '#EDE7DA',
  textOnInkMuted: '#A39D90',
  brass: '#C9A465', // on ink
  brassDeep: '#7A5C2E', // on ivory
  olive: '#262A21',
  danger: '#9B2C1F',
  success: '#3F6B3A',
  coverage: 'rgba(201, 164, 101, 0.28)',
} as const;

export const fonts = {
  display: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  displayMedium: 'CormorantGaramond_500Medium',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sharp: 2,
  sm: 8,
  md: 14,
  lg: 22,
} as const;

/** Minimum touch target for field use (gloves, sunlight). */
export const touch = {
  min: 48,
  large: 64,
  hero: 84,
} as const;
