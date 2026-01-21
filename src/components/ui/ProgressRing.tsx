import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { Text } from './Text';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  status?: string;
  isIndeterminate?: boolean;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  status,
  isIndeterminate = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset =
    circumference - (clampedProgress / 100) * circumference;

  if (isIndeterminate) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={size > 60 ? 'large' : 'small'} color={colors.primary[500]} />
        {status && (
          <Text variant="caption" color="secondary" style={styles.status}>
            {status}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.neutral[200]}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary[500]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.progressContainer, { width: size, height: size }]}>
        <Text variant="label" color="primary">
          {Math.round(clampedProgress)}%
        </Text>
      </View>
      {status && (
        <Text variant="caption" color="secondary" style={styles.status}>
          {status}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    marginTop: spacing[2],
    textAlign: 'center',
  },
});

export default ProgressRing;
