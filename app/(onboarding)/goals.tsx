import { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Text, Button, Card, StepIndicator } from '../../src/components/ui';
import { colors, spacing, borderRadius } from '../../src/theme';
import { useGoalsStore } from '../../src/stores';

const TARGET_DAYS_OPTIONS = [
  { value: 30, label: '30 days', emoji: '🚀' },
  { value: 60, label: '60 days', emoji: '🎯' },
  { value: 90, label: '90 days', emoji: '📈' },
];

const WEEKLY_TARGETS = [5, 10, 15, 20, 25];

export default function GoalsScreen() {
  const [targetDays, setTargetDays] = useState(30);
  const [weeklyTarget, setWeeklyTarget] = useState(10);

  const setGoals = useGoalsStore((state) => state.setGoals);

  const handleSelectDays = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargetDays(days);
  };

  const handleSliderChange = (value: number) => {
    const roundedValue = WEEKLY_TARGETS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    if (roundedValue !== weeklyTarget) {
      Haptics.selectionAsync();
      setWeeklyTarget(roundedValue);
    }
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGoals(targetDays, weeklyTarget);
    router.push('/(onboarding)/complete');
  };

  const getMotivation = () => {
    if (targetDays === 30 && weeklyTarget >= 15) {
      return "Ambitious! You're going all in! 🔥";
    }
    if (targetDays === 30) {
      return "Fast track to your dream job! 🚀";
    }
    if (targetDays === 60) {
      return "Steady and strategic. Great choice! 🎯";
    }
    return "Playing the long game. Consistency wins! 📈";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <StepIndicator
          currentStep={2}
          totalSteps={3}
          labels={['Resume', 'Goals', 'Complete']}
        />

        <View style={styles.header}>
          <Text variant="h1" align="center">
            Set Your Goals
          </Text>
          <Text variant="body" color="secondary" align="center">
            Let's make your job search a game you can win
          </Text>
        </View>

        {/* Target Days */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">
            When do you want to land your next job?
          </Text>
          <View style={styles.optionsRow}>
            {TARGET_DAYS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dayOption,
                  targetDays === option.value && styles.dayOptionSelected,
                ]}
                onPress={() => handleSelectDays(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.dayEmoji}>{option.emoji}</Text>
                <Text
                  variant="label"
                  color={targetDays === option.value ? colors.primary[600] : 'secondary'}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Target */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">
            How many applications per week?
          </Text>
          <Card variant="outlined" padding={6}>
            <View style={styles.sliderContainer}>
              <Text variant="displayMedium" color={colors.primary[600]} align="center">
                {weeklyTarget}
              </Text>
              <Text variant="body" color="secondary" align="center">
                applications per week
              </Text>

              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={25}
                value={weeklyTarget}
                onValueChange={handleSliderChange}
                minimumTrackTintColor={colors.primary[600]}
                maximumTrackTintColor={colors.border.light}
                thumbTintColor={colors.primary[600]}
                step={5}
              />

              <View style={styles.sliderLabels}>
                <Text variant="caption" color="tertiary">5</Text>
                <Text variant="caption" color="tertiary">10</Text>
                <Text variant="caption" color="tertiary">15</Text>
                <Text variant="caption" color="tertiary">20</Text>
                <Text variant="caption" color="tertiary">25</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Motivation Message */}
        <Card variant="filled" padding={4}>
          <Text variant="body" align="center">
            {getMotivation()}
          </Text>
        </Card>

        {/* Stats Preview */}
        <View style={styles.statsPreview}>
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.primary[600]}>
              {Math.round((weeklyTarget * targetDays) / 7)}
            </Text>
            <Text variant="caption" color="secondary">
              Total Apps
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.primary[600]}>
              {Math.round(weeklyTarget / 5)}
            </Text>
            <Text variant="caption" color="secondary">
              Per Day
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h2" color={colors.primary[600]}>
              {targetDays}
            </Text>
            <Text variant="caption" color="secondary">
              Days
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button fullWidth onPress={handleContinue}>
          Set Goals & Continue
        </Button>
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/complete')}
          style={styles.skipButton}
        >
          <Text variant="body" color="tertiary">
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    gap: spacing[6],
  },
  header: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  section: {
    gap: spacing[3],
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dayOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    gap: spacing[1],
  },
  dayOptionSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  dayEmoji: {
    fontSize: 28,
  },
  sliderContainer: {
    gap: spacing[2],
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: spacing[2],
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[1],
  },
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[4],
  },
  statItem: {
    alignItems: 'center',
    gap: spacing[1],
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  footer: {
    padding: spacing[6],
    gap: spacing[3],
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing[2],
  },
});
