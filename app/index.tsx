import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/lib/auth';
import { useTheme } from '../src/theme/useTheme';

// Entry point: wait for the Supabase session check, then route to the app or login.
export default function Index() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return <Redirect href={session ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
