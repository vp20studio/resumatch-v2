import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { Text } from './Text';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={index}>
              <View
                style={[
                  styles.step,
                  isCompleted && styles.completedStep,
                  isActive && styles.activeStep,
                ]}
              >
                <Text
                  variant="label"
                  color={
                    isCompleted || isActive
                      ? colors.neutral[0]
                      : colors.neutral[400]
                  }
                >
                  {stepNumber}
                </Text>
              </View>
              {index < totalSteps - 1 && (
                <View
                  style={[
                    styles.connector,
                    isCompleted && styles.completedConnector,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      {labels && labels[currentStep - 1] && (
        <Text variant="label" color="secondary" align="center" style={styles.label}>
          {labels[currentStep - 1]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[2],
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: colors.primary[600],
  },
  completedStep: {
    backgroundColor: colors.success.main,
  },
  connector: {
    width: 40,
    height: 2,
    backgroundColor: colors.neutral[200],
  },
  completedConnector: {
    backgroundColor: colors.success.main,
  },
  label: {
    marginTop: spacing[1],
  },
});

export default StepIndicator;
