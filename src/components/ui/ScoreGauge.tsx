import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { Text } from './Text';

interface ScoreGaugeProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.success.main;
  if (score >= 60) return colors.accent[500];
  if (score >= 40) return colors.warning.main;
  return colors.error.main;
}

export function ScoreGauge({
  score,
  size = 120,
  strokeWidth = 10,
  label = 'Match Score',
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const scoreColor = getScoreColor(score);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.neutral[200]}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.scoreContainer, { width: size, height: size }]}>
        <Text variant="displayMedium" color={scoreColor}>
          {Math.round(score)}
        </Text>
        <Text variant="caption" color="tertiary">
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scoreContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScoreGauge;
