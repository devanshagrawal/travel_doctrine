import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, spacing, Palette } from '../theme';
import { useTheme } from '../theme/useTheme';
import { searchLocations, LocationResult } from '../lib/locationSearch';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  onSelect?: (result: LocationResult) => void;
  placeholder?: string;
}

export function LocationField({ label, value, onChangeText, onSelect, placeholder = 'Search a place…' }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [focused, setFocused] = React.useState(false);
  const [results, setResults] = React.useState<LocationResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = React.useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); setShowDropdown(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchLocations(q, 5);
        setResults(r);
        setShowDropdown(r.length > 0);
      } catch {
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const handleChange = (text: string) => {
    onChangeText(text);
    doSearch(text);
  };

  const handleSelect = (r: LocationResult) => {
    onChangeText(r.label);
    onSelect?.(r);
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <View style={{ marginBottom: spacing.md, zIndex: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.wrap, focused && { borderColor: colors.primary, backgroundColor: colors.surface }]}>
        <Ionicons name="location-outline" size={18} color={colors.textFaint} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          onFocus={() => { setFocused(true); if (results.length) setShowDropdown(true); }}
          onBlur={() => { setFocused(false); setTimeout(() => setShowDropdown(false), 200); }}
        />
        {loading && <ActivityIndicator size="small" color={colors.textMuted} />}
      </View>
      {showDropdown && (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <Pressable key={`${r.lat}-${r.lng}-${i}`} style={styles.item} onPress={() => handleSelect(r)}>
              <Ionicons name="location" size={16} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.itemName} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>{r.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  itemSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 1 },
});
