import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/lib/auth';

export default function AuthLayout() {
  const { session } = useAuth();
  // Already signed in? Skip auth entirely.
  if (session) return <Redirect href="/(app)/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
