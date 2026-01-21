import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: string;
}

const variantStyles = {
  primary: {
    container: {
      backgroundColor: colors.primary[600],
    },
    pressed: {
      backgroundColor: colors.primary[700],
    },
    text: colors.neutral[0],
  },
  secondary: {
    container: {
      backgroundColor: colors.neutral[100],
    },
    pressed: {
      backgroundColor: colors.neutral[200],
    },
    text: colors.neutral[900],
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    pressed: {
      backgroundColor: colors.neutral[100],
    },
    text: colors.primary[600],
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    pressed: {
      backgroundColor: colors.neutral[50],
    },
    text: colors.neutral[900],
  },
};

const sizeStyles = {
  sm: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    gap: spacing[1],
  },
  md: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  lg: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  const handlePress = (event: any) => {
    // Trigger haptic feedback on press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyle.container,
        sizeStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.text}
        />
      ) : (
        <View style={[styles.content, { gap: sizeStyle.gap }]}>
          {leftIcon}
          <Text
            variant={size === 'sm' ? 'buttonSmall' : 'button'}
            color={variantStyle.text}
          >
            {children}
          </Text>
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
