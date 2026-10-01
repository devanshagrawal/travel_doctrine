import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { pickFile } from '../../../../src/lib/filePicker';
import { useTrip } from '../../../../src/hooks/useTrips';
import { useActivities, useBudgetCategories, useSaveActivity, useDeleteActivity, useAttachTicket } from '../../../../src/hooks/useTripData';
import { Button, Field, EmptyState, Pill } from '../../../../src/components/ui';
import { font, radius, shadow, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { fmtDate } from '../../../../src/lib/format';
import { formatMoney } from '../../../../src/lib/currency';
import { findCategoryId } from '../../../../src/lib/selectors';
import { confirmAction, notify } from '../../../../src/lib/confirm';
import { TimePickerField } from '../../../../src/components/TimePickerField';
import { openInMaps } from '../../../../src/lib/maps';
import { ImageViewer } from '../../../../src/components/ImageViewer';
import { LocationField } from '../../../../src/components/LocationField';
import { Activity } from '../../../../src/lib/types';

function isPdf(uri?: string): boolean {
  if (!uri) return false;
  return /\.pdf($|\?)/i.test(uri) || uri.includes('application/pdf');
}

const ACTIVITY_CANDIDATES = ['activit', 'tour', 'experience', 'ticket', 'sightsee'];

export default function Activities() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: activities = [] } = useActivities(id);
  const { data: categories = [] } = useBudgetCategories(id);
  const saveActivity = useSaveActivity(id);
  const deleteActivity = useDeleteActivity(id);
  const attachTicket = useAttachTicket(id);

  const [adding, setAdding] = React.useState(false);
  const [viewer, setViewer] = React.useState<{ uri: string; title: string } | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [lat, setLat] = React.useState<number | undefined>(undefined);
  const [lng, setLng] = React.useState<number | undefined>(undefined);
  const [price, setPrice] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [proofUri, setProofUri] = React.useState<string | undefined>(undefined);

  if (!trip) return null;
  const list = activities.filter((a) => a.tripId === trip.id).sort((a, b) => (a.activityDate > b.activityDate ? 1 : -1));

  const close = () => {
    setAdding(false); setEditingId(null);
    setName(''); setDate(''); setTime(''); setEndTime(''); setLocation(''); setLat(undefined); setLng(undefined); setPrice(''); setPlatform(''); setProofUri(undefined);
  };

  const openAdd = () => { close(); setDate(trip.startDate); setAdding(true); };

  const openEdit = (a: Activity) => {
    setEditingId(a.id);
    setName(a.name);
    setDate(a.activityDate);
    setTime(a.time || '');
    setEndTime(a.endTime || '');
    setLocation(a.location || '');
    setLat(a.lat);
    setLng(a.lng);
    setPrice(a.price != null ? String(a.price) : '');
    setPlatform(a.platform || '');
    setProofUri(a.bookingProofUri);
    setAdding(true);
  };

  const pickProof = async () => {
    const res = await pickFile();
    if (res) setProofUri(res.uri);
  };

  const canSave = name.trim() && date.trim();

  const save = async () => {
    if (!canSave || saveActivity.isPending) return;
    try {
      await saveActivity.mutateAsync({
        tripId: trip.id,
        editingId,
        name: name.trim(),
        activityDate: date.trim(),
        time: time.trim() || undefined,
        endTime: endTime.trim() || undefined,
        location: location.trim() || undefined,
        lat,
        lng,
        price: Number(price) || 0,
        currency: trip.baseCurrency,
        platform: platform.trim() || undefined,
        categoryId: findCategoryId(categories, trip.id, ACTIVITY_CANDIDATES),
        proofUri,
      });
      close();
    } catch (e: any) {
      notify('Could not save activity', e?.message ?? 'Please try again.');
    }
  };

  const askDelete = () => {
    if (!editingId) return;
    const aid = editingId;
    close();
    confirmAction(
      'Delete activity',
      'This also removes its linked expense, document and itinerary entry. Continue?',
      () => deleteActivity.mutate(aid)
    );
  };

  const uploadProof = async (a: Activity) => {
    const res = await pickFile();
    if (res) attachTicket.mutate({ activity: a, uri: res.uri });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {list.length === 0 ? (
          <EmptyState icon="sparkles-outline" title="No activities yet" subtitle="Add tours, tickets and experiences — with a price and ticket it flows into your expenses, documents and itinerary automatically." cta="Add activity" onCta={openAdd} />
        ) : (
          list.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.icon}>
                  <Ionicons name="sparkles" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{a.name}</Text>
                  {!!a.platform && <Text style={styles.sub} numberOfLines={1}>Booked via {a.platform}</Text>}
                </View>
                {!!a.location && (
                  <Pressable hitSlop={8} onPress={() => openInMaps(a.name, a.location, undefined, a.lat, a.lng)} style={styles.editBtn}>
                    <Ionicons name="map-outline" size={17} color={colors.primary} />
                  </Pressable>
                )}
                <Pressable hitSlop={8} onPress={() => openEdit(a)} style={styles.editBtn}>
                  <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{fmtDate(a.activityDate, 'MMM D, YYYY')}{a.time ? ` · ${a.time}${a.endTime ? ` – ${a.endTime}` : ''}` : ''}</Text>
                </View>
                {!!a.location && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText} numberOfLines={1}>{a.location}</Text>
                  </View>
                )}
              </View>

              {a.price != null && (
                <View style={styles.pillRow}>
                  <Pill label={formatMoney(a.price, a.currency || trip.baseCurrency)} tone="success" />
                </View>
              )}

              <View style={styles.proofActions}>
                <Pressable style={styles.proofBtn} onPress={() => uploadProof(a)}>
                  <Ionicons name={a.bookingProofUri ? 'checkmark-circle' : 'document-attach-outline'} size={16} color={a.bookingProofUri ? colors.success : colors.primary} />
                  <Text style={[styles.proofText, a.bookingProofUri && { color: colors.success }]}>{a.bookingProofUri ? 'Ticket added' : 'Attach ticket'}</Text>
                </Pressable>
                {a.bookingProofUri && (
                  <Pressable style={styles.viewBtn} onPress={() => setViewer({ uri: a.bookingProofUri!, title: `${a.name} — ticket` })}>
                    <Ionicons name="expand-outline" size={15} color={colors.primary} />
                    <Text style={styles.viewBtnText}>View</Text>
                  </Pressable>
                )}
              </View>
              {a.bookingProofUri && (
                <Pressable onPress={() => setViewer({ uri: a.bookingProofUri!, title: `${a.name} — ticket` })}>
                  {isPdf(a.bookingProofUri) ? (
                    <View style={[styles.proofImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="document-text" size={28} color="#EF4444" />
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>PDF</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: a.bookingProofUri }} style={styles.proofImg} />
                  )}
                </Pressable>
              )}
            </View>
          ))
        )}
        {list.length > 0 && <Button label="Add activity" icon="add" variant="secondary" onPress={openAdd} full style={{ marginTop: spacing.sm }} />}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={adding} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{editingId ? 'Edit activity' : 'Add activity'}</Text>
          <Text style={styles.sheetHint}>Price and ticket auto-fill your expenses, documents & itinerary.</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Field label="Activity" icon="sparkles-outline" placeholder="e.g. Sintra & Cascais day tour" value={name} onChangeText={setName} />
            <Field label="Date *" icon="calendar-outline" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} autoCapitalize="none" />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><TimePickerField label="Start time (optional)" value={time} onChange={setTime} /></View>
              <View style={{ flex: 1 }}><TimePickerField label="End time (optional)" value={endTime} onChange={setEndTime} /></View>
            </View>
            <LocationField label="Location (optional)" placeholder="Where?" value={location} onChangeText={(t) => { setLocation(t); setLat(undefined); setLng(undefined); }} onSelect={(r) => { setLocation(r.label); setLat(r.lat); setLng(r.lng); }} />
            <Field label={`Price (${trip.baseCurrency})`} icon="cash-outline" placeholder="0" keyboardType="numeric" value={price} onChangeText={setPrice} />
            <Field label="Booked via (optional)" icon="globe-outline" placeholder="e.g. GetYourGuide, direct" value={platform} onChangeText={setPlatform} autoCapitalize="none" />

            <Text style={styles.uploadLabel}>Ticket / confirmation</Text>
            <Pressable style={styles.uploadBox} onPress={pickProof}>
              {proofUri ? (
                isPdf(proofUri) ? (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="document-text" size={28} color="#EF4444" />
                    <Text style={styles.uploadText}>PDF attached</Text>
                  </View>
                ) : (
                  <Image source={{ uri: proofUri }} style={styles.uploadPreview} />
                )
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                  <Text style={styles.uploadText}>Attach a photo or PDF</Text>
                </>
              )}
            </Pressable>

            <Button label={saveActivity.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Save activity'} onPress={save} disabled={!canSave || saveActivity.isPending} full style={{ marginTop: spacing.md }} />
            {editingId && (
              <Button label="Delete activity" icon="trash-outline" variant="danger" onPress={askDelete} full style={{ marginTop: spacing.sm, marginBottom: spacing.xl }} />
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
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  sub: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 1 },
  editBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  metaText: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
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
