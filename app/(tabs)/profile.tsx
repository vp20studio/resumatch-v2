import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';
import { useAuthStore, useResumeStore, useHistoryStore } from '../../src/stores';
import { formatRelativeDate } from '../../src/utils/formatDate';

export default function ProfileScreen() {
  const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete);

  const resumeText = useResumeStore((state) => state.rawText);
  const parsedData = useResumeStore((state) => state.parsedData);
  const lastUpdated = useResumeStore((state) => state.lastUpdated);
  const clearResume = useResumeStore((state) => state.clearResume);

  const historyCount = useHistoryStore((state) => state.items.length);
  const clearHistory = useHistoryStore((state) => state.clearHistory);

  const hasResume = resumeText.length > 0;

  const handleEditResume = () => {
    router.push('/(modals)/edit-resume');
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all your generation history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all your data including your resume and history. You will need to set up the app again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Clear all data
            clearResume();
            clearHistory();
            setOnboardingComplete(false);
            // Navigate back to onboarding
            router.replace('/(onboarding)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text variant="h1">Profile</Text>
        </View>

        {/* Resume Section */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">Your Resume</Text>
          <Card variant="outlined" padding={4}>
            {hasResume ? (
              <View style={styles.resumeContent}>
                <View style={styles.resumeStats}>
                  <View style={styles.stat}>
                    <Text variant="h2" color={colors.primary[600]}>
                      {parsedData?.skills.length ?? 0}
                    </Text>
                    <Text variant="caption" color="secondary">Skills</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text variant="h2" color={colors.primary[600]}>
                      {parsedData?.experiences.length ?? 0}
                    </Text>
                    <Text variant="caption" color="secondary">Experiences</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text variant="h2" color={colors.primary[600]}>
                      {parsedData?.education.length ?? 0}
                    </Text>
                    <Text variant="caption" color="secondary">Education</Text>
                  </View>
                </View>
                {lastUpdated && (
                  <Text variant="caption" color="tertiary">
                    Last updated {formatRelativeDate(lastUpdated)}
                  </Text>
                )}
                <Button variant="outline" size="sm" onPress={handleEditResume}>
                  Edit Resume
                </Button>
              </View>
            ) : (
              <View style={styles.noResumeContent}>
                <Text variant="body" color="secondary" align="center">
                  No resume uploaded
                </Text>
                <Button variant="primary" size="sm" onPress={handleEditResume}>
                  Add Resume
                </Button>
              </View>
            )}
          </Card>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">Settings</Text>
          <Card variant="outlined" padding={0}>
            <TouchableOpacity
              style={styles.settingsItem}
              activeOpacity={0.7}
              onPress={handleClearHistory}
            >
              <View>
                <Text variant="body">Clear History</Text>
                <Text variant="caption" color="tertiary">
                  {historyCount} generation{historyCount !== 1 ? 's' : ''} saved
                </Text>
              </View>
              <Text variant="body" color={colors.error.main}>Clear</Text>
            </TouchableOpacity>

            <View style={[styles.settingsItem, styles.settingsItemLast]}>
              <Text variant="body">App Version</Text>
              <Text variant="body" color="tertiary">2.0.0</Text>
            </View>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">Danger Zone</Text>
          <Card variant="outlined" padding={4} style={styles.dangerCard}>
            <Text variant="body">Reset App</Text>
            <Text variant="caption" color="secondary">
              Delete all data and start fresh
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={handleResetApp}
              style={styles.dangerButton}
            >
              Reset Everything
            </Button>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    padding: spacing[6],
    gap: spacing[6],
  },
  header: {
    gap: spacing[2],
  },
  section: {
    gap: spacing[3],
  },
  resumeContent: {
    gap: spacing[3],
  },
  resumeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  noResumeContent: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingsItemLast: {
    borderBottomWidth: 0,
  },
  dangerCard: {
    gap: spacing[2],
    borderColor: colors.error.main + '40',
  },
  dangerButton: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
    borderColor: colors.error.main,
  },
});
