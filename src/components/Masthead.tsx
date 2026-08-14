import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

// The "masthead" header (direction D): a raised surface holding a gold eyebrow
// and a serif title, with a hairline + soft shadow separating it from the
// content that scrolls beneath. Used at the top of the main tab screens.
export function Masthead({
  eyebrow,
  title,
  right,
  compact,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
  compact?: boolean;
}) {
  const { colors, fonts, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const wrap: ViewStyle = {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: insets.top + (compact ? 10 : 14),
    paddingBottom: compact ? 14 : 18,
    paddingHorizontal: spacing.lg,
    shadowColor: '#2A1E12',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    zIndex: 5,
  };

  return (
    <View style={wrap}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {!!eyebrow && <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>}
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.serif }]}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  eyebrow: { fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 5 },
  title: { fontSize: 25, letterSpacing: -0.3 },
});
