import { TextStyle, Platform } from 'react-native';

/**
 * Typography tokens for ResuMatch
 * Uses system fonts for optimal performance
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// Font weights mapped to platform-specific values
export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

// Type scale based on 4pt grid
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// Line heights
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Pre-composed text styles
export const textStyles = {
  // Display styles (large headings)
  displayLarge: {
    fontFamily,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
  } as TextStyle,

  displayMedium: {
    fontFamily,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  } as TextStyle,

  // Heading styles
  h1: {
    fontFamily,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  } as TextStyle,

  h2: {
    fontFamily,
    fontSize: fontSize.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSize.xl * lineHeight.tight,
  } as TextStyle,

  h3: {
    fontFamily,
    fontSize: fontSize.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSize.lg * lineHeight.tight,
  } as TextStyle,

  // Body styles
  bodyLarge: {
    fontFamily,
    fontSize: fontSize.lg,
    fontWeight: fontWeights.regular,
    lineHeight: fontSize.lg * lineHeight.normal,
  } as TextStyle,

  body: {
    fontFamily,
    fontSize: fontSize.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSize.base * lineHeight.normal,
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: fontSize.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  // Caption/label styles
  caption: {
    fontFamily,
    fontSize: fontSize.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
  } as TextStyle,

  label: {
    fontFamily,
    fontSize: fontSize.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  // Button text
  button: {
    fontFamily,
    fontSize: fontSize.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSize.base * lineHeight.tight,
  } as TextStyle,

  buttonSmall: {
    fontFamily,
    fontSize: fontSize.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSize.sm * lineHeight.tight,
  } as TextStyle,
} as const;

export type TextStyleKey = keyof typeof textStyles;
