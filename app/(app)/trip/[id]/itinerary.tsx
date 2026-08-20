import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { confirmAction, notify } from '../../../../src/lib/confirm';
import { useTrip } from '../../../../src/hooks/useTrips';
import { useItinerary, useAddItineraryItem, useDeleteItineraryItem } from '../../../../src/hooks/useTripData';
import { Button, Field, EmptyState } from '../../../../src/components/ui';
import { font, radius, shadow, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { daysBetween, fmtDate } from '../../../../src/lib/format';
import { ItineraryType } from '../../../../src/lib/types';

const TYPE_META: Record<ItineraryType, { icon: any; color: string; label: string }> = {
  activity: { icon: 'walk', color: '#2563EB', label: 'Activity' },
  transport: { icon: 'train', color: '#0EA5E9', label: 'Transport' },
  food: { icon: 'restaurant', color: '#F97316', label: 'Food' },
  stay: { icon: 'bed', color: '#9333EA', label: 'Stay' },
  other: { icon: 'ellipsis-horizontal', color: '#64748B', label: 'Other' },
};
const TYPES: ItineraryType[] = ['activity', 'transport', 'food', 'stay', 'other'];

export default function Itinerary() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: itinerary = [] } = useItinerary(id);
  const addItem = useAddItineraryItem(id);
  const deleteItem = useDeleteItineraryItem(id);

  const [adding, setAdding] = React.useState(false);
  const [dayDate, setDayDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [type, setType] = React.useState<ItineraryType>('activity');

  if (!trip) return null;
  const days = daysBetween(trip.startDate, trip.endDate);
  const items = itinerary.filter((i) => i.tripId === trip.id);

  const openAdd = (d?: string) => { setDayDate(d || days[0]); setTime(''); setTitle(''); setLocation(''); setType('activity'); setAdding(true); };
  const save = async () => {
    if (!title.trim() || !dayDate || addItem.isPending) return;
    try {
      await addItem.mutateAsync({ tripId: trip.id, dayDate, time: time.trim() || undefined, title: title.trim(), location: location.trim() || undefined, type });
      setAdding(false);
    } catch (e: any) {
      notify('Could not add item', e?.message ?? 'Please try again.');
    }
  };
  const confirmDelete = (iid: string, label: string) =>
    confirmAction('Delete item', `Remove "${label}"?`, () => deleteItem.mutate(iid));

  const hasAny = items.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!hasAny && (
          <EmptyState icon="map-outline" title="Plan your days" subtitle="Build a day-by-day timeline of activities, transport and meals." cta="Add first item" onCta={() => openAdd()} />
        )}
        {hasAny &&
          days.map((d, idx) => {
            const dayItems = items
              .filter((i) => i.dayDate === d)
              .sort((a, b) => (a.time || '99') > (b.time || '99') ? 1 : -1);
            return (
              <View key={d} style={{ marginBottom: spacing.lg }}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayNum}>{idx + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.dayTitle}>Day {idx + 1}</Text>
                    <Text style={styles.daySub}>{fmtDate(d, 'ddd, MMM D')}</Text>
                  </View>
                  <Pressable style={styles.dayAdd} onPress={() => openAdd(d)} hitSlop={8}>
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </Pressable>
                </View>

                {dayItems.length === 0 ? (
                  <Text style={styles.emptyDay}>No plans yet</Text>
                ) : (
                  dayItems.map((it) => {
                    const meta = TYPE_META[it.type];
                    return (
                      <Pressable key={it.id} style={styles.timelineRow} onLongPress={() => confirmDelete(it.id, it.title)}>
                        <View style={styles.timeCol}>
                          <Text style={styles.timeText}>{it.time || '—'}</Text>
                          {!!it.endTime && <Text style={styles.timeEnd}>–{it.endTime}</Text>}
                        </View>
                        <View style={[styles.line]}>
                          <View style={[styles.node, { backgroundColor: meta.color }]} />
                        </View>
                        <View style={styles.itemCard}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name={meta.icon} size={15} color={meta.color} />
                            <Text style={styles.itemTitle}>{it.title}</Text>
                          </View>
                          {it.location && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                              <Text style={styles.itemLoc}>{it.location}</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            );
          })}
        {hasAny && <Text style={styles.hint}>Long-press an item to delete it</Text>}
        <View style={{ height: 80 }} />
      </ScrollView>

      {hasAny && (
        <Pressable style={styles.fab} onPress={() => openAdd()}>
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      )}

      <Modal visible={adding} animationType="slide" transparent onRequestClose={() => setAdding(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAdding(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add to itinerary</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <Pressable key={t} onPress={() => setType(t)} style={[styles.typeChip, type === t && { backgroundColor: TYPE_META[t].color, borderColor: TYPE_META[t].color }]}>
                  <Ionicons name={TYPE_META[t].icon} size={14} color={type === t ? colors.white : TYPE_META[t].color} />
                  <Text style={[styles.typeText, type === t && { color: colors.white }]}>{TYPE_META[t].label}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Title" placeholder="e.g. Fushimi Inari shrine" value={title} onChangeText={setTitle} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Day" placeholder="YYYY-MM-DD" value={dayDate} onChangeText={setDayDate} autoCapitalize="none" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Time (optional)" placeholder="HH:mm" value={time} onChangeText={setTime} autoCapitalize="none" />
              </View>
            </View>
            <Field label="Location (optional)" icon="location-outline" placeholder="Where?" value={location} onChangeText={setLocation} />
            <Button label={addItem.isPending ? 'Adding…' : 'Add to day'} onPress={save} disabled={!title.trim() || !dayDate || addItem.isPending} full style={{ marginTop: spacing.sm, marginBottom: spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  dayBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  dayNum: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.md },
  dayTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  daySub: { fontSize: font.size.xs, color: colors.textMuted },
  dayAdd: { marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyDay: { fontSize: font.size.sm, color: colors.textFaint, marginLeft: 48, marginBottom: spacing.xs, fontStyle: 'italic' },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  timeCol: { width: 44, paddingTop: 10 },
  timeText: { fontSize: font.size.xs, color: colors.textMuted, fontWeight: font.weight.semibold },
  timeEnd: { fontSize: 10, color: colors.textFaint, fontWeight: font.weight.medium, marginTop: 1 },
  line: { width: 20, alignItems: 'center' },
  node: { width: 12, height: 12, borderRadius: 6, marginTop: 12, borderWidth: 2, borderColor: colors.bg },
  itemCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  itemTitle: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text, flex: 1 },
  itemLoc: { fontSize: font.size.xs, color: colors.textMuted },
  hint: { textAlign: 'center', fontSize: font.size.xs, color: colors.textFaint, marginTop: spacing.sm },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.xl, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.floating },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, maxHeight: '86%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  sheetTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md },
  label: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  typeText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text },
});
