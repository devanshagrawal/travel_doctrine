import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { confirmAction } from '../../../src/lib/confirm';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../../src/store/useStore';
import { Card, Button, Field } from '../../../src/components/ui';
import { CURRENCIES, currencyMeta } from '../../../src/lib/currency';
import { colors, font, radius, shadow, spacing } from '../../../src/theme';

export default function Profile() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const setHomeCurrency = useStore((s) => s.setHomeCurrency);
  const updateUser = useStore((s) => s.updateUser);
  const resetToSeed = useStore((s) => s.resetToSeed);
  const trips = useStore((s) => s.trips);
  const [pickingCurrency, setPickingCurrency] = React.useState(false);

  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  const openEdit = () => {
    setName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
    setEditing(true);
  };
  const saveProfile = () => {
    updateUser({ fullName: name.trim() || user?.fullName, email: email.trim() || user?.email });
    setEditing(false);
  };

  const onLogout = () => {
    confirmAction('Log out', 'Are you sure you want to log out?', () => {
      logout();
      router.replace('/(auth)/login');
    }, { confirmLabel: 'Log out' });
  };

  const onReset = () => {
    confirmAction('Reset demo data', 'This restores all sample trips and clears your changes.', () => resetToSeed(), { confirmLabel: 'Reset' });
  };

  const initials = (user?.fullName || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Pressable style={styles.editProfileBtn} onPress={openEdit}>
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={styles.editProfileText}>Edit profile</Text>
          </Pressable>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{trips.length}</Text>
              <Text style={styles.statLbl}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{currencyMeta(user?.homeCurrency || 'USD').flag}</Text>
              <Text style={styles.statLbl}>{user?.homeCurrency}</Text>
            </View>
          </View>
        </View>

        <Card padded={false} style={{ marginTop: spacing.lg }}>
          <Pressable style={styles.row} onPress={() => setPickingCurrency(!pickingCurrency)}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <Text style={styles.rowText}>Home currency</Text>
            <Text style={styles.rowValue}>{user?.homeCurrency}</Text>
            <Ionicons name={pickingCurrency ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textFaint} />
          </Pressable>
          {pickingCurrency && (
            <View style={styles.currencyGrid}>
              {CURRENCIES.map((c) => (
                <Pressable key={c.code} style={[styles.curChip, user?.homeCurrency === c.code && styles.curChipActive]} onPress={() => { setHomeCurrency(c.code); setPickingCurrency(false); }}>
                  <Text style={styles.curText}>{c.flag} {c.code}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.sep} />
          <Pressable style={styles.row} onPress={onReset}>
            <Ionicons name="refresh-outline" size={20} color={colors.warning} />
            <Text style={styles.rowText}>Reset demo data</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
        </Card>

        <Card padded={false} style={{ marginTop: spacing.md }}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            <Text style={styles.rowText}>About</Text>
            <Text style={styles.rowValue}>Wander · Prototype</Text>
          </View>
        </Card>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <Text style={styles.footer}>Mock-data prototype · no data leaves your device</Text>
      </ScrollView>

      {/* Edit profile sheet */}
      <Modal visible={editing} animationType="slide" transparent onRequestClose={() => setEditing(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Edit profile</Text>
          <Field label="Full name" icon="person-outline" placeholder="Your name" value={name} onChangeText={setName} />
          <Field label="Email" icon="mail-outline" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Button label="Save profile" onPress={saveProfile} disabled={!name.trim()} full style={{ marginTop: spacing.sm, marginBottom: spacing.xl }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  profileHeader: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  avatarText: { color: colors.white, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  name: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.md },
  email: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md, backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  editProfileText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.primary },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.border },
  statBox: { alignItems: 'center', minWidth: 64 },
  statNum: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  statLbl: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg },
  rowText: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  rowValue: { fontSize: font.size.sm, color: colors.textMuted, marginRight: 6 },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  curChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  curChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  curText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl, paddingVertical: spacing.md },
  logoutText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.danger },
  footer: { textAlign: 'center', fontSize: font.size.xs, color: colors.textFaint, marginTop: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  sheetTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md },
});
