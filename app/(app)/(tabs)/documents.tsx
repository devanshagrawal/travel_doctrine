import React from 'react';
import { View } from 'react-native';
import { DocumentsView } from '../../../src/components/DocumentsView';
import { Masthead } from '../../../src/components/Masthead';
import { useTheme } from '../../../src/theme/useTheme';

// Global document wallet — documents not tied to a specific trip
// (passport, national ID, annual insurance, etc.).
export default function Wallet() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Masthead eyebrow="Passport · ID · insurance" title="Wallet" />
      <DocumentsView tripId={null} />
    </View>
  );
}
