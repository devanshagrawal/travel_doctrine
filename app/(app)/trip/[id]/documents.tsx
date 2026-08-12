import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { DocumentsView } from '../../../../src/components/DocumentsView';
import { colors } from '../../../../src/theme';

export default function TripDocuments() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <DocumentsView tripId={id} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.bg } });
