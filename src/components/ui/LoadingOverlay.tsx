import React from 'react';
import { View, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from '../../theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text variant="body" color="secondary" align="center">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[4],
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default LoadingOverlay;
