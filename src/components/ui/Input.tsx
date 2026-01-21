import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, textStyles } from '../../theme';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.error.main
    : isFocused
    ? colors.primary[500]
    : colors.border.default;

  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.focused,
          error && styles.error,
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text
          variant="caption"
          color={error ? colors.error.main : 'tertiary'}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    minHeight: 48,
  },
  focused: {
    borderWidth: 2,
  },
  error: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: colors.text.primary,
    paddingVertical: spacing[3],
  },
  icon: {
    marginHorizontal: spacing[2],
  },
  helperText: {
    marginTop: spacing[1],
  },
});

export default Input;
