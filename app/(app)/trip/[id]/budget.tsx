import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../../src/store/useStore';
import { DonutChart } from '../../../../src/components/DonutChart';
import { Card } from '../../../../src/components/ui';
import { colors, font, radius, spacing } from '../../../../src/theme';
import { formatMoney } from '../../../../src/lib/currency';
import { budgetSummary, spendByCategory } from '../../../../src/lib/selectors';

export default function Budget() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useStore((s) => s.trips.find((t) => t.id === id));
  const expenses = useStore((s) => s.expenses);
  const categories = useStore((s) => s.budgetCategories);

  if (!trip) return null;
  const summary = budgetSummary(expenses, trip);
  const rows = spendByCategory(expenses, categories, trip).sort((a, b) => b.spent - a.spent);
  const slices = rows.filter((r) => r.spent > 0).map((r) => ({ value: r.spent, color: r.color, label: r.name }));

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.scroll}>
      {/* Donut of actual spend by category */}
      <Card style={{ alignItems: 'center' }}>
        <Text style={styles.cardTitle}>Where the money goes</Text>
        <View style={{ marginVertical: spacing.lg }}>
          <DonutChart
            slices={slices}
            size={180}
            stroke={26}
            centerTop={formatMoney(summary.spent, trip.baseCurrency, { compact: true })}
            centerBottom="spent"
          />
        </View>
        <View style={styles.legend}>
          {rows.filter((r) => r.spent > 0).map((r) => (
            <View key={r.name} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: r.color }]} />
              <Text style={styles.legendText}>{r.name}</Text>
              <Text style={styles.legendPct}>{Math.round((r.spent / (summary.spent || 1)) * 100)}%</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Planned vs actual per category */}
      <Text style={styles.sectionTitle}>Planned vs. spent</Text>
      {rows.map((r) => {
        const pct = r.planned > 0 ? Math.min(r.spent / r.planned, 1) : r.spent > 0 ? 1 : 0;
        const over = r.planned > 0 && r.spent > r.planned;
        return (
          <View key={r.name} style={styles.catRow}>
            <View style={styles.catHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={styles.catName}>{r.name}</Text>
              </View>
              <Text style={styles.catAmounts}>
                <Text style={{ color: over ? colors.danger : colors.text, fontWeight: font.weight.bold }}>{formatMoney(r.spent, trip.baseCurrency, { compact: true })}</Text>
                {r.planned > 0 && <Text style={{ color: colors.textMuted }}> / {formatMoney(r.planned, trip.baseCurrency, { compact: true })}</Text>}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: over ? colors.danger : r.color }]} />
            </View>
            {over && (
              <Text style={styles.overText}>
                <Ionicons name="alert-circle" size={11} color={colors.danger} /> {formatMoney(r.spent - r.planned, trip.baseCurrency, { compact: true })} over budget
              </Text>
            )}
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  cardTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, alignSelf: 'flex-start' },
  legend: { alignSelf: 'stretch', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { flex: 1, fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.medium },
  legendPct: { fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.semibold },
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  catRow: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  catHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  catAmounts: { fontSize: font.size.sm },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  overText: { fontSize: font.size.xs, color: colors.danger, marginTop: 6, fontWeight: font.weight.medium },
});
