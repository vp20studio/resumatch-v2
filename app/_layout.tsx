import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores';

export default function RootLayout() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    // Simulate auth check
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [setLoading]);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(modals)"
          options={{
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
