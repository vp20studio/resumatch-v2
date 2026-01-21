/**
 * Color tokens for ResuMatch
 * Primary: Deep purple/indigo for professionalism
 * Accent: Teal for success/progress indicators
 */

export const colors = {
  // Primary palette
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Accent palette (teal for success/progress)
  accent: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  // Semantic colors
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#2563EB',
  },

  // Neutral palette
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Border colors
  border: {
    light: '#E5E7EB',
    default: '#D1D5DB',
    dark: '#9CA3AF',
  },
} as const;

// Dark mode colors
export const darkColors = {
  ...colors,
  background: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    inverse: '#111827',
  },
  border: {
    light: '#374151',
    default: '#4B5563',
    dark: '#6B7280',
  },
} as const;

export type ColorToken = typeof colors;
