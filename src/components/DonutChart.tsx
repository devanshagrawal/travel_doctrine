import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { font } from '../theme';
import { useTheme } from '../theme/useTheme';

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

// A donut chart drawn with stroke-dasharray arcs. Center shows a caption.
export function DonutChart({
  slices,
  size = 160,
  stroke = 24,
  centerTop,
  centerBottom,
}: {
  slices: DonutSlice[];
  size?: number;
  stroke?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const { colors } = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((s, x) => s + x.value, 0);

  let offset = 0;
  const arcs =
    total > 0
      ? slices
          .filter((s) => s.value > 0)
          .map((s, i) => {
            const frac = s.value / total;
            const dash = frac * circumference;
            const arc = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += dash;
            return arc;
          })
      : null;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <G>{arcs}</G>
      </Svg>
      {(centerTop || centerBottom) && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          {centerTop && <Text style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text }}>{centerTop}</Text>}
          {centerBottom && <Text style={{ fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 }}>{centerBottom}</Text>}
        </View>
      )}
    </View>
  );
}
