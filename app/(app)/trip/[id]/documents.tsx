import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { DocumentsView } from '../../../../src/components/DocumentsView';
import { useTheme } from '../../../../src/theme/useTheme';

export default function TripDocuments() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DocumentsView tripId={id} />
    </View>
  );
}
