import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../src/store/useStore';
import { ConfirmHost } from '../src/components/ConfirmHost';
import { colors, font } from '../src/theme';

export default function RootLayout() {
  const hasHydrated = useStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>✈️</Text>
        <Text style={styles.brand}>Wander</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  logo: { fontSize: 56 },
  brand: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text, marginTop: 8 },
});
