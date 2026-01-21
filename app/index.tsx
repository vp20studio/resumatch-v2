import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores';
import { colors } from '../src/theme';

export default function Index() {
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const loadSession = useAuthStore((state) => state.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Show loading while checking auth state
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // No session -> Auth screens
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Session exists but hasn't completed onboarding -> Onboarding
  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Session exists and completed onboarding -> Main app
  return <Redirect href="/(tabs)/generate" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
