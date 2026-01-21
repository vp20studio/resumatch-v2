export { colors, darkColors, type ColorToken } from './colors';
export {
  fontWeights,
  fontSize,
  lineHeight,
  textStyles,
  type TextStyleKey,
} from './typography';
export {
  spacing,
  borderRadius,
  shadows,
  hitSlop,
  type SpacingKey,
  type BorderRadiusKey,
  type ShadowKey,
} from './spacing';

// Re-export commonly used values for convenience
export const theme = {
  colors: require('./colors').colors,
  darkColors: require('./colors').darkColors,
  textStyles: require('./typography').textStyles,
  spacing: require('./spacing').spacing,
  borderRadius: require('./spacing').borderRadius,
  shadows: require('./spacing').shadows,
} as const;
