import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../../src/store/useStore';
import { useTheme } from '../../../../src/theme/useTheme';
import { Avatar } from '../../../../src/components/Avatar';
import { EmptyState } from '../../../../src/components/ui';
import { confirmAction } from '../../../../src/lib/confirm';
import { formatMoney } from '../../../../src/lib/currency';
import { tripBalances, settleSuggestions } from '../../../../src/lib/selectors';
import { Palette, font, radius, spacing } from '../../../../src/theme';

export default function Settle() {
  const { colors, fonts } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useStore((s) => s.trips.find((t) => t.id === id));
  const expenses = useStore((s) => s.expenses);
  const collaborators = useStore((s) => s.collaborators);
  const settlements = useStore((s) => s.settlements);
  const addSettlement = useStore((s) => s.addSettlement);

  if (!trip) return null;
  const crew = collaborators.filter((c) => c.tripId === trip.id);
  const nameFor = (cid: string) => crew.find((c) => c.id === cid);
  const balances = tripBalances(trip, expenses, collaborators, settlements);
  const suggestions = settleSuggestions(balances);
  const cur = trip.baseCurrency;
  const anyShared = expenses.some((e) => e.tripId === trip.id && e.splitType === 'equal' && e.splitWith?.length);

  const settle = (fromId: string, toId: string, amount: number) => {
    const from = nameFor(fromId)?.name.split(' ')[0] ?? 'They';
    const to = nameFor(toId)?.name.split(' ')[0] ?? 'them';
    confirmAction('Record payment', `Mark ${from} → ${to} ${formatMoney(amount, cur)} as paid?`, () => addSettlement({ tripId: trip.id, fromId, toId, amount }), { confirmLabel: 'Mark paid', destructive: false });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.scroll}>
      {!anyShared ? (
        <EmptyState icon="people-outline" title="No shared expenses yet" subtitle="Turn on 'Split this expense' when logging a cost, and balances will show up here." />
      ) : (
        <>
          <Text style={styles.section}>Balances</Text>
          {balances.map((b) => {
            const owed = b.net > 0.01;
            const owes = b.net < -0.01;
            return (
              <View key={b.collaborator.id} style={styles.row}>
                <Avatar name={b.collaborator.name} color={b.collaborator.avatarColor} size={40} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.name}>{b.collaborator.name}{b.collaborator.isMe ? ' (you)' : ''}</Text>
                  <Text style={[styles.sub, { color: owed ? colors.success : owes ? colors.danger : colors.textMuted }]}>
                    {owed ? `is owed ${formatMoney(b.net, cur)}` : owes ? `owes ${formatMoney(-b.net, cur)}` : 'all settled'}
                  </Text>
                </View>
                <Text style={[styles.net, { color: owed ? colors.success : owes ? colors.danger : colors.textFaint }]}>
                  {owed ? '+' : owes ? '−' : ''}{formatMoney(Math.abs(b.net), cur, { compact: true })}
                </Text>
              </View>
            );
          })}

          <Text style={[styles.section, { marginTop: spacing.xl }]}>Settle up</Text>
          {suggestions.length === 0 ? (
            <View style={styles.allSquare}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.allSquareText}>All square — nobody owes anything.</Text>
            </View>
          ) : (
            suggestions.map((s, i) => {
              const from = nameFor(s.fromId);
              const to = nameFor(s.toId);
              return (
                <View key={i} style={styles.suggestion}>
                  <Avatar name={from?.name ?? '?'} color={from?.avatarColor ?? colors.textFaint} size={30} />
                  <Ionicons name="arrow-forward" size={15} color={colors.textMuted} style={{ marginHorizontal: 6 }} />
                  <Avatar name={to?.name ?? '?'} color={to?.avatarColor ?? colors.textFaint} size={30} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.suggestText}>
                      <Text style={{ fontFamily: fonts.serif }}>{from?.isMe ? 'You' : from?.name.split(' ')[0]}</Text> → {to?.isMe ? 'you' : to?.name.split(' ')[0]}
                    </Text>
                    <Text style={styles.suggestAmt}>{formatMoney(s.amount, cur)}</Text>
                  </View>
                  <Pressable style={styles.settleBtn} onPress={() => settle(s.fromId, s.toId, s.amount)}>
                    <Text style={styles.settleBtnText}>Mark paid</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  scroll: { padding: spacing.lg },
  section: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  sub: { fontSize: font.size.sm, marginTop: 1 },
  net: { fontSize: font.size.md, fontWeight: font.weight.bold, fontVariant: ['tabular-nums'] },
  allSquare: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successSoft, borderRadius: radius.lg, padding: spacing.lg },
  allSquareText: { fontSize: font.size.md, color: colors.success, fontWeight: font.weight.semibold },
  suggestion: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  suggestText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  suggestAmt: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 1, fontVariant: ['tabular-nums'] },
  settleBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill },
  settleBtnText: { color: '#FCF7EE', fontSize: font.size.sm, fontWeight: font.weight.bold },
});
