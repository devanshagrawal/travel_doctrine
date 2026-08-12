import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';

// Entry point: send the user to the app or the login screen.
export default function Index() {
  const isAuthed = useStore((s) => s.isAuthed);
  return <Redirect href={isAuthed ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
