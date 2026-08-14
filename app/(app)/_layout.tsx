import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { useTheme } from '../../src/theme/useTheme';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const { colors, fonts } = useTheme();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 19, color: colors.text },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trip/new" options={{ headerShown: true, title: 'New Trip', presentation: 'modal' }} />
      <Stack.Screen name="trip/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="trip/[id]/edit" options={{ headerShown: true, title: 'Edit Trip', presentation: 'modal' }} />
      <Stack.Screen name="trip/[id]/share" options={{ headerShown: true, title: 'Share Trip', presentation: 'modal' }} />
      <Stack.Screen name="trip/[id]/todos" options={{ headerShown: true, title: 'Checklist' }} />
      <Stack.Screen name="trip/[id]/itinerary" options={{ headerShown: true, title: 'Itinerary' }} />
      <Stack.Screen name="trip/[id]/budget" options={{ headerShown: true, title: 'Budget' }} />
      <Stack.Screen name="trip/[id]/expenses" options={{ headerShown: true, title: 'Expenses' }} />
      <Stack.Screen name="trip/[id]/settle" options={{ headerShown: true, title: 'Settle Up' }} />
      <Stack.Screen name="trip/[id]/documents" options={{ headerShown: true, title: 'Documents' }} />
      <Stack.Screen name="trip/[id]/flights" options={{ headerShown: true, title: 'Flights' }} />
      <Stack.Screen name="trip/[id]/hotels" options={{ headerShown: true, title: 'Hotels' }} />
    </Stack>
  );
}
