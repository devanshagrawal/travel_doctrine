import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentsView } from '../../../src/components/DocumentsView';
import { colors, font, spacing } from '../../../src/theme';

// Global document wallet — documents not tied to a specific trip
// (passport, national ID, annual insurance, etc.).
export default function Wallet() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.h1}>Wallet</Text>
        <Text style={styles.sub}>Your passport, ID & always-on documents</Text>
      </View>
      <DocumentsView tripId={null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  h1: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },
  sub: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
});
