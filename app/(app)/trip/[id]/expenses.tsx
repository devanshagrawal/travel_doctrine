import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { confirmAction } from '../../../../src/lib/confirm';
import { useStore } from '../../../../src/store/useStore';
import { Button, Field, EmptyState } from '../../../../src/components/ui';
import { colors, font, radius, shadow, spacing } from '../../../../src/theme';
import { CURRENCIES, convert, currencyMeta, formatMoney } from '../../../../src/lib/currency';
import { budgetSummary } from '../../../../src/lib/selectors';
import { fmtDate } from '../../../../src/lib/format';

export default function Expenses() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useStore((s) => s.trips.find((t) => t.id === id));
  const expenses = useStore((s) => s.expenses);
  const categories = useStore((s) => s.budgetCategories);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);

  const [adding, setAdding] = React.useState(false);
  const [desc, setDesc] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState(trip?.baseCurrency || 'USD');
  const [categoryId, setCategoryId] = React.useState<string | null>(null);

  if (!trip) return null;
  const tripCats = categories.filter((c) => c.tripId === trip.id);
  const list = expenses
    .filter((e) => e.tripId === trip.id)
    .sort((a, b) => (a.spentAt < b.spentAt ? 1 : -1));
  const summary = budgetSummary(expenses, trip);

  const reset = () => { setDesc(''); setAmount(''); setCurrency(trip.baseCurrency); setCategoryId(null); setAdding(false); };
  const save = () => {
    if (!desc.trim() || !Number(amount)) return;
    addExpense({ tripId: trip.id, categoryId, amount: Number(amount), currency, description: desc.trim(), spentAt: dayjs().format('YYYY-MM-DD'), paidBy: 'Me' });
    reset();
  };
  const confirmDelete = (eid: string, label: string) =>
    confirmAction('Delete expense', `Remove "${label}"?`, () => deleteExpense(eid));

  const catFor = (cid: string | null) => tripCats.find((c) => c.id === cid);

  return (
    <View style={styles.container}>
      {/* Ledger summary */}
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summaryLabel}>Total spent</Text>
          <Text style={styles.summaryValue}>{formatMoney(summary.spent, trip.baseCurrency)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.summaryLabel}>{summary.remaining >= 0 ? 'Remaining' : 'Over'}</Text>
          <Text style={[styles.summaryValue, { color: summary.remaining >= 0 ? colors.success : colors.danger }]}>
            {formatMoney(Math.abs(summary.remaining), trip.baseCurrency)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {list.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No expenses yet" subtitle="Log what you spend and watch the budget meter update instantly." cta="Add expense" onCta={() => setAdding(true)} />
        ) : (
          list.map((e) => {
            const cat = catFor(e.categoryId);
            const inBase = convert(e.amount, e.currency, trip.baseCurrency);
            return (
              <View key={e.id} style={styles.item}>
                <View style={[styles.itemIcon, { backgroundColor: (cat?.color || colors.textFaint) + '18' }]}>
                  <Ionicons name={(cat?.icon as any) || 'ellipse'} size={18} color={cat?.color || colors.textFaint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemDesc}>{e.description}</Text>
                  <Text style={styles.itemMeta}>{cat?.name || 'Uncategorized'} · {fmtDate(e.spentAt, 'MMM D')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemAmount}>{formatMoney(inBase, trip.baseCurrency)}</Text>
                  {e.currency !== trip.baseCurrency && (
                    <Text style={styles.itemOrig}>{formatMoney(e.amount, e.currency)}</Text>
                  )}
                </View>
                <Pressable hitSlop={8} onPress={() => confirmDelete(e.id, e.description)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            );
          })
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setAdding(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Add expense sheet */}
      <Modal visible={adding} animationType="slide" transparent onRequestClose={reset}>
        <Pressable style={styles.backdrop} onPress={reset} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add expense</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Field label="Description" placeholder="e.g. Dinner at izakaya" value={desc} onChangeText={setDesc} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1.4 }}>
                <Field label="Amount" placeholder="0" keyboardType="numeric" value={amount} onChangeText={setAmount} />
              </View>
            </View>

            <Text style={styles.label}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {CURRENCIES.map((c) => (
                <Pressable key={c.code} onPress={() => setCurrency(c.code)} style={[styles.chip, currency === c.code && styles.chipActive]}>
                  <Text style={[styles.chipText, currency === c.code && { color: colors.white }]}>{c.flag} {c.code}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Category</Text>
            <View style={styles.catWrap}>
              {tripCats.map((c) => (
                <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.catChip, categoryId === c.id && { backgroundColor: c.color, borderColor: c.color }]}>
                  <Ionicons name={c.icon as any} size={14} color={categoryId === c.id ? colors.white : c.color} />
                  <Text style={[styles.catText, categoryId === c.id && { color: colors.white }]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>

            {Number(amount) > 0 && currency !== trip.baseCurrency && (
              <Text style={styles.convHint}>
                ≈ {formatMoney(convert(Number(amount), currency, trip.baseCurrency), trip.baseCurrency)} in {trip.baseCurrency}
              </Text>
            )}

            <Button label="Save expense" onPress={save} disabled={!desc.trim() || !Number(amount)} full style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: font.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginTop: 2 },
  scroll: { padding: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  itemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemDesc: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  itemMeta: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  itemAmount: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  itemOrig: { fontSize: font.size.xs, color: colors.textFaint, marginTop: 1 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.xl, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.floating },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, maxHeight: '86%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  sheetTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md },
  label: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  catText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text },
  convHint: { fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.medium, marginTop: 4 },
});
