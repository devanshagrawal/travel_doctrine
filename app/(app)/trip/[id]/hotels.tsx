import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../../src/store/useStore';
import { Button, Field, EmptyState, Pill } from '../../../../src/components/ui';
import { colors, font, radius, shadow, spacing } from '../../../../src/theme';
import { fmtDate, nights } from '../../../../src/lib/format';
import { formatMoney } from '../../../../src/lib/currency';
import { findCategoryId } from '../../../../src/lib/selectors';
import { confirmAction } from '../../../../src/lib/confirm';
import { ImageViewer } from '../../../../src/components/ImageViewer';
import { Hotel } from '../../../../src/lib/types';

export default function Hotels() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useStore((s) => s.trips.find((t) => t.id === id));
  const hotels = useStore((s) => s.hotels);
  const categories = useStore((s) => s.budgetCategories);
  const addHotel = useStore((s) => s.addHotel);
  const updateHotel = useStore((s) => s.updateHotel);
  const deleteHotel = useStore((s) => s.deleteHotel);
  const attachProof = useStore((s) => s.attachHotelProof);
  const syncSourceExpense = useStore((s) => s.syncSourceExpense);
  const syncSourceDocument = useStore((s) => s.syncSourceDocument);
  const syncSourceItinerary = useStore((s) => s.syncSourceItinerary);

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

  const save = () => {
    if (!canSave) return;
    const priceNum = Number(price) || 0;
    const nm = name.trim();
    const ci = checkIn.trim();
    const co = checkOut.trim();

    const fields = { name: nm, checkIn: ci, checkOut: co, totalPrice: priceNum || undefined, currency: trip.baseCurrency, proofUri };

    // Add or edit the hotel, then keep its linked records in sync (upsert one
    // each) so editing the price updates the expense and the proof shows in Documents.
    const hotelId = editingId ?? addHotel({ tripId: trip.id, ...fields });
    if (editingId) updateHotel(editingId, fields);

    syncSourceExpense({
      sourceId: hotelId,
      tripId: trip.id,
      categoryId: findCategoryId(categories, trip.id, ['hotel', 'stay', 'villa', 'accom', 'lodg']),
      amount: priceNum,
      currency: trip.baseCurrency,
      description: `Hotel – ${nm}`,
      spentAt: ci,
      paidBy: 'Me',
    });
    syncSourceDocument({ sourceId: hotelId, sourceTag: 'booking', tripId: trip.id, type: 'other', title: `Hotel – ${nm} booking`, fileUri: proofUri });
    syncSourceItinerary({ sourceId: hotelId, tripId: trip.id, dayDate: ci, time: '15:00', title: `Check in – ${nm}`, type: 'stay', location: nm });

    close();
  };

  const askDelete = () => {
    if (!editingId) return;
    const hid = editingId;
    close();
    confirmAction(
      'Delete hotel',
      'This also removes its linked expense, document and itinerary entry. Continue?',
      () => deleteHotel(hid)
    );
  };

  const uploadProof = async (h: Hotel) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      attachProof(h.id, uri);
      // Also surface the booking proof in the trip's Documents tab.
      syncSourceDocument({ sourceId: h.id, sourceTag: 'booking', tripId: trip.id, type: 'other', title: `Hotel – ${h.name} booking`, fileUri: uri });
    }
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

            <Button label={editingId ? 'Save changes' : 'Save hotel'} onPress={save} disabled={!canSave} full style={{ marginTop: spacing.md }} />
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

const styles = StyleSheet.create({
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
