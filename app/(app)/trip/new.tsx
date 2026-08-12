import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useStore } from '../../../src/store/useStore';
import { Button, Field } from '../../../src/components/ui';
import { CURRENCIES } from '../../../src/lib/currency';
import { colors, font, radius, spacing } from '../../../src/theme';

const EMOJIS = ['🗼', '🌴', '🏖️', '⛰️', '🗽', '🏝️', '🎡', '🏔️', '🕌', '🌉'];
const COVERS = ['#2563EB', '#E11D48', '#0D9488', '#9333EA', '#F97316', '#0EA5E9', '#CA8A04', '#16A34A'];

export default function NewTrip() {
  const router = useRouter();
  const addTrip = useStore((s) => s.addTrip);

  const [name, setName] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [start, setStart] = React.useState(dayjs().add(30, 'day').format('YYYY-MM-DD'));
  const [end, setEnd] = React.useState(dayjs().add(37, 'day').format('YYYY-MM-DD'));
  const [budget, setBudget] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');
  const [emoji, setEmoji] = React.useState('🗼');
  const [cover, setCover] = React.useState(COVERS[0]);
  const [coverImage, setCoverImage] = React.useState<string | undefined>(undefined);

  const canSave = name.trim().length > 0 && destination.trim().length > 0;

  const pickCover = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!res.canceled) setCoverImage(res.assets[0].uri);
  };

  const onSave = () => {
    if (!canSave) return;
    const id = addTrip({
      name: name.trim(),
      destination: destination.trim(),
      startDate: start,
      endDate: end,
      baseCurrency: currency,
      totalBudget: Number(budget) || 0,
      coverColor: cover,
      coverImage,
      emoji,
    });
    router.replace(`/(app)/trip/${id}`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Trip name" icon="airplane-outline" placeholder="e.g. Japan Autumn Escape" value={name} onChangeText={setName} />
        <Field label="Destination" icon="location-outline" placeholder="e.g. Tokyo & Kyoto, Japan" value={destination} onChangeText={setDestination} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Start date" icon="calendar-outline" placeholder="YYYY-MM-DD" value={start} onChangeText={setStart} autoCapitalize="none" />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Field label="End date" icon="calendar-outline" placeholder="YYYY-MM-DD" value={end} onChangeText={setEnd} autoCapitalize="none" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1.4 }}>
            <Field label="Total budget" icon="cash-outline" placeholder="0" keyboardType="numeric" value={budget} onChangeText={setBudget} />
          </View>
        </View>

        <Text style={styles.label}>Budget currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
          {CURRENCIES.map((c) => (
            <Pressable key={c.code} onPress={() => setCurrency(c.code)} style={[styles.chip, currency === c.code && styles.chipActive]}>
              <Text style={[styles.chipText, currency === c.code && styles.chipTextActive]}>{c.flag} {c.code}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Cover photo</Text>
        <Pressable style={styles.coverPhoto} onPress={pickCover}>
          {coverImage ? (
            <>
              <Image source={{ uri: coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.coverPhotoOverlay}>
                <Ionicons name="camera" size={18} color={colors.white} />
                <Text style={styles.coverPhotoOverlayText}>Change photo</Text>
              </View>
            </>
          ) : (
            <>
              <Ionicons name="image-outline" size={26} color={colors.primary} />
              <Text style={styles.coverPhotoText}>Choose a cover photo (optional)</Text>
            </>
          )}
        </Pressable>
        {coverImage && (
          <Pressable onPress={() => setCoverImage(undefined)} style={{ alignSelf: 'flex-start', marginBottom: spacing.md }}>
            <Text style={styles.removePhoto}>Remove photo</Text>
          </Pressable>
        )}

        <Text style={styles.label}>{coverImage ? 'Cover color (used if no photo)' : 'Cover color'}</Text>
        <View style={styles.coverRow}>
          {COVERS.map((c) => (
            <Pressable key={c} onPress={() => setCover(c)} style={[styles.swatch, { backgroundColor: c }, cover === c && styles.swatchActive]} />
          ))}
        </View>

        <Text style={styles.label}>Emoji</Text>
        <View style={styles.emojiRow}>
          {EMOJIS.map((e) => (
            <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emojiBtn, emoji === e && styles.emojiActive]}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Button label="Create trip" onPress={onSave} disabled={!canSave} full style={{ marginTop: spacing.lg }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  row: { flexDirection: 'row' },
  label: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  chipTextActive: { color: colors.white },
  coverPhoto: { height: 130, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginBottom: spacing.sm },
  coverPhotoText: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 6 },
  coverPhotoOverlay: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  coverPhotoOverlayText: { color: colors.white, fontSize: font.size.xs, fontWeight: font.weight.semibold },
  removePhoto: { color: colors.danger, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  coverRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
  swatch: { width: 40, height: 40, borderRadius: 12, borderWidth: 3, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.text },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  emojiActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
