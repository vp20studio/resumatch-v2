import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores';

export default function Index() {
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/generate" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}
