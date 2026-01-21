import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { Text } from './Text';

interface MatchItemProps {
  requirement: string;
  matchedContent: string;
  score: number; // 0-100
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Exact', color: colors.success.main };
  if (score >= 70) return { label: 'Strong', color: colors.accent[500] };
  if (score >= 50) return { label: 'Partial', color: colors.warning.main };
  return { label: 'Weak', color: colors.error.main };
}

export function MatchItem({ requirement, matchedContent, score }: MatchItemProps) {
  const { label, color } = getScoreLabel(score);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text variant="caption" color={color}>
            {label}
          </Text>
        </View>
        <Text variant="caption" color="tertiary">
          {score}%
        </Text>
      </View>
      <Text variant="bodySmall" color="secondary" style={styles.requirement}>
        {requirement}
      </Text>
      <View style={[styles.matchBar, { backgroundColor: color }]} />
      <Text variant="body" color="primary">
        {matchedContent}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  requirement: {
    fontStyle: 'italic',
  },
  matchBar: {
    height: 2,
    borderRadius: 1,
  },
});

export default MatchItem;
