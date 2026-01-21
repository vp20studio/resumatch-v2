import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, textStyles, TextStyleKey } from '../../theme';

interface TextProps extends RNTextProps {
  variant?: TextStyleKey;
  color?: keyof typeof colors.text | string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  const textColor =
    color in colors.text
      ? colors.text[color as keyof typeof colors.text]
      : color;

  return (
    <RNText
      style={[
        textStyles[variant],
        { color: textColor, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

export default Text;
