import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="paywall" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="result" />
      <Stack.Screen name="edit-resume" />
    </Stack>
  );
}
