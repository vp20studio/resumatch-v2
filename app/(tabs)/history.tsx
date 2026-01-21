import { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text, Card, Button } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';
import { useHistoryStore, useGenerationStore, HistoryItem } from '../../src/stores';
import { formatRelativeDate } from '../../src/utils/formatDate';

export default function HistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const items = useHistoryStore((state) => state.items);
  const removeItem = useHistoryStore((state) => state.removeItem);
  const setResult = useGenerationStore((state) => state.setResult);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Haptic feedback on refresh
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate a brief refresh delay (data is local, so just visual feedback)
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const handleItemPress = (item: HistoryItem) => {
    // Load the result into generation store and navigate to result modal
    setResult(item.result);
    router.push('/(modals)/result');
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeItem(id);
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="displayLarge">📋</Text>
          <Text variant="h2" align="center">No History Yet</Text>
          <Text variant="body" color="secondary" align="center">
            Your tailored resumes will appear here after you generate them
          </Text>
          <Button onPress={() => router.push('/(tabs)/generate')}>
            Generate Resume
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleDelete(item.id)}
    >
      <Card variant="elevated" padding={4} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text variant="h3" numberOfLines={1}>{item.jobTitle}</Text>
            <Text variant="bodySmall" color="secondary" numberOfLines={1}>
              {item.company}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.matchScore) + '20' }]}>
              <Text variant="h3" color={getScoreColor(item.matchScore)}>
                {item.matchScore}%
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text variant="caption" color="tertiary">
            {formatRelativeDate(item.createdAt)}
          </Text>
          <Text variant="caption" color="secondary">
            Tap to view
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[600]}
            colors={[colors.primary[600]]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="h1">History</Text>
            <Text variant="body" color="secondary">
              {items.length} generation{items.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.success.main;
  if (score >= 60) return colors.warning.main;
  return colors.error.main;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  list: {
    padding: spacing[6],
  },
  header: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[6],
  },
  card: {
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    gap: spacing[1],
    marginRight: spacing[3],
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    height: spacing[3],
  },
});
