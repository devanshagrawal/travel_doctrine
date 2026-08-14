import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, shadow, spacing, Palette } from '../theme';
import { useTheme } from '../theme/useTheme';

// ---------- Card ----------
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: ViewStyle; padded?: boolean }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <View style={[styles.card, padded && { padding: spacing.lg }, style]}>{children}</View>;
}

// ---------- Button ----------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  full?: boolean;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const bg =
    variant === 'ghost' ? 'transparent' : isDanger ? colors.dangerSoft : isPrimary ? colors.primary : colors.surfaceAlt;
  const fg = isPrimary ? '#FCF7EE' : isDanger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && { paddingHorizontal: spacing.sm },
        full && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} />}
          <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// ---------- Text field ----------
export function Field({
  label,
  icon,
  style,
  ...props
}: TextInputProps & { label?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={[styles.fieldWrap, focused && { borderColor: colors.primary, backgroundColor: colors.surface }]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textFaint} style={{ marginRight: 8 }} />}
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.fieldInput, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
}

// ---------- Pill / badge ----------
export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const map = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
    primary: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      {icon && <Ionicons name={icon} size={12} color={map.fg} style={{ marginRight: 4 }} />}
      <Text style={[styles.pillText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

// ---------- Section header ----------
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------- Empty state ----------
export function EmptyState({ icon, title, subtitle, cta, onCta }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; cta?: string; onCta?: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {cta && <Button label={cta} onPress={onCta} style={{ marginTop: spacing.lg }} />}
    </View>
  );
}

// ---------- Icon in a soft circle ----------
export function IconCircle({ icon, color, bg, size = 40 }: { icon: keyof typeof Ionicons.glyphMap; color?: string; bg?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg || colors.primarySoft }}>
      <Ionicons name={icon} size={size * 0.5} color={color || colors.primary} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  btn: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: font.size.md, fontWeight: font.weight.semibold },
  fieldLabel: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 6 },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  fieldInput: { flex: 1, fontSize: font.size.md, color: colors.text, paddingVertical: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: font.size.xs, fontWeight: font.weight.semibold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.xs },
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  sectionAction: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.primary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, textAlign: 'center' },
  emptySub: { fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
