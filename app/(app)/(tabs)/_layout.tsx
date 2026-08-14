import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/useTheme';

function TabIcon({ name, color, focused, soft }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean; soft: string }) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: soft }]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 86 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 6,
          shadowColor: '#2A1E12',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trips', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'airplane' : 'airplane-outline'} color={color} focused={focused} soft={colors.primarySoft} /> }} />
      <Tabs.Screen name="documents" options={{ title: 'Wallet', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} focused={focused} soft={colors.primarySoft} /> }} />
      <Tabs.Screen name="currency" options={{ title: 'Currency', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} color={color} focused={focused} soft={colors.primarySoft} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} soft={colors.primarySoft} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 44, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
