import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/config/supabase';
import { useAuthStore } from '../src/stores';

export default function RootLayout() {
  const setSession = useAuthStore((state) => state.setSession);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);

        // Fetch profile when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, fetchProfile]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
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
