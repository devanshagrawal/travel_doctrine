import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../src/store/useStore';
import { TripCover } from '../../../src/components/TripCover';
import { EmptyState, Pill } from '../../../src/components/ui';
import { colors, font, radius, shadow, spacing } from '../../../src/theme';
import { fmtDateRange, tripDurationDays, tripStatus } from '../../../src/lib/format';
import { formatMoney } from '../../../src/lib/currency';
import { budgetSummary } from '../../../src/lib/selectors';
import { Trip } from '../../../src/lib/types';

export default function TripsHome() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const trips = useStore((s) => s.trips);
  const expenses = useStore((s) => s.expenses);

  const now = Date.now();
  const upcoming = trips.filter((t) => new Date(t.endDate).getTime() >= now);
  const past = trips.filter((t) => new Date(t.endDate).getTime() < now);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi {user?.fullName?.split(' ')[0] || 'traveller'} 👋</Text>
            <Text style={styles.subtitle}>{trips.length} trip{trips.length === 1 ? '' : 's'} in your pocket</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => router.push('/(app)/trip/new')}>
            <Ionicons name="add" size={26} color={colors.white} />
          </Pressable>
        </View>

        {trips.length === 0 ? (
          <EmptyState icon="airplane-outline" title="No trips yet" subtitle="Create your first trip to start planning itineraries, budgets and documents." cta="Plan a trip" onCta={() => router.push('/(app)/trip/new')} />
        ) : (
          <>
            {upcoming.length > 0 && <Text style={styles.groupLabel}>Upcoming & ongoing</Text>}
            {upcoming.map((t) => (
              <TripCard key={t.id} trip={t} spent={budgetSummary(expenses, t).spent} onPress={() => router.push(`/(app)/trip/${t.id}`)} />
            ))}

            {past.length > 0 && <Text style={[styles.groupLabel, { marginTop: spacing.lg }]}>Past trips</Text>}
            {past.map((t) => (
              <TripCard key={t.id} trip={t} spent={budgetSummary(expenses, t).spent} onPress={() => router.push(`/(app)/trip/${t.id}`)} />
            ))}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TripCard({ trip, spent, onPress }: { trip: Trip; spent: number; onPress: () => void }) {
  const status = tripStatus(trip.startDate, trip.endDate);
  const pct = trip.totalBudget > 0 ? Math.min(spent / trip.totalBudget, 1) : 0;
  const tone = pct >= 1 ? 'danger' : pct >= 0.8 ? 'warning' : 'success';
  const barColor = pct >= 1 ? colors.danger : pct >= 0.8 ? colors.warning : colors.success;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <TripCover color={trip.coverColor} emoji={trip.emoji} image={trip.coverImage} height={104} radiusTop={false}>
        <View style={styles.coverOverlay}>
          <Pill label={status.label} tone={status.tone === 'ongoing' ? 'success' : status.tone === 'upcoming' ? 'primary' : 'neutral'} />
        </View>
      </TripCover>
      <View style={styles.cardBody}>
        <Text style={styles.tripName}>{trip.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{trip.destination}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{fmtDateRange(trip.startDate, trip.endDate)} · {tripDurationDays(trip.startDate, trip.endDate)} days</Text>
        </View>

        <View style={styles.budgetRow}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={[styles.budgetText, { color: barColor }]}>{Math.round(pct * 100)}%</Text>
        </View>
        <Text style={styles.budgetSub}>
          {formatMoney(spent, trip.baseCurrency, { compact: true })} of {formatMoney(trip.totalBudget, trip.baseCurrency, { compact: true })} spent
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  greeting: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },
  subtitle: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  addBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.floating },
  groupLabel: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  coverOverlay: { position: 'absolute', left: 12, top: 12 },
  cardBody: { padding: spacing.lg },
  tripName: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metaText: { fontSize: font.size.sm, color: colors.textMuted },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  budgetText: { fontSize: font.size.sm, fontWeight: font.weight.bold, width: 40, textAlign: 'right' },
  budgetSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 5 },
});
