import { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text, Button, Card } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';
import {
  useHistoryStore,
  useGoalsStore,
  type ApplicationStatus,
  type HistoryItem,
} from '../../src/stores';
import { formatRelativeDate } from '../../src/utils/formatDate';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; emoji: string }> = {
  generated: { label: 'Generated', color: colors.text.tertiary, emoji: '📝' },
  applied: { label: 'Applied', color: colors.primary[600], emoji: '📤' },
  replied: { label: 'Replied', color: colors.accent[500], emoji: '💬' },
  interviewing: { label: 'Interview', color: colors.warning.main, emoji: '🎯' },
  offer: { label: 'Offer', color: colors.success.main, emoji: '🎉' },
  rejected: { label: 'Rejected', color: colors.error.main, emoji: '❌' },
};

const STATUS_OPTIONS: ApplicationStatus[] = ['applied', 'replied', 'interviewing', 'offer', 'rejected'];

type FilterStatus = 'all' | ApplicationStatus;

export default function TrackerScreen() {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const items = useHistoryStore((state) => state.items);
  const updateStatus = useHistoryStore((state) => state.updateStatus);

  // Goals/Gamification state - select raw values to avoid infinite loops
  const currentStreak = useGoalsStore((state) => state.currentStreak);
  const startDate = useGoalsStore((state) => state.startDate);
  const targetDays = useGoalsStore((state) => state.targetDays);
  const weeklyTarget = useGoalsStore((state) => state.weeklyTarget);
  const weeklyApplications = useGoalsStore((state) => state.weeklyApplications);
  const weekStartDate = useGoalsStore((state) => state.weekStartDate);

  const hasGoals = startDate !== null;

  // Compute status counts with useMemo
  const statusCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      generated: 0,
      applied: 0,
      replied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    };
    items.forEach((item) => {
      counts[item.status]++;
    });
    return counts;
  }, [items]);

  // Compute derived goals values with useMemo
  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    const day = currentWeekStart.getDay();
    currentWeekStart.setDate(currentWeekStart.getDate() - day);
    currentWeekStart.setHours(0, 0, 0, 0);

    const storedWeekStart = weekStartDate ? new Date(weekStartDate) : null;
    let current = weeklyApplications;
    if (!storedWeekStart || currentWeekStart > storedWeekStart) {
      current = 0;
    }
    return {
      current,
      target: weeklyTarget,
      percentage: Math.min(100, Math.round((current / weeklyTarget) * 100)),
    };
  }, [weeklyApplications, weekStartDate, weeklyTarget]);

  const daysRemaining = useMemo(() => {
    if (!startDate) return targetDays;
    const start = new Date(startDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, targetDays - elapsed);
  }, [startDate, targetDays]);

  const motivationalMessage = useMemo(() => {
    const remaining = weeklyProgress.target - weeklyProgress.current;
    if (currentStreak >= 7) return "You're unstoppable! 🔥";
    if (currentStreak >= 5) return "You're on fire! Keep it up! 🔥";
    if (currentStreak >= 3) return "Nice streak! Keep the momentum! 💪";
    if (weeklyProgress.current >= weeklyProgress.target) return "Weekly goal crushed! You're amazing! 🎉";
    if (weeklyProgress.percentage >= 80) return `Almost there! Just ${remaining} more to go! 🏁`;
    if (weeklyProgress.percentage >= 50) return "Halfway there! You've got this! 💪";
    if (weeklyProgress.current === 0) return "Your first application is the hardest. Let's go! 🚀";
    return `${remaining} more this week to hit your goal! 📈`;
  }, [currentStreak, weeklyProgress]);

  const filteredItems = filter === 'all'
    ? items.filter(i => i.status !== 'generated')
    : items.filter((i) => i.status === filter);

  const handleStatusChange = (item: HistoryItem) => {
    const currentIndex = STATUS_OPTIONS.indexOf(item.status as ApplicationStatus);
    const options = STATUS_OPTIONS.map((status) => ({
      text: `${STATUS_CONFIG[status].emoji} ${STATUS_CONFIG[status].label}`,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        updateStatus(item.id, status);
      },
    }));

    Alert.alert(
      'Update Status',
      `${item.jobTitle} at ${item.company}`,
      [
        ...options,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleViewResult = (item: HistoryItem) => {
    // Load result into generation store and navigate
    const { setResult } = require('../../src/stores').useGenerationStore.getState();
    setResult(item.result);
    router.push('/(modals)/result');
  };

  const renderPipeline = () => (
    <View style={styles.pipeline}>
      <PipelineStage
        count={statusCounts.applied}
        label="Applied"
        color={STATUS_CONFIG.applied.color}
        isFirst
      />
      <View style={styles.pipelineArrow}>
        <Text color="tertiary">→</Text>
      </View>
      <PipelineStage
        count={statusCounts.replied}
        label="Replied"
        color={STATUS_CONFIG.replied.color}
      />
      <View style={styles.pipelineArrow}>
        <Text color="tertiary">→</Text>
      </View>
      <PipelineStage
        count={statusCounts.interviewing}
        label="Interview"
        color={STATUS_CONFIG.interviewing.color}
      />
      <View style={styles.pipelineArrow}>
        <Text color="tertiary">→</Text>
      </View>
      <PipelineStage
        count={statusCounts.offer}
        label="Offers"
        color={STATUS_CONFIG.offer.color}
        isLast
      />
    </View>
  );

  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContainer}
    >
      <FilterChip
        label="All"
        count={items.filter(i => i.status !== 'generated').length}
        active={filter === 'all'}
        onPress={() => setFilter('all')}
      />
      {STATUS_OPTIONS.map((status) => (
        <FilterChip
          key={status}
          label={STATUS_CONFIG[status].label}
          count={statusCounts[status]}
          active={filter === status}
          color={STATUS_CONFIG[status].color}
          onPress={() => setFilter(status)}
        />
      ))}
    </ScrollView>
  );

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleViewResult(item)}
      onLongPress={() => handleStatusChange(item)}
    >
      <Card variant="outlined" padding={4} style={styles.applicationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text variant="label" numberOfLines={1}>
              {item.jobTitle}
            </Text>
            <Text variant="body" color="secondary" numberOfLines={1}>
              {item.company}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_CONFIG[item.status].color + '20' },
            ]}
            onPress={() => handleStatusChange(item)}
          >
            <Text
              variant="caption"
              style={{ color: STATUS_CONFIG[item.status].color }}
            >
              {STATUS_CONFIG[item.status].emoji} {STATUS_CONFIG[item.status].label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          <Text variant="caption" color="tertiary">
            {item.appliedDate
              ? `Applied ${formatRelativeDate(item.appliedDate)}`
              : `Created ${formatRelativeDate(item.createdAt)}`}
          </Text>
          <View style={styles.scoreContainer}>
            <Text variant="caption" color={colors.primary[600]}>
              {item.matchScore}% match
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text variant="h2" align="center">
        No applications yet
      </Text>
      <Text variant="body" color="secondary" align="center">
        Your first application is the hardest. Let's go!
      </Text>
      <Button
        variant="primary"
        onPress={() => router.push('/(tabs)/generate')}
        style={styles.emptyButton}
      >
        Generate Your First Resume
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={[0]}>
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <Text variant="h1">Job Tracker</Text>
          </View>

          {/* Progress Stats */}
          {hasGoals && (
            <Card variant="filled" padding={4} style={styles.progressCard}>
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text variant="h2" color={colors.primary[600]}>
                    {weeklyProgress.current}/{weeklyProgress.target}
                  </Text>
                  <Text variant="caption" color="secondary">This Week</Text>
                </View>
                {currentStreak > 0 && (
                  <View style={styles.progressStat}>
                    <Text variant="h2" color={colors.warning.main}>
                      🔥 {currentStreak}
                    </Text>
                    <Text variant="caption" color="secondary">Day Streak</Text>
                  </View>
                )}
                <View style={styles.progressStat}>
                  <Text variant="h2" color={colors.accent[500]}>
                    {daysRemaining}
                  </Text>
                  <Text variant="caption" color="secondary">Days Left</Text>
                </View>
              </View>
              <Text variant="body" align="center" style={styles.motivationText}>
                {motivationalMessage}
              </Text>
            </Card>
          )}

          {/* Pipeline */}
          {items.some(i => i.status !== 'generated') && (
            <Card variant="outlined" padding={4}>
              {renderPipeline()}
            </Card>
          )}

          {/* Filters */}
          {renderFilters()}
        </View>

        {/* Applications List */}
        <View style={styles.listContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))
          ) : (
            renderEmpty()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PipelineStage({
  count,
  label,
  color,
  isFirst,
  isLast,
}: {
  count: number;
  label: string;
  color: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={styles.pipelineStage}>
      <View style={[styles.pipelineCount, { backgroundColor: color + '20' }]}>
        <Text variant="h2" style={{ color }}>
          {count}
        </Text>
      </View>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
    </View>
  );
}

function FilterChip({
  label,
  count,
  active,
  color,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active && styles.filterChipActive,
        active && color && { backgroundColor: color + '20', borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        variant="caption"
        style={{
          color: active ? (color || colors.primary[600]) : colors.text.secondary,
        }}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    paddingBottom: spacing[8],
  },
  stickyHeader: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[4],
  },
  header: {
    marginBottom: spacing[2],
  },
  progressCard: {
    gap: spacing[3],
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
    gap: spacing[1],
  },
  motivationText: {
    marginTop: spacing[2],
  },
  pipeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pipelineStage: {
    alignItems: 'center',
    gap: spacing[1],
  },
  pipelineCount: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineArrow: {
    paddingHorizontal: spacing[1],
  },
  filtersContainer: {
    paddingVertical: spacing[2],
    gap: spacing[2],
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    marginRight: spacing[2],
  },
  filterChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  listContainer: {
    padding: spacing[4],
    gap: spacing[3],
  },
  applicationCard: {
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyButton: {
    marginTop: spacing[4],
  },
});
