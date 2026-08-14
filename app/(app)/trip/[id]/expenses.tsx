import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { confirmAction, notify } from '../../../../src/lib/confirm';
import { useStore } from '../../../../src/store/useStore';
import { Button, Field, EmptyState } from '../../../../src/components/ui';
import { font, radius, shadow, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { CURRENCIES, convert, currencyMeta, formatMoney } from '../../../../src/lib/currency';
import { budgetSummary } from '../../../../src/lib/selectors';
import { fmtDate } from '../../../../src/lib/format';

export default function Expenses() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useStore((s) => s.trips.find((t) => t.id === id));
  const expenses = useStore((s) => s.expenses);
  const categories = useStore((s) => s.budgetCategories);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const collaborators = useStore((s) => s.collaborators);
  const cashWallets = useStore((s) => s.cashWallets);
  const loadCash = useStore((s) => s.loadCash);
  const adjustCash = useStore((s) => s.adjustCash);

  const crew = collaborators.filter((c) => c.tripId === id);
  const me = crew.find((c) => c.isMe) ?? crew[0];
  const canSplit = crew.length > 1;
  const wallet = cashWallets.find((w) => w.tripId === id);

  const [adding, setAdding] = React.useState(false);
  const [desc, setDesc] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState(trip?.baseCurrency || 'USD');
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [paidById, setPaidById] = React.useState<string | undefined>(me?.id);
  const [splitOn, setSplitOn] = React.useState(false);
  const [participants, setParticipants] = React.useState<string[]>(crew.map((c) => c.id));
  const [paySource, setPaySource] = React.useState<'regular' | 'cash'>('regular');
  const [loadingCash, setLoadingCash] = React.useState(false);
  const [cashCur, setCashCur] = React.useState(trip?.baseCurrency || 'USD');
  const [cashAmt, setCashAmt] = React.useState('');

  if (!trip) return null;
  const tripCats = categories.filter((c) => c.tripId === trip.id);
  const list = expenses
    .filter((e) => e.tripId === trip.id)
    .sort((a, b) => (a.spentAt < b.spentAt ? 1 : -1));
  const summary = budgetSummary(expenses, trip);
  const nameFor = (cid?: string) => crew.find((c) => c.id === cid)?.name ?? 'Me';

  const openAdd = () => {
    setPaidById(me?.id);
    setSplitOn(false);
    setParticipants(crew.map((c) => c.id));
    setPaySource('regular');
    setAdding(true);
  };
  const toggleParticipant = (cid: string) =>
    setParticipants((p) => (p.includes(cid) ? p.filter((x) => x !== cid) : [...p, cid]));

  const reset = () => { setDesc(''); setAmount(''); setCurrency(trip.baseCurrency); setCategoryId(null); setSplitOn(false); setPaySource('regular'); setAdding(false); };
  const save = () => {
    if (!desc.trim() || !Number(amount)) return;
    const amt = Number(amount);
    // Cash spend (Model A): draws the wallet, currency = wallet currency, not re-counted.
    if (paySource === 'cash' && wallet) {
      addExpense({ tripId: trip.id, categoryId, amount: amt, currency: wallet.currency, description: desc.trim(), spentAt: dayjs().format('YYYY-MM-DD'), paidBy: nameFor(me?.id), paidFrom: 'cash' });
      adjustCash(wallet.id, -amt);
      reset();
      return;
    }
    const shared = splitOn && canSplit && participants.length > 0;
    addExpense({
      tripId: trip.id,
      categoryId,
      amount: amt,
      currency,
      description: desc.trim(),
      spentAt: dayjs().format('YYYY-MM-DD'),
      paidBy: nameFor(paidById),
      paidById: paidById ?? me?.id,
      splitType: shared ? 'equal' : 'none',
      splitWith: shared ? participants : undefined,
      paidFrom: 'regular',
    });
    reset();
  };

  const openLoadCash = () => { setCashCur(wallet?.currency ?? trip.baseCurrency); setCashAmt(''); setLoadingCash(true); };
  const saveLoadCash = () => {
    if (!Number(cashAmt)) return;
    loadCash(trip.id, cashCur, Number(cashAmt));
    setLoadingCash(false);
  };
  const confirmDelete = (e: { id: string; description: string; paidFrom?: string; amount: number }) =>
    confirmAction('Delete expense', `Remove "${e.description}"?`, () => {
      deleteExpense(e.id);
      if (e.paidFrom === 'cash' && wallet) adjustCash(wallet.id, e.amount); // refund the cash
    });

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

      {canSplit && (
        <Pressable style={styles.settleBanner} onPress={() => router.push(`/(app)/trip/${trip.id}/settle`)}>
          <Ionicons name="people-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.settleText}>Balances & settle up</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cash wallet (Model A) */}
        {wallet ? (
          <View style={styles.cashCard}>
            <View style={styles.cashTop}>
              <View style={styles.cashIcon}><Ionicons name="cash" size={18} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cashTitle}>{currencyMeta(wallet.currency).flag} {wallet.currency} cash wallet</Text>
                <Text style={styles.cashSub}>{formatMoney(wallet.loaded - wallet.balance, wallet.currency)} spent of {formatMoney(wallet.loaded, wallet.currency)}</Text>
              </View>
              <Pressable style={styles.cashAddBtn} onPress={openLoadCash}>
                <Ionicons name="add" size={15} color={colors.primary} />
                <Text style={styles.cashAddText}>Add cash</Text>
              </Pressable>
            </View>
            <Text style={styles.cashBalance}>{formatMoney(wallet.balance, wallet.currency)} <Text style={styles.cashBalanceLabel}>left in cash</Text></Text>
          </View>
        ) : (
          <Pressable style={styles.cashEmpty} onPress={openLoadCash}>
            <Ionicons name="cash-outline" size={18} color={colors.primary} />
            <Text style={styles.cashEmptyText}>Add travel cash</Text>
          </Pressable>
        )}

        {list.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No expenses yet" subtitle="Log what you spend and watch the budget meter update instantly." cta="Add expense" onCta={openAdd} />
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
                  {e.splitType === 'equal' && !!e.splitWith?.length && (
                    <View style={styles.splitBadge}>
                      <Ionicons name="people" size={11} color={colors.accent} />
                      <Text style={styles.splitBadgeText}>{nameFor(e.paidById).split(' ')[0]} paid · split {e.splitWith.length} ways</Text>
                    </View>
                  )}
                  {e.paidFrom === 'cash' && (
                    <View style={styles.splitBadge}>
                      <Ionicons name="cash" size={11} color={colors.textMuted} />
                      <Text style={[styles.splitBadgeText, { color: colors.textMuted }]}>from cash</Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemAmount}>{formatMoney(inBase, trip.baseCurrency)}</Text>
                  {e.currency !== trip.baseCurrency && (
                    <Text style={styles.itemOrig}>{formatMoney(e.amount, e.currency)}</Text>
                  )}
                </View>
                {e.sourceId ? (
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      notify(
                        'Linked expense',
                        'This expense comes from a flight or hotel booking. To remove it, delete that booking from the Flights or Hotels tab.'
                      )
                    }
                    style={styles.linkedBtn}
                  >
                    <Ionicons name="link" size={16} color={colors.textFaint} />
                  </Pressable>
                ) : (
                  <Pressable hitSlop={8} onPress={() => confirmDelete(e)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={openAdd}>
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

            {wallet && (
              <>
                <Text style={styles.label}>Pay with</Text>
                <View style={[styles.catWrap, { marginBottom: spacing.md }]}>
                  <Pressable onPress={() => setPaySource('regular')} style={[styles.payChip, paySource === 'regular' && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Ionicons name="card-outline" size={14} color={paySource === 'regular' ? '#FCF7EE' : colors.text} />
                    <Text style={[styles.payText, paySource === 'regular' && { color: '#FCF7EE' }]}>Card / other</Text>
                  </Pressable>
                  <Pressable onPress={() => setPaySource('cash')} style={[styles.payChip, paySource === 'cash' && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                    <Ionicons name="cash-outline" size={14} color={paySource === 'cash' ? '#FCF7EE' : colors.accent} />
                    <Text style={[styles.payText, paySource === 'cash' && { color: '#FCF7EE' }]}>Cash · {formatMoney(wallet.balance, wallet.currency, { compact: true })}</Text>
                  </Pressable>
                </View>
                {paySource === 'cash' && Number(amount) > wallet.balance ? (
                  <Text style={styles.cashWarn}>
                    <Ionicons name="alert-circle" size={12} color={colors.danger} /> Not enough cash — only {formatMoney(wallet.balance, wallet.currency)} left. Add more or pay by card.
                  </Text>
                ) : paySource === 'cash' ? (
                  <Text style={styles.splitHint}>Drawn from your {wallet.currency} cash — not added to the budget total again.</Text>
                ) : null}
              </>
            )}

            {paySource === 'regular' && (
              <>
                <Text style={styles.label}>Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                  {CURRENCIES.map((c) => (
                    <Pressable key={c.code} onPress={() => setCurrency(c.code)} style={[styles.chip, currency === c.code && styles.chipActive]}>
                      <Text style={[styles.chipText, currency === c.code && { color: colors.white }]}>{c.flag} {c.code}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

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

            {canSplit && paySource === 'regular' && (
              <>
                <Text style={styles.label}>Paid by</Text>
                <View style={styles.catWrap}>
                  {crew.map((c) => (
                    <Pressable key={c.id} onPress={() => setPaidById(c.id)} style={[styles.payChip, paidById === c.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      <Text style={[styles.payText, paidById === c.id && { color: '#FCF7EE' }]}>{c.isMe ? 'You' : c.name.split(' ')[0]}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.splitToggleRow}>
                  <Text style={styles.label}>Split this expense</Text>
                  <Pressable style={[styles.switch, splitOn && { backgroundColor: colors.primary }]} onPress={() => setSplitOn((v) => !v)}>
                    <View style={[styles.knob, splitOn && { transform: [{ translateX: 18 }] }]} />
                  </Pressable>
                </View>

                {splitOn && (
                  <>
                    <Text style={styles.splitHint}>Tap to include people · {participants.length > 0 ? `${formatMoney(convert(Number(amount) || 0, currency, trip.baseCurrency) / participants.length, trip.baseCurrency)} each` : 'pick at least one'}</Text>
                    <View style={styles.catWrap}>
                      {crew.map((c) => {
                        const on = participants.includes(c.id);
                        return (
                          <Pressable key={c.id} onPress={() => toggleParticipant(c.id)} style={[styles.payChip, on && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
                            <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={on ? colors.accent : colors.textFaint} />
                            <Text style={[styles.payText, on && { color: colors.accent }]}>{c.isMe ? 'You' : c.name.split(' ')[0]}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}
              </>
            )}

            <Button label="Save expense" onPress={save} disabled={!desc.trim() || !Number(amount) || (paySource === 'cash' && !!wallet && Number(amount) > wallet.balance)} full style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Load cash sheet */}
      <Modal visible={loadingCash} animationType="slide" transparent onRequestClose={() => setLoadingCash(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLoadingCash(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add travel cash</Text>
          <Text style={styles.splitHint}>Buying cash counts as spent now. Paying with it later draws this balance down.</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {CURRENCIES.map((c) => (
                <Pressable key={c.code} onPress={() => setCashCur(c.code)} style={[styles.chip, cashCur === c.code && styles.chipActive]}>
                  <Text style={[styles.chipText, cashCur === c.code && { color: colors.white }]}>{c.flag} {c.code}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Field label={`Amount (${cashCur})`} placeholder="0" keyboardType="numeric" value={cashAmt} onChangeText={setCashAmt} />
            {Number(cashAmt) > 0 && cashCur !== trip.baseCurrency && (
              <Text style={styles.convHint}>≈ {formatMoney(convert(Number(cashAmt), cashCur, trip.baseCurrency), trip.baseCurrency)} counted against budget</Text>
            )}
            <Button label="Add cash" onPress={saveLoadCash} disabled={!Number(cashAmt)} full style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
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
  splitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  splitBadgeText: { fontSize: font.size.xs, color: colors.accent, fontWeight: font.weight.semibold },
  settleBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  settleText: { flex: 1, fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  payChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  payText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text },
  splitToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  switch: { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.surfaceAlt, padding: 3, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FCF7EE' },
  splitHint: { fontSize: font.size.sm, color: colors.textMuted, marginBottom: 8, marginTop: 2 },
  cashWarn: { fontSize: font.size.sm, color: colors.danger, fontWeight: font.weight.medium, marginBottom: 8, marginTop: 2, lineHeight: 18 },
  cashCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  cashTop: { flexDirection: 'row', alignItems: 'center' },
  cashIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cashTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  cashSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 1 },
  cashAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  cashAddText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.primary },
  cashBalance: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.md },
  cashBalanceLabel: { fontSize: font.size.sm, fontWeight: font.weight.regular, color: colors.textMuted },
  cashEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', paddingVertical: spacing.md, marginBottom: spacing.md },
  cashEmptyText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.primary },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  linkedBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
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
