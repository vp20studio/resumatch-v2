import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';
import { useAuthStore, useResumeStore, useApplicationsStore } from '../../src/stores';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const isPremium = useAuthStore((state) => state.user?.isPremium);
  const logout = useAuthStore((state) => state.logout);

  const resumeText = useResumeStore((state) => state.rawText);
  const lastUpdated = useResumeStore((state) => state.lastUpdated);
  const clearResume = useResumeStore((state) => state.clearResume);

  const applicationCount = useApplicationsStore((state) => state.applications.length);

  const handleUpdateResume = () => {
    clearResume();
    router.push('/(onboarding)/upload');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text variant="displayLarge">👤</Text>
          </View>
          <Text variant="h1" align="center">
            {user?.name || 'User'}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {user?.email || 'user@example.com'}
          </Text>
        </View>

        {!isPremium && (
          <Card variant="filled" padding={4} style={styles.upgradeCard}>
            <Text variant="h3">Upgrade to Pro</Text>
            <Text variant="bodySmall" color="secondary">
              Unlimited resumes, cover letters, and more
            </Text>
            <Button
              size="sm"
              onPress={() => router.push('/(modals)/paywall')}
              style={styles.upgradeButton}
            >
              View Plans
            </Button>
          </Card>
        )}

        <View style={styles.section}>
          <Text variant="label" color="secondary">Your Resume</Text>
          <Card variant="outlined" padding={4}>
            <View style={styles.resumeInfo}>
              <View>
                <Text variant="body">
                  {resumeText ? 'Resume uploaded' : 'No resume'}
                </Text>
                {lastUpdated && (
                  <Text variant="caption" color="tertiary">
                    Updated {formatDate(lastUpdated)}
                  </Text>
                )}
              </View>
              <Button variant="outline" size="sm" onPress={handleUpdateResume}>
                {resumeText ? 'Update' : 'Upload'}
              </Button>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="label" color="secondary">Stats</Text>
          <View style={styles.statsRow}>
            <StatCard label="Applications" value={applicationCount} />
            <StatCard
              label="Plan"
              value={isPremium ? 'Pro' : 'Free'}
              valueColor={isPremium ? colors.primary[600] : undefined}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="label" color="secondary">Settings</Text>
          <Card variant="outlined" padding={0}>
            <SettingsItem label="Notifications" value="On" />
            <SettingsItem label="Theme" value="System" />
            <SettingsItem label="Version" value="2.0.0" />
          </Card>
        </View>

        <Button variant="ghost" onPress={logout} style={styles.logoutButton}>
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <Card variant="elevated" padding={4} style={styles.statCard}>
      <Text
        variant="h2"
        color={valueColor || colors.text.primary}
        align="center"
      >
        {value}
      </Text>
      <Text variant="caption" color="secondary" align="center">
        {label}
      </Text>
    </Card>
  );
}

function SettingsItem({ label, value }: { label: string; value: string }) {
  return (
    <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7}>
      <Text variant="body">{label}</Text>
      <Text variant="body" color="tertiary">{value}</Text>
    </TouchableOpacity>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
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
    alignItems: 'center',
    gap: spacing[2],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  upgradeCard: {
    backgroundColor: colors.primary[50],
    gap: spacing[2],
  },
  upgradeButton: {
    alignSelf: 'flex-start',
    marginTop: spacing[2],
  },
  section: {
    gap: spacing[3],
  },
  resumeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    gap: spacing[1],
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logoutButton: {
    marginTop: spacing[4],
  },
});
