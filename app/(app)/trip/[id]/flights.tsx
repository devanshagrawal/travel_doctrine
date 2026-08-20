import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTrip } from '../../../../src/hooks/useTrips';
import { useFlights, useBudgetCategories, useSaveFlight, useDeleteFlight, useAttachBoardingPass } from '../../../../src/hooks/useTripData';
import { Button, Field, EmptyState, Pill } from '../../../../src/components/ui';
import { font, radius, shadow, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { fmtDate, fmtTime } from '../../../../src/lib/format';
import { findCategoryId } from '../../../../src/lib/selectors';
import { formatMoney } from '../../../../src/lib/currency';
import { confirmAction, notify } from '../../../../src/lib/confirm';
import { ImageViewer } from '../../../../src/components/ImageViewer';
import { Flight } from '../../../../src/lib/types';

export default function Flights() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: flights = [] } = useFlights(id);
  const { data: categories = [] } = useBudgetCategories(id);
  const saveFlight = useSaveFlight(id);
  const deleteFlight = useDeleteFlight(id);
  const attachPass = useAttachBoardingPass(id);

  const [adding, setAdding] = React.useState(false);
  const [viewer, setViewer] = React.useState<{ uri: string; title: string } | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [airline, setAirline] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [proofUri, setProofUri] = React.useState<string | undefined>(undefined);
  const [boardingUri, setBoardingUri] = React.useState<string | undefined>(undefined);
  const [platform, setPlatform] = React.useState('');

  if (!trip) return null;
  const list = flights.filter((f) => f.tripId === trip.id).sort((a, b) => (a.departAt > b.departAt ? 1 : -1));

  const close = () => {
    setAdding(false); setEditingId(null);
    setAirline(''); setFrom(''); setTo(''); setPrice(''); setDate(''); setTime(''); setProofUri(undefined); setBoardingUri(undefined); setPlatform('');
  };

  const openAdd = () => {
    close();
    setDate(dayjs(trip.startDate).format('YYYY-MM-DD'));
    setAdding(true);
  };

  const openEdit = (f: Flight) => {
    setEditingId(f.id);
    setAirline(f.airline);
    setFrom(f.fromCode || '');
    setTo(f.toCode || '');
    setPrice(f.price != null ? String(f.price) : '');
    setDate(dayjs(f.departAt).format('YYYY-MM-DD'));
    const t = dayjs(f.departAt).format('HH:mm');
    setTime(t === '00:00' ? '' : t);
    setProofUri(f.bookingProofUri);
    setBoardingUri(f.boardingPassUri);
    setPlatform(f.platform || '');
    setAdding(true);
  };

  const pick = async (setter: (u: string) => void) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) setter(res.assets[0].uri);
  };

  const canSave = airline.trim() && from.trim() && to.trim() && date.trim();

  const save = async () => {
    if (!canSave || saveFlight.isPending) return;
    try {
      await saveFlight.mutateAsync({
        tripId: trip.id,
        editingId,
        airline: airline.trim(),
        fromCode: from.trim().toUpperCase(),
        toCode: to.trim().toUpperCase(),
        dayPart: date.trim(),
        timePart: time.trim(),
        price: Number(price) || 0,
        currency: trip.baseCurrency,
        platform: platform.trim() || undefined,
        categoryId: findCategoryId(categories, trip.id, ['flight', 'air']),
        proofUri,
        boardingUri,
      });
      close();
    } catch (e: any) {
      notify('Could not save flight', e?.message ?? 'Please try again.');
    }
  };

  const askDelete = () => {
    if (!editingId) return;
    const fid = editingId;
    close(); // close the sheet first so the confirm dialog isn't hidden behind it
    confirmAction(
      'Delete flight',
      'This also removes its linked expense, document and itinerary entry. Continue?',
      () => deleteFlight.mutate(fid)
    );
  };

  const uploadPass = async (f: Flight) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) attachPass.mutate({ flight: f, uri: res.assets[0].uri });
  };

  const hasRoute = (f: Flight) => !!(f.fromCode && f.toCode);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {list.length === 0 ? (
          <EmptyState icon="airplane-outline" title="No flights yet" subtitle="Add a flight with its route, price and booking proof — it flows into your expenses, documents and itinerary automatically." cta="Add flight" onCta={openAdd} />
        ) : (
          list.map((f) => (
            <View key={f.id} style={styles.ticket}>
              <View style={styles.ticketHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="airplane" size={16} color={colors.primary} />
                  <Text style={styles.airline}>{f.airline}</Text>
                </View>
                {f.price != null && <Pill label={formatMoney(f.price, f.currency || trip.baseCurrency)} tone="primary" />}
                <Pressable hitSlop={8} onPress={() => openEdit(f)} style={styles.editBtn}>
                  <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              {hasRoute(f) ? (
                <View style={styles.route}>
                  <View style={styles.routeEnd}>
                    <Text style={styles.code}>{f.fromCode}</Text>
                    {!!f.fromCity && <Text style={styles.city}>{f.fromCity}</Text>}
                    <Text style={styles.time}>{fmtTime(f.departAt)}</Text>
                  </View>
                  <View style={styles.routeMid}>
                    <View style={styles.dashline} />
                    <Ionicons name="airplane" size={16} color={colors.textFaint} />
                    <View style={styles.dashline} />
                  </View>
                  <View style={[styles.routeEnd, { alignItems: 'flex-end' }]}>
                    <Text style={styles.code}>{f.toCode}</Text>
                    {!!f.toCity && <Text style={styles.city}>{f.toCity}</Text>}
                    <Text style={styles.time}>{f.arriveAt ? fmtTime(f.arriveAt) : ''}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.simpleRow}>
                  <View style={styles.simpleItem}>
                    <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.simpleText}>{fmtDate(f.departAt, 'MMM D, YYYY')}</Text>
                  </View>
                  <View style={styles.simpleItem}>
                    <Ionicons name="time-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.simpleText}>{fmtTime(f.departAt)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.perf} />

              <View style={styles.ticketFoot}>
                {hasRoute(f) && (
                  <View>
                    <Text style={styles.footLabel}>Date</Text>
                    <Text style={styles.footValue}>{fmtDate(f.departAt, 'MMM D, YYYY')}</Text>
                  </View>
                )}
                {!!f.platform && (
                  <View style={{ marginLeft: hasRoute(f) ? spacing.lg : 0 }}>
                    <Text style={styles.footLabel}>Booked via</Text>
                    <Text style={styles.footValue}>{f.platform}</Text>
                  </View>
                )}
                <Pressable style={styles.passBtn} onPress={() => uploadPass(f)}>
                  <Ionicons name={f.boardingPassUri ? 'checkmark-circle' : 'qr-code-outline'} size={16} color={f.boardingPassUri ? colors.success : colors.primary} />
                  <Text style={[styles.passText, f.boardingPassUri && { color: colors.success }]}>{f.boardingPassUri ? 'Boarding pass added' : 'Add boarding pass'}</Text>
                </Pressable>
              </View>

              {(f.bookingProofUri || f.boardingPassUri) && (
                <View style={styles.proofRow}>
                  {f.bookingProofUri && (
                    <Pressable style={styles.proofThumbWrap} onPress={() => setViewer({ uri: f.bookingProofUri!, title: `${f.airline} — booking proof` })}>
                      <Image source={{ uri: f.bookingProofUri }} style={styles.proofThumb} />
                      <View style={styles.viewChip}><Ionicons name="expand-outline" size={11} color={colors.white} /><Text style={styles.viewChipText}>View</Text></View>
                      <Text style={styles.proofCap}>Booking</Text>
                    </Pressable>
                  )}
                  {f.boardingPassUri && (
                    <Pressable style={styles.proofThumbWrap} onPress={() => setViewer({ uri: f.boardingPassUri!, title: `${f.airline} — boarding pass` })}>
                      <Image source={{ uri: f.boardingPassUri }} style={styles.proofThumb} />
                      <View style={styles.viewChip}><Ionicons name="expand-outline" size={11} color={colors.white} /><Text style={styles.viewChipText}>View</Text></View>
                      <Text style={styles.proofCap}>Boarding pass</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          ))
        )}
        {list.length > 0 && <Button label="Add flight" icon="add" variant="secondary" onPress={openAdd} full style={{ marginTop: spacing.sm }} />}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={adding} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{editingId ? 'Edit flight' : 'Add flight'}</Text>
          <Text style={styles.sheetHint}>Price and proof auto-fill your expenses, documents & itinerary.</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Field label="Airline" icon="airplane-outline" placeholder="e.g. ANA" value={airline} onChangeText={setAirline} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Field label="From" placeholder="DEL" value={from} onChangeText={setFrom} autoCapitalize="characters" maxLength={4} /></View>
              <View style={{ flex: 1 }}><Field label="To" placeholder="NRT" value={to} onChangeText={setTo} autoCapitalize="characters" maxLength={4} /></View>
            </View>
            <Field label={`Price (${trip.baseCurrency})`} icon="cash-outline" placeholder="0" keyboardType="numeric" value={price} onChangeText={setPrice} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1.4 }}><Field label="Date *" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} autoCapitalize="none" /></View>
              <View style={{ flex: 1 }}><Field label="Time" placeholder="HH:mm" value={time} onChangeText={setTime} autoCapitalize="none" /></View>
            </View>
            <Field label="Booked via (optional)" icon="globe-outline" placeholder="e.g. MakeMyTrip, direct" value={platform} onChangeText={setPlatform} autoCapitalize="none" />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <UploadTile label="Booking proof" uri={proofUri} onPress={() => pick(setProofUri)} />
              <UploadTile label="Boarding pass" hint="optional" uri={boardingUri} onPress={() => pick(setBoardingUri)} />
            </View>

            <Button label={saveFlight.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Save flight'} onPress={save} disabled={!canSave || saveFlight.isPending} full style={{ marginTop: spacing.md }} />
            {editingId && (
              <Button label="Delete flight" icon="trash-outline" variant="danger" onPress={askDelete} full style={{ marginTop: spacing.sm, marginBottom: spacing.xl }} />
            )}
            {!editingId && <View style={{ height: spacing.xl }} />}
          </ScrollView>
        </View>
      </Modal>

      <ImageViewer uri={viewer?.uri} title={viewer?.title} onClose={() => setViewer(null)} />
    </View>
  );
}

function UploadTile({ label, hint, uri, onPress }: { label: string; hint?: string; uri?: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={{ flex: 1, marginBottom: spacing.md }}>
      <Text style={styles.uploadLabel}>{label}{hint ? ` · ${hint}` : ''}</Text>
      <Pressable style={styles.uploadBox} onPress={onPress}>
        {uri ? (
          <Image source={{ uri }} style={styles.uploadPreview} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
            <Text style={styles.uploadText}>Attach</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  ticket: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  ticketHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  airline: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  editBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  route: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  routeEnd: { flex: 1 },
  code: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },
  city: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 1 },
  time: { fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.semibold, marginTop: 4 },
  routeMid: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  dashline: { width: 18, height: 1.5, backgroundColor: colors.border },
  simpleRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  simpleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  simpleText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  perf: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border, marginVertical: spacing.lg, opacity: 0.7 },
  ticketFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footLabel: { fontSize: font.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  footValue: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text, marginTop: 2 },
  passBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, marginLeft: 'auto' },
  passText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.primary },
  proofRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  proofThumbWrap: { alignItems: 'center' },
  proofThumb: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  proofCap: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 4 },
  viewChip: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill },
  viewChipText: { color: colors.white, fontSize: 10, fontWeight: font.weight.semibold },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  sheetTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  sheetHint: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  uploadLabel: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 6 },
  uploadBox: { height: 96, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  uploadPreview: { width: '100%', height: '100%' },
  uploadText: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 4 },
});
