import { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Text,
  Button,
  Card,
  ProgressRing,
} from '../../src/components/ui';
import { colors, spacing, borderRadius, textStyles } from '../../src/theme';
import { useGenerationStore, useResumeStore, useHistoryStore, useGoalsStore } from '../../src/stores';
import { tailorResume } from '../../src/services/tailoring';

export default function GenerateScreen() {
  const [jdText, setJdText] = useState('');

  const {
    status,
    progress,
    error,
    startGeneration,
    setProgress,
    setResult,
    setError,
    reset,
  } = useGenerationStore();

  const resumeText = useResumeStore((state) => state.rawText);
  const parsedData = useResumeStore((state) => state.parsedData);
  const addHistoryItem = useHistoryStore((state) => state.addItem);

  // Goals/Gamification state - select raw values to avoid infinite loops
  const currentStreak = useGoalsStore((state) => state.currentStreak);
  const startDate = useGoalsStore((state) => state.startDate);
  const targetDays = useGoalsStore((state) => state.targetDays);
  const weeklyTarget = useGoalsStore((state) => state.weeklyTarget);
  const weeklyApplications = useGoalsStore((state) => state.weeklyApplications);
  const weekStartDate = useGoalsStore((state) => state.weekStartDate);

  const hasGoals = startDate !== null;

  // Compute derived values with useMemo
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

  const hasResume = resumeText.length > 0;
  const canGenerate = hasResume && jdText.trim().length >= 50;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setJdText(text);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    startGeneration();

    try {
      const tailoringResult = await tailorResume(resumeText, jdText, (p) => {
        setProgress(p);
      });

      setResult(tailoringResult);

      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Extract job title and company from the job description (first lines usually)
      const jdLines = jdText.trim().split('\n').filter(line => line.trim());
      const jobTitle = jdLines[0]?.substring(0, 50) || 'Position';
      const company = jdLines[1]?.substring(0, 50) || 'Company';

      // Save to history
      addHistoryItem({
        jobTitle,
        company,
        matchScore: tailoringResult.matchScore,
        result: tailoringResult,
        jobDescription: jdText,
      });

      // Navigate to result modal
      router.push('/(modals)/result');
    } catch (err) {
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError((err as Error).message);
    }
  };

  // Resume summary section
  const renderResumeSummary = () => {
    if (!hasResume) {
      return (
        <Card variant="outlined" padding={4}>
          <View style={styles.noResumeContent}>
            <Text variant="body" color="secondary" align="center">
              No resume uploaded yet
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => router.push('/(tabs)/profile')}
            >
              Add Resume
            </Button>
          </View>
        </Card>
      );
    }

    const skillCount = parsedData?.skills.length ?? 0;
    const expCount = parsedData?.experiences.length ?? 0;

    return (
      <Card variant="filled" padding={4}>
        <View style={styles.resumeSummary}>
          <View style={styles.resumeStats}>
            <View style={styles.stat}>
              <Text variant="h2" color={colors.primary[600]}>{skillCount}</Text>
              <Text variant="caption" color="secondary">Skills</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="h2" color={colors.primary[600]}>{expCount}</Text>
              <Text variant="caption" color="secondary">Experiences</Text>
            </View>
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)/profile')}
          >
            Edit Resume
          </Button>
        </View>
      </Card>
    );
  };

  // Render generating state
  if (status === 'generating') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.generatingContainer}>
          <ProgressRing
            progress={progress?.progress ?? 0}
            size={120}
            status={progress?.message}
          />
          <Text variant="h2" align="center" style={styles.generatingTitle}>
            Tailoring Your Resume
          </Text>
          <Text variant="body" color="secondary" align="center">
            {progress?.step === 'analyzing' && 'Analyzing job requirements...'}
            {progress?.step === 'matching' && 'Matching your experience...'}
            {progress?.step === 'formatting' && 'Formatting your resume...'}
            {progress?.step === 'cover_letter' && 'Writing cover letter...'}
            {!progress?.step && 'This usually takes 5-8 seconds'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="h2" align="center">Something went wrong</Text>
          <Text variant="body" color="secondary" align="center">
            {error}
          </Text>
          <Button onPress={reset}>Try Again</Button>
        </View>
      </SafeAreaView>
    );
  }

  // Default: input form
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="h1">Tailor Resume</Text>
            <Text variant="body" color="secondary">
              Paste a job description to optimize your resume
            </Text>
          </View>

          {/* Gamification Progress Card */}
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
                      {currentStreak}
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

          <View style={styles.section}>
            <Text variant="label">Your Resume</Text>
            {renderResumeSummary()}
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text variant="label">Job Description</Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={handlePasteFromClipboard}
              >
                Paste from Clipboard
              </Button>
            </View>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Paste the full job description here..."
              placeholderTextColor={colors.text.tertiary}
              value={jdText}
              onChangeText={setJdText}
              textAlignVertical="top"
            />
            {jdText.length > 0 && jdText.length < 50 && (
              <Text variant="caption" color={colors.warning.main}>
                Job description should be at least 50 characters
              </Text>
            )}
          </View>

          <Button
            fullWidth
            disabled={!canGenerate}
            onPress={handleGenerate}
          >
            Generate Tailored Resume
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    padding: spacing[6],
    gap: spacing[6],
  },
  header: {
    gap: spacing[2],
  },
  section: {
    gap: spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noResumeContent: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  resumeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumeStats: {
    flexDirection: 'row',
    gap: spacing[6],
  },
  stat: {
    alignItems: 'center',
  },
  textArea: {
    ...textStyles.body,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    minHeight: 200,
    color: colors.text.primary,
  },
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[6],
  },
  generatingTitle: {
    marginTop: spacing[4],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    padding: spacing[6],
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
});
