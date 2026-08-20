import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrip, useSetTripCompleted } from '../../../../src/hooks/useTrips';
import { useExpenses, useBudgetCategories, useMembers, useItinerary, useTodos, useDocuments, useFlights, useHotels, useActivities } from '../../../../src/hooks/useTripData';
import { TripCover } from '../../../../src/components/TripCover';
import { BudgetMeter } from '../../../../src/components/BudgetMeter';
import { AvatarStack } from '../../../../src/components/Avatar';
import { Card } from '../../../../src/components/ui';
import { font, radius, shadow, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { fmtDateRange, tripDurationDays, tripStatusFor, isTripDone, fmtDate } from '../../../../src/lib/format';
import { formatMoney } from '../../../../src/lib/currency';
import { budgetSummary, spendByCategory } from '../../../../src/lib/selectors';
import { confirmAction } from '../../../../src/lib/confirm';

export default function TripOverview() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);
  const { data: expenses = [] } = useExpenses(id);
  const { data: budgetCategories = [] } = useBudgetCategories(id);
  const { data: collaborators = [] } = useMembers(id);
  const { data: itinerary = [] } = useItinerary(id);
  const { data: todos = [] } = useTodos(id);
  const { data: documents = [] } = useDocuments(id);
  const { data: flights = [] } = useFlights(id);
  const { data: hotels = [] } = useHotels(id);
  const { data: activities = [] } = useActivities(id);
  const setCompleted = useSetTripCompleted();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  if (!trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: spacing.xl, color: colors.textMuted }}>Trip not found.</Text>
      </SafeAreaView>
    );
  }

  const summary = budgetSummary(expenses, trip);
  const status = tripStatusFor(trip);
  const done = isTripDone(trip);
  const crew = collaborators.filter((c) => c.tripId === trip.id);
  const topCategory = spendByCategory(expenses, budgetCategories, trip).filter((r) => r.spent > 0).sort((a, b) => b.spent - a.spent)[0];
  const tripTodos = todos.filter((t) => t.tripId === trip.id);
  const counts = {
    itinerary: itinerary.filter((i) => i.tripId === trip.id).length,
    documents: documents.filter((d) => d.tripId === trip.id).length,
    flights: flights.filter((f) => f.tripId === trip.id).length,
    hotels: hotels.filter((h) => h.tripId === trip.id).length,
    activities: activities.filter((a) => a.tripId === trip.id).length,
    todos: tripTodos.length,
    todosDone: tripTodos.filter((t) => t.done).length,
  };

  const sections = [
    { key: 'itinerary', title: 'Itinerary', icon: 'map', color: '#2563EB', sub: `${counts.itinerary} items`, href: `/(app)/trip/${trip.id}/itinerary` },
    { key: 'budget', title: 'Budget', icon: 'pie-chart', color: '#F97316', sub: `${Math.round(summary.pct * 100)}% used`, href: `/(app)/trip/${trip.id}/budget` },
    { key: 'expenses', title: 'Expenses', icon: 'receipt', color: '#16A34A', sub: `${expenses.filter((e) => e.tripId === trip.id).length} logged`, href: `/(app)/trip/${trip.id}/expenses` },
    { key: 'documents', title: 'Documents', icon: 'document-text', color: '#9333EA', sub: `${counts.documents} files`, href: `/(app)/trip/${trip.id}/documents` },
    { key: 'flights', title: 'Flights', icon: 'airplane', color: '#0EA5E9', sub: `${counts.flights} booked`, href: `/(app)/trip/${trip.id}/flights` },
    { key: 'hotels', title: 'Hotels', icon: 'bed', color: '#E11D48', sub: `${counts.hotels} booked`, href: `/(app)/trip/${trip.id}/hotels` },
    { key: 'activities', title: 'Activities', icon: 'sparkles', color: '#DB2777', sub: `${counts.activities} booked`, href: `/(app)/trip/${trip.id}/activities` },
    { key: 'todos', title: 'Checklist', icon: 'checkbox', color: '#CA8A04', sub: `${counts.todosDone}/${counts.todos} done`, href: `/(app)/trip/${trip.id}/todos` },
  ] as const;

  return (
    <View style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <TripCover color={trip.coverColor} emoji={trip.emoji} image={trip.coverImage} height={230} radiusTop={false}>
          <SafeAreaView edges={['top']} style={StyleSheet.absoluteFill}>
            <View style={styles.coverBar}>
              <Pressable style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={22} color={colors.white} />
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={styles.backBtn} onPress={() => router.push(`/(app)/trip/${trip.id}/share`)}>
                  <Ionicons name="person-add-outline" size={19} color={colors.white} />
                </Pressable>
                <Pressable style={styles.backBtn} onPress={() => router.push(`/(app)/trip/${trip.id}/edit`)}>
                  <Ionicons name="create-outline" size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
          <View style={styles.coverText}>
            <Text style={styles.tripName}>{trip.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.metaText}>{trip.destination}</Text>
            </View>
          </View>
        </TripCover>

        <View style={styles.body}>
          {/* Budget meter card */}
          <Card style={{ marginTop: -18 }}>
            <View style={styles.meterRow}>
              <BudgetMeter spent={summary.spent} budget={summary.budget} currency={trip.baseCurrency} size={148} />
              <View style={styles.meterStats}>
                <Stat label="Budget" value={formatMoney(summary.budget, trip.baseCurrency, { compact: true })} />
                <Stat label="Spent" value={formatMoney(summary.spent, trip.baseCurrency, { compact: true })} color={colors.text} />
                <Stat
                  label={summary.remaining >= 0 ? 'Remaining' : 'Over budget'}
                  value={formatMoney(Math.abs(summary.remaining), trip.baseCurrency, { compact: true })}
                  color={summary.remaining >= 0 ? colors.success : colors.danger}
                />
              </View>
            </View>
          </Card>

          {/* Trip facts */}
          <View style={styles.factsRow}>
            <Fact icon="time-outline" label={status.label} />
            <Fact icon="calendar-outline" label={`${tripDurationDays(trip.startDate, trip.endDate)} days`} />
            <Fact icon="cash-outline" label={trip.baseCurrency} />
          </View>
          <Text style={styles.dateRange}>{fmtDateRange(trip.startDate, trip.endDate)}</Text>

          {/* Crew */}
          <Pressable style={styles.crewCard} onPress={() => router.push(`/(app)/trip/${trip.id}/share`)}>
            <AvatarStack people={crew} size={34} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.crewTitle}>{crew.length <= 1 ? 'Just you' : `Shared with ${crew.length - 1} ${crew.length - 1 === 1 ? 'other' : 'others'}`}</Text>
              <Text style={styles.crewSub}>Everyone here can add & edit</Text>
            </View>
            <View style={[styles.crewBtn, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="person-add" size={15} color={colors.primary} />
              <Text style={[styles.crewBtnText, { color: colors.primary }]}>Invite</Text>
            </View>
          </Pressable>

          {/* Section grid */}
          <View style={styles.grid}>
            {sections.map((s) => (
              <Pressable key={s.key} style={styles.tile} onPress={() => router.push(s.href as any)}>
                <View style={[styles.tileIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                </View>
                <Text style={styles.tileTitle}>{s.title}</Text>
                <Text style={styles.tileSub}>{s.sub}</Text>
              </Pressable>
            ))}
          </View>

          {/* Completion */}
          {done ? (
            <View style={styles.recap}>
              <View style={styles.recapHead}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.recapTitle}>Trip completed</Text>
                {trip.completedAt && <Text style={styles.recapDate}>{fmtDate(trip.completedAt, 'MMM D, YYYY')}</Text>}
              </View>
              <View style={styles.recapGrid}>
                <Recap label="Total spent" value={formatMoney(summary.spent, trip.baseCurrency, { compact: true })} />
                <Recap label={summary.remaining >= 0 ? 'Under budget' : 'Over budget'} value={formatMoney(Math.abs(summary.remaining), trip.baseCurrency, { compact: true })} tone={summary.remaining >= 0 ? colors.success : colors.danger} />
                <Recap label="Days" value={String(tripDurationDays(trip.startDate, trip.endDate))} />
                <Recap label="Plans" value={String(counts.itinerary)} />
                <Recap label="Travellers" value={String(crew.length)} />
                {topCategory && <Recap label="Top spend" value={topCategory.name} />}
              </View>
              {trip.completedAt && (
                <Pressable style={styles.reopenBtn} onPress={() => setCompleted.mutate({ id: trip.id, completed: false })}>
                  <Ionicons name="refresh" size={15} color={colors.textMuted} />
                  <Text style={styles.reopenText}>Reopen trip</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              style={styles.completeBtn}
              onPress={() => confirmAction('Complete trip', `Mark "${trip.name}" as completed? It'll move to your past trips.`, () => setCompleted.mutate({ id: trip.id, completed: true }), { confirmLabel: 'Complete', destructive: false })}
            >
              <Ionicons name="checkmark-done" size={18} color={colors.primary} />
              <Text style={styles.completeText}>Mark trip as completed</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Recap({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.recapItem}>
      <Text style={[styles.recapValue, tone && { color: tone }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.recapLabel}>{label}</Text>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    </View>
  );
}

function Fact({ icon, label }: { icon: any; label: string }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={styles.factText}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  coverBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { margin: spacing.md, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  coverText: { position: 'absolute', left: spacing.lg, bottom: 46, right: spacing.lg },
  tripName: { fontSize: 26, color: '#FCF7EE' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { fontSize: font.size.sm, color: 'rgba(255,255,255,0.9)', fontWeight: font.weight.medium },
  body: { paddingHorizontal: spacing.lg },
  meterRow: { flexDirection: 'row', alignItems: 'center' },
  meterStats: { flex: 1, paddingLeft: spacing.lg },
  statLabel: { fontSize: font.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginTop: 1 },
  factsRow: { flexDirection: 'row', gap: 8, marginTop: spacing.lg },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  factText: { fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.medium },
  dateRange: { fontSize: font.size.sm, color: colors.textMuted, marginTop: spacing.md, marginLeft: 2 },
  crewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  crewTitle: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  crewSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 1 },
  crewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  crewBtnText: { fontSize: font.size.sm, fontWeight: font.weight.semibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.lg },
  tile: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  tileTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  tileSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  completeText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.primary },
  recap: { marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, ...shadow.card },
  recapHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  recapTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, flex: 1 },
  recapDate: { fontSize: font.size.xs, color: colors.textMuted },
  recapGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  recapItem: { width: '33.33%', paddingVertical: spacing.sm },
  recapValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  recapLabel: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 1 },
  reopenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.md, paddingVertical: spacing.sm },
  reopenText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
});
