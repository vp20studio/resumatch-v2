import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { Text } from './Text';

interface MissingItemProps {
  requirement: string;
  isRequired?: boolean;
  suggestion?: string;
}

export function MissingItem({
  requirement,
  isRequired = false,
  suggestion,
}: MissingItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            isRequired ? styles.requiredBadge : styles.preferredBadge,
          ]}
        >
          <Text
            variant="caption"
            color={isRequired ? colors.error.main : colors.warning.main}
          >
            {isRequired ? 'Required' : 'Preferred'}
          </Text>
        </View>
      </View>
      <Text variant="body" color="primary">
        {requirement}
      </Text>
      {suggestion && (
        <View style={styles.suggestionContainer}>
          <Text variant="caption" color="tertiary">
            Tip:
          </Text>
          <Text variant="bodySmall" color="secondary">
            {suggestion}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    gap: spacing[2],
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  requiredBadge: {
    backgroundColor: colors.error.light,
  },
  preferredBadge: {
    backgroundColor: colors.warning.light,
  },
  suggestionContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing[2],
    gap: spacing[1],
  },
});

export default MissingItem;
