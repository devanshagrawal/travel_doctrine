import React from 'react';
import { View, Text, Platform, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, spacing, Palette } from '../theme';
import { useTheme } from '../theme/useTheme';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function TimePickerField({ label, value, onChange, placeholder = 'HH:mm' }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.wrap}>
          <Ionicons name="time-outline" size={16} color={colors.textFaint} style={{ marginRight: 8 }} />
          <input
            type="time"
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              color: colors.text as string,
              fontFamily: 'inherit',
              padding: '12px 0',
              width: '100%',
            }}
          />
        </View>
      </View>
    );
  }

  // Native fallback — plain text input (no native date-time picker dep needed)
  const { TextInput } = require('react-native');
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        <Ionicons name="time-outline" size={16} color={colors.textFaint} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
        />
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  label: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 6 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: font.size.md, color: colors.text, paddingVertical: 12 },
});
