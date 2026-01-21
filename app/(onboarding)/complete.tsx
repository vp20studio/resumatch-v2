import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card, StepIndicator } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { useAuthStore, useResumeStore } from '../../src/stores';
import { parseResume } from '../../src/services/tailoring';

export default function CompleteScreen() {
  const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete);
  const rawText = useResumeStore((state) => state.rawText);
  const setParsedData = useResumeStore((state) => state.setParsedData);

  const handleComplete = () => {
    // Parse the resume
    if (rawText) {
      const parsed = parseResume(rawText);
      setParsedData(parsed);
    }

    // Mark onboarding complete and navigate to main app
    setOnboardingComplete(true);
    router.replace('/(tabs)/generate');
  };

  // Count detected items from resume
  const parsed = rawText ? parseResume(rawText) : null;
  const skillCount = parsed?.skills.length ?? 0;
  const expCount = parsed?.experiences.length ?? 0;
  const eduCount = parsed?.education.length ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <StepIndicator
          currentStep={2}
          totalSteps={2}
          labels={['Upload Resume', 'Complete']}
        />

        <View style={styles.header}>
          <Text variant="displayLarge" align="center">
            🎉
          </Text>
          <Text variant="h1" align="center">
            Resume Uploaded!
          </Text>
          <Text variant="body" color="secondary" align="center">
            We've analyzed your resume and found:
          </Text>
        </View>

        <View style={styles.stats}>
          <StatCard label="Skills" value={skillCount} />
          <StatCard label="Experiences" value={expCount} />
          <StatCard label="Education" value={eduCount} />
        </View>

        <Card variant="filled" padding={4}>
          <Text variant="bodySmall" color="secondary" align="center">
            You can update your resume anytime from the profile tab
          </Text>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button fullWidth onPress={handleComplete}>
          Start Tailoring Resumes
        </Button>
      </View>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="elevated" padding={4} style={styles.statCard}>
      <Text variant="displayMedium" color={colors.primary[600]} align="center">
        {value}
      </Text>
      <Text variant="label" color="secondary" align="center">
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing[6],
    gap: spacing[8],
  },
  header: {
    gap: spacing[3],
    marginTop: spacing[8],
  },
  stats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    gap: spacing[1],
  },
  footer: {
    padding: spacing[6],
  },
});
