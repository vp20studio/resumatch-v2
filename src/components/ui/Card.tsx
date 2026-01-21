import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, ShadowKey } from '../../theme';

type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: keyof typeof spacing;
  shadow?: ShadowKey;
  children: React.ReactNode;
}

const variantStyles = {
  elevated: {
    backgroundColor: colors.background.primary,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filled: {
    backgroundColor: colors.background.secondary,
    borderWidth: 0,
  },
};

export function Card({
  variant = 'elevated',
  padding = 4,
  shadow = 'md',
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.container,
        variantStyles[variant],
        { padding: spacing[padding] },
        variant === 'elevated' && shadows[shadow],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});

export default Card;
