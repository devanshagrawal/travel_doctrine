import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../src/store/useStore';
import { useTrips } from '../../../src/hooks/useTrips';
import { useAllExpenses } from '../../../src/hooks/useTripData';
import { useTheme } from '../../../src/theme/useTheme';
import { Masthead } from '../../../src/components/Masthead';
import { TripCover } from '../../../src/components/TripCover';
import { AvatarStack } from '../../../src/components/Avatar';
import { EmptyState } from '../../../src/components/ui';
import { fmtDateRange, tripDurationDays, tripStatusFor, isTripDone } from '../../../src/lib/format';
import { formatMoney } from '../../../src/lib/currency';
import { budgetSummary } from '../../../src/lib/selectors';
import { Trip } from '../../../src/lib/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TripsHome() {
  const router = useRouter();
  const { colors, spacing, shadow } = useTheme();
  const user = useStore((s) => s.user);
  const { data: expenses = [] } = useAllExpenses();
  const { data: trips = [], isLoading, error } = useTrips();

  const upcoming = trips.filter((t) => !isTripDone(t));
  const past = trips.filter((t) => isTripDone(t));
  const firstName = user?.fullName?.split(' ')[0] || 'traveller';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Masthead eyebrow="Your journeys" title={`${greeting()}, ${firstName}`} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ paddingTop: 80, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <EmptyState icon="cloud-offline-outline" title="Couldn't load your trips" subtitle={(error as Error).message} />
        ) : trips.length === 0 ? (
          <EmptyState icon="airplane-outline" title="No trips yet" subtitle="Create your first trip to start planning itineraries, budgets and documents." cta="Plan a trip" onCta={() => router.push('/(app)/trip/new')} />
        ) : (
          <>
            {upcoming.length > 0 && <SectionLabel title="Upcoming" count={`${upcoming.length} trip${upcoming.length === 1 ? '' : 's'}`} />}
            {upcoming.map((t, i) => (
              <TripCard key={t.id} trip={t} spent={budgetSummary(expenses, t).spent} hero={i === 0} onPress={() => router.push(`/(app)/trip/${t.id}`)} />
            ))}

            {past.length > 0 && (
              <View style={{ marginTop: spacing.lg }}>
                <SectionLabel title="Past" count={`${past.length} trip${past.length === 1 ? '' : 's'}`} />
              </View>
            )}
            {past.map((t) => (
              <TripCard key={t.id} trip={t} spent={budgetSummary(expenses, t).spent} onPress={() => router.push(`/(app)/trip/${t.id}`)} />
            ))}
          </>
        )}
      </ScrollView>

      {trips.length > 0 && (
        <Pressable style={[styles.fab, { backgroundColor: colors.primary }, shadow.floating]} onPress={() => router.push('/(app)/trip/new')}>
          <Ionicons name="add" size={28} color="#FCF7EE" />
        </Pressable>
      )}
    </View>
  );
}

function SectionLabel({ title, count }: { title: string; count: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{count}</Text>
    </View>
  );
}

function TripCard({ trip, spent, hero, onPress }: { trip: Trip; spent: number; hero?: boolean; onPress: () => void }) {
  const { colors, fonts, radius, shadow } = useTheme();
  const crew = useStore((s) => s.collaborators).filter((c) => c.tripId === trip.id);
  const status = tripStatusFor(trip);
  const pct = trip.totalBudget > 0 ? Math.min(spent / trip.totalBudget, 1) : 0;
  const barColor = pct >= 1 ? colors.danger : pct >= 0.8 ? colors.warning : colors.success;
  const pillTone =
    status.tone === 'ongoing' ? { bg: colors.success, fg: '#FCF7EE' } : status.tone === 'upcoming' ? { bg: 'rgba(252,247,238,0.92)', fg: '#3A2A20' } : { bg: 'rgba(252,247,238,0.85)', fg: '#3A2A20' };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20 }, shadow.card]}
      onPress={onPress}
    >
      <TripCover color={trip.coverColor} emoji={trip.emoji} image={trip.coverImage} height={hero ? 188 : 158} radiusTop={false} scrim>
        <View style={[styles.pill, { backgroundColor: pillTone.bg }]}>
          <Text style={[styles.pillText, { color: pillTone.fg }]}>{status.label}</Text>
        </View>
        <View style={styles.coverText}>
          <Text style={[styles.tripName, { fontFamily: fonts.serif }]} numberOfLines={2}>{trip.name}</Text>
          <Text style={[styles.tripDest, { fontFamily: fonts.serifItalic }]} numberOfLines={1}>{trip.destination}</Text>
        </View>
      </TripCover>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>{fmtDateRange(trip.startDate, trip.endDate)} · {tripDurationDays(trip.startDate, trip.endDate)} days</Text>
        </View>
        <View style={styles.budgetRow}>
          <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={[styles.budgetPct, { color: barColor }]}>{Math.round(pct * 100)}%</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.budgetSub, { color: colors.textMuted }]}>
            {formatMoney(spent, trip.baseCurrency, { compact: true })} of {formatMoney(trip.totalBudget, trip.baseCurrency, { compact: true })} spent
          </Text>
          {crew.length > 1 && <AvatarStack people={crew} size={24} max={3} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.6 },
  sectionCount: { fontSize: 12.5 },
  card: { overflow: 'hidden', marginBottom: 18, borderWidth: 1 },
  pill: { position: 'absolute', left: 13, top: 13, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },
  coverText: { position: 'absolute', left: 16, right: 16, bottom: 15 },
  tripName: { fontSize: 22, color: '#FCF7EE', letterSpacing: -0.3, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } },
  tripDest: { fontSize: 13, color: 'rgba(252,247,238,0.92)', marginTop: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8 },
  cardBody: { padding: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  budgetPct: { fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  budgetSub: { fontSize: 12, fontVariant: ['tabular-nums'] },
  fab: { position: 'absolute', right: 18, bottom: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
