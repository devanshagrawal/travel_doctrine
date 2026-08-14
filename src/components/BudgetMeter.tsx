import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { font, Palette } from '../theme';
import { useTheme } from '../theme/useTheme';
import { formatMoney } from '../lib/currency';

// A circular budget "meter": a ring that fills with spend and changes
// colour as you approach / exceed the budget.
export function BudgetMeter({
  spent,
  budget,
  currency,
  size = 168,
  stroke = 16,
}: {
  spent: number;
  budget: number;
  currency: string;
  size?: number;
  stroke?: number;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const pct = budget > 0 ? spent / budget : 0;
  const clamped = Math.min(pct, 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;

  const ringColor = pct >= 1 ? colors.danger : pct >= 0.8 ? colors.warning : colors.primary;
  const remaining = budget - spent;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.pct, { color: ringColor }]}>{Math.round(pct * 100)}%</Text>
        <Text style={styles.label}>spent</Text>
        <Text style={styles.remaining}>
          {remaining >= 0
            ? `${formatMoney(remaining, currency, { compact: true })} left`
            : `${formatMoney(-remaining, currency, { compact: true })} over`}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center' },
  pct: { fontSize: font.size.xxl, fontWeight: font.weight.bold },
  label: { fontSize: font.size.xs, color: colors.textMuted, marginTop: -2, textTransform: 'uppercase', letterSpacing: 1 },
  remaining: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 6, fontWeight: font.weight.semibold },
});
