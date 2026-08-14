import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
import { useStore } from '../src/store/useStore';
import { ConfirmHost } from '../src/components/ConfirmHost';
import { useTheme } from '../src/theme/useTheme';
import { fonts } from '../src/theme';

export default function RootLayout() {
  const hasHydrated = useStore((s) => s.hasHydrated);
  const { mode, colors } = useTheme();
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
  });

  if (!hasHydrated || !fontsLoaded) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.bg }]}>
        <Text style={styles.logo}>✈️</Text>
        <Text style={[styles.brand, { color: colors.text, fontFamily: fontsLoaded ? fonts.serif : undefined }]}>Wander</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <ConfirmHost />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 56 },
  brand: { fontSize: 30, fontWeight: '700', marginTop: 8, letterSpacing: 0.5 },
});
