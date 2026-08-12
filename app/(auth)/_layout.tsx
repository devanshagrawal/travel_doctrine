import { Redirect, Stack } from 'expo-router';
import { useStore } from '../../src/store/useStore';

export default function AuthLayout() {
  const isAuthed = useStore((s) => s.isAuthed);
  // Already signed in? Skip auth entirely.
  if (isAuthed) return <Redirect href="/(app)/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
