import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTrip } from '../../../../src/hooks/useTrips';
import { useHotels, useBudgetCategories, useSaveHotel, useDeleteHotel, useAttachHotelProof } from '../../../../src/hooks/useTripData';
import { Button, Field, EmptyState, Pill } from '../../../../src/components/ui';
import { font, radius, shadow, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { fmtDate, nights } from '../../../../src/lib/format';
import { formatMoney } from '../../../../src/lib/currency';
import { findCategoryId } from '../../../../src/lib/selectors';
import { confirmAction, notify } from '../../../../src/lib/confirm';
import { ImageViewer } from '../../../../src/components/ImageViewer';
import { Hotel } from '../../../../src/lib/types';

export default function Hotels() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: hotels = [] } = useHotels(id);
  const { data: categories = [] } = useBudgetCategories(id);
  const saveHotel = useSaveHotel(id);
  const deleteHotel = useDeleteHotel(id);
  const attachProof = useAttachHotelProof(id);

  const [adding, setAdding] = React.useState(false);
  const [viewer, setViewer] = React.useState<{ uri: string; title: string } | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [proofUri, setProofUri] = React.useState<string | undefined>(undefined);

  if (!trip) return null;
  const list = hotels.filter((h) => h.tripId === trip.id).sort((a, b) => (a.checkIn > b.checkIn ? 1 : -1));

  const close = () => {
    setAdding(false); setEditingId(null);
    setName(''); setPrice(''); setCheckIn(''); setCheckOut(''); setProofUri(undefined);
  };

  const openAdd = () => { close(); setAdding(true); };

  const openEdit = (h: Hotel) => {
    setEditingId(h.id);
    setName(h.name);
    setPrice(h.totalPrice != null ? String(h.totalPrice) : '');
    setCheckIn(h.checkIn);
    setCheckOut(h.checkOut);
    setProofUri(h.proofUri);
    setAdding(true);
  };

  const pickProof = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) setProofUri(res.assets[0].uri);
  };

  const canSave = name.trim() && checkIn.trim() && checkOut.trim();

  const save = async () => {
    if (!canSave || saveHotel.isPending) return;
    try {
      await saveHotel.mutateAsync({
        tripId: trip.id,
        editingId,
        name: name.trim(),
        checkIn: checkIn.trim(),
        checkOut: checkOut.trim(),
        price: Number(price) || 0,
        currency: trip.baseCurrency,
        categoryId: findCategoryId(categories, trip.id, ['hotel', 'stay', 'villa', 'accom', 'lodg']),
        proofUri,
      });
      close();
    } catch (e: any) {
      notify('Could not save hotel', e?.message ?? 'Please try again.');
    }
  };

  const askDelete = () => {
    if (!editingId) return;
    const hid = editingId;
    close();
    confirmAction(
      'Delete hotel',
      'This also removes its linked expense, document and itinerary entry. Continue?',
      () => deleteHotel.mutate(hid)
    );
  };

  const uploadProof = async (h: Hotel) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) attachProof.mutate({ hotel: h, uri: res.assets[0].uri });
  };

  const displayTotal = (h: Hotel, n: number) =>
    h.totalPrice != null ? h.totalPrice : h.pricePerNight != null ? h.pricePerNight * n : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {list.length === 0 ? (
          <EmptyState icon="bed-outline" title="No hotels yet" subtitle="Add a stay with its price and booking proof — it flows into your expenses, documents and itinerary automatically." cta="Add hotel" onCta={openAdd} />
        ) : (
          list.map((h) => {
            const n = nights(h.checkIn, h.checkOut);
            const total = displayTotal(h, n);
            return (
              <View key={h.id} style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={styles.hotelIcon}>
                    <Ionicons name="bed" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hotelName}>{h.name}</Text>
                    {h.address && <Text style={styles.hotelAddr} numberOfLines={1}>{h.address}</Text>}
                  </View>
                  <Pressable hitSlop={8} onPress={() => openEdit(h)} style={styles.editBtn}>
                    <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.datesRow}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateLabel}>Check-in</Text>
                    <Text style={styles.dateValue}>{fmtDate(h.checkIn, 'MMM D')}</Text>
                  </View>
                  <View style={styles.nightsPill}>
                    <Text style={styles.nightsText}>{n} night{n === 1 ? '' : 's'}</Text>
                  </View>
                  <View style={[styles.dateBox, { alignItems: 'flex-end' }]}>
                    <Text style={styles.dateLabel}>Check-out</Text>
                    <Text style={styles.dateValue}>{fmtDate(h.checkOut, 'MMM D')}</Text>
                  </View>
                </View>

                {total != null && (
                  <View style={styles.metaRow}>
                    <Pill label={`${formatMoney(total, h.currency || trip.baseCurrency)} total`} tone="success" />
                    {h.confirmationNo && <Pill label={`# ${h.confirmationNo}`} tone="neutral" />}
                  </View>
                )}

                <View style={styles.proofActions}>
                  <Pressable style={styles.proofBtn} onPress={() => uploadProof(h)}>
                    <Ionicons name={h.proofUri ? 'checkmark-circle' : 'document-attach-outline'} size={16} color={h.proofUri ? colors.success : colors.primary} />
                    <Text style={[styles.proofText, h.proofUri && { color: colors.success }]}>{h.proofUri ? 'Booking proof added' : 'Attach booking proof'}</Text>
                  </Pressable>
                  {h.proofUri && (
                    <Pressable style={styles.viewBtn} onPress={() => setViewer({ uri: h.proofUri!, title: `${h.name} — booking proof` })}>
                      <Ionicons name="expand-outline" size={15} color={colors.primary} />
                      <Text style={styles.viewBtnText}>View</Text>
                    </Pressable>
                  )}
                </View>
                {h.proofUri && (
                  <Pressable onPress={() => setViewer({ uri: h.proofUri!, title: `${h.name} — booking proof` })}>
                    <Image source={{ uri: h.proofUri }} style={styles.proofImg} />
                  </Pressable>
                )}
              </View>
            );
          })
        )}
        {list.length > 0 && <Button label="Add hotel" icon="add" variant="secondary" onPress={openAdd} full style={{ marginTop: spacing.sm }} />}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={adding} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{editingId ? 'Edit hotel' : 'Add hotel'}</Text>
          <Text style={styles.sheetHint}>Price and proof auto-fill your expenses, documents & itinerary.</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Field label="Hotel name" icon="bed-outline" placeholder="e.g. Shinjuku Granbell" value={name} onChangeText={setName} />
            <Field label={`Price (${trip.baseCurrency})`} icon="cash-outline" placeholder="Total for the stay" keyboardType="numeric" value={price} onChangeText={setPrice} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Field label="Check-in *" placeholder="YYYY-MM-DD" value={checkIn} onChangeText={setCheckIn} autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Field label="Check-out *" placeholder="YYYY-MM-DD" value={checkOut} onChangeText={setCheckOut} autoCapitalize="none" /></View>
            </View>

            <Text style={styles.uploadLabel}>Booking proof</Text>
            <Pressable style={styles.uploadBox} onPress={pickProof}>
              {proofUri ? (
                <Image source={{ uri: proofUri }} style={styles.uploadPreview} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                  <Text style={styles.uploadText}>Attach a photo or PDF screenshot</Text>
                </>
              )}
            </Pressable>

            <Button label={saveHotel.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Save hotel'} onPress={save} disabled={!canSave || saveHotel.isPending} full style={{ marginTop: spacing.md }} />
            {editingId && (
              <Button label="Delete hotel" icon="trash-outline" variant="danger" onPress={askDelete} full style={{ marginTop: spacing.sm, marginBottom: spacing.xl }} />
            )}
            {!editingId && <View style={{ height: spacing.xl }} />}
          </ScrollView>
        </View>
      </Modal>

      <ImageViewer uri={viewer?.uri} title={viewer?.title} onClose={() => setViewer(null)} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hotelIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  hotelName: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  hotelAddr: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 1 },
  editBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  datesRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: font.size.xs, color: colors.textMuted },
  dateValue: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginTop: 2 },
  nightsPill: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  nightsText: { fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.textMuted },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  proofActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  proofBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  proofText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.primary },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  viewBtnText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.primary },
  proofImg: { width: '100%', height: 160, borderRadius: radius.md, marginTop: spacing.md, backgroundColor: colors.surfaceAlt },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  sheetTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  sheetHint: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  uploadLabel: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 6 },
  uploadBox: { height: 120, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  uploadPreview: { width: '100%', height: '100%' },
  uploadText: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 6 },
});
