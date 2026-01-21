import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { useApplicationsStore } from '../../src/stores';

export default function HistoryScreen() {
  const applications = useApplicationsStore((state) => state.applications);

  if (applications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="displayLarge">📋</Text>
          <Text variant="h2" align="center">No Applications Yet</Text>
          <Text variant="body" color="secondary" align="center">
            Your tailored resumes will appear here after you generate them
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="h1">Applications</Text>
            <Text variant="body" color="secondary">
              {applications.length} saved applications
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApplicationCard
            jobTitle={item.jobTitle}
            company={item.company}
            matchScore={item.matchScore}
            date={formatDate(item.createdAt)}
            status={item.status}
          />
        )}
      />
    </SafeAreaView>
  );
}

function ApplicationCard({
  jobTitle,
  company,
  matchScore,
  date,
  status,
}: {
  jobTitle: string;
  company: string;
  matchScore: number;
  date: string;
  status: string;
}) {
  const statusColors: Record<string, string> = {
    saved: colors.neutral[400],
    applied: colors.info.main,
    interview: colors.warning.main,
    offer: colors.success.main,
    rejected: colors.error.main,
  };

  return (
    <TouchableOpacity activeOpacity={0.7}>
      <Card variant="elevated" padding={4} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text variant="h3" numberOfLines={1}>{jobTitle}</Text>
            <Text variant="bodySmall" color="secondary">{company}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text variant="h2" color={getScoreColor(matchScore)}>
              {matchScore}%
            </Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text variant="caption" color="tertiary">{date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[status] + '20' }]}>
            <Text variant="caption" color={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.success.main;
  if (score >= 60) return colors.accent[500];
  if (score >= 40) return colors.warning.main;
  return colors.error.main;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  list: {
    padding: spacing[6],
    gap: spacing[4],
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
  },
  scoreContainer: {
    marginLeft: spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 4,
  },
});
