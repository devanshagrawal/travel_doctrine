import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES, RATES, convert, currencyMeta } from '../../../src/lib/currency';
import { font, radius, shadow, spacing, Palette } from '../../../src/theme';
import { useTheme } from '../../../src/theme/useTheme';
import { Masthead } from '../../../src/components/Masthead';
import { useStore } from '../../../src/store/useStore';

export default function CurrencyExchanger() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const homeCurrency = useStore((s) => s.user?.homeCurrency || 'USD');
  const [amount, setAmount] = React.useState('100');
  const [from, setFrom] = React.useState('USD');
  const [to, setTo] = React.useState(homeCurrency);
  const [picking, setPicking] = React.useState<null | 'from' | 'to'>(null);

  const numAmount = Number(amount) || 0;
  const result = convert(numAmount, from, to);
  const rate = convert(1, from, to);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const fromMeta = currencyMeta(from);
  const toMeta = currencyMeta(to);

  // A few popular quick conversions from the "from" currency.
  const quick = CURRENCIES.filter((c) => c.code !== from).slice(0, 6);

  return (
    <View style={styles.safe}>
      <Masthead eyebrow="Offline rates · estimates" title="Currency" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* From */}
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountRow}>
            <Pressable style={styles.codeBtn} onPress={() => setPicking('from')}>
              <Text style={styles.flag}>{fromMeta.flag}</Text>
              <Text style={styles.code}>{from}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textFaint}
            />
          </View>

          {/* Swap */}
          <View style={styles.swapWrap}>
            <View style={styles.divider} />
            <Pressable style={styles.swapBtn} onPress={swap}>
              <Ionicons name="swap-vertical" size={20} color={colors.white} />
            </Pressable>
          </View>

          {/* To */}
          <Text style={styles.label}>Converts to</Text>
          <View style={styles.amountRow}>
            <Pressable style={styles.codeBtn} onPress={() => setPicking('to')}>
              <Text style={styles.flag}>{toMeta.flag}</Text>
              <Text style={styles.code}>{to}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.resultText} numberOfLines={1} adjustsFontSizeToFit>
              {toMeta.symbol}
              {result.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <Text style={styles.rateLine}>
          1 {from} = {rate.toLocaleString('en-US', { maximumFractionDigits: 4 })} {to}
        </Text>

        <Text style={styles.sectionTitle}>Quick convert {fromMeta.symbol}{numAmount.toLocaleString()}</Text>
        <View style={styles.quickGrid}>
          {quick.map((c) => (
            <View key={c.code} style={styles.quickCell}>
              <Text style={styles.quickFlag}>{c.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickCode}>{c.code}</Text>
                <Text style={styles.quickVal}>
                  {c.symbol}
                  {convert(numAmount, from, c.code).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Currency picker modal */}
      <Modal visible={picking !== null} animationType="slide" transparent onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPicking(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select currency</Text>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(c) => c.code}
            renderItem={({ item }) => (
              <Pressable
                style={styles.pickRow}
                onPress={() => {
                  if (picking === 'from') setFrom(item.code);
                  else setTo(item.code);
                  setPicking(null);
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickCode}>{item.code}</Text>
                  <Text style={styles.pickName}>{item.name}</Text>
                </View>
                <Text style={styles.pickRate}>{RATES[item.code]}/USD</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  h1: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },
  sub: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  label: { fontSize: font.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  flag: { fontSize: 22 },
  code: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  // minWidth:0 lets the flex child actually shrink on web (default is
  // min-width:auto, which makes a wide <input> overflow the card).
  amountInput: { flex: 1, minWidth: 0, fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text, textAlign: 'right' },
  resultText: { flex: 1, minWidth: 0, fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.primary, textAlign: 'right' },
  swapWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg, position: 'relative' },
  divider: { height: 1, backgroundColor: colors.border, position: 'absolute', left: 0, right: 0, top: '50%' },
  swapBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  rateLine: { textAlign: 'center', color: colors.textMuted, fontSize: font.size.sm, marginTop: spacing.md, fontWeight: font.weight.medium },
  sectionTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickCell: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  quickFlag: { fontSize: 24 },
  quickCode: { fontSize: font.size.xs, color: colors.textMuted, fontWeight: font.weight.semibold },
  quickVal: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  modalTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickCode: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  pickName: { fontSize: font.size.sm, color: colors.textMuted },
  pickRate: { fontSize: font.size.xs, color: colors.textFaint },
});
