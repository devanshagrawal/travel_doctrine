import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrip } from '../../../../src/hooks/useTrips';
import { useMembers, useInviteMember, useRemoveMember } from '../../../../src/hooks/useTripData';
import { useTheme } from '../../../../src/theme/useTheme';
import { Avatar } from '../../../../src/components/Avatar';
import { Field, Button } from '../../../../src/components/ui';
import { notify, confirmAction } from '../../../../src/lib/confirm';
import { Palette, font, radius, spacing } from '../../../../src/theme';
import { Collaborator } from '../../../../src/lib/types';

export default function ShareTrip() {
  const { colors, fonts } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: collaborators = [] } = useMembers(id);
  const inviteMember = useInviteMember(id);
  const removeMember = useRemoveMember(id);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  if (!trip) return null;
  const crew = collaborators.filter((c) => c.tripId === trip.id);
  const owner = crew.find((c) => c.role === 'owner');
  const editors = crew.filter((c) => c.role !== 'owner');

  const validEmail = /.+@.+\..+/.test(email.trim());

  const invite = async () => {
    if (!validEmail || inviteMember.isPending) return;
    if (crew.some((c) => c.email.toLowerCase() === email.trim().toLowerCase())) {
      notify('Already on the trip', 'Someone with that email is already a collaborator.');
      return;
    }
    try {
      await inviteMember.mutateAsync({ name: name.trim(), email: email.trim() });
      setName('');
      setEmail('');
    } catch (e: any) {
      notify('Could not send invite', e?.message ?? 'Please try again.');
    }
  };

  const confirmRemove = (c: Collaborator) =>
    confirmAction('Remove collaborator', `Remove ${c.name} from "${trip.name}"?`, () => removeMember.mutate(c.id), { confirmLabel: 'Remove' });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { fontFamily: fonts.serif }]}>Trip crew</Text>
          <Text style={styles.heroSub}>Everyone you add can view and edit this trip — its itinerary, budget, expenses, documents and bookings.</Text>
        </View>

        {/* Invite */}
        <Text style={styles.label}>Invite by email</Text>
        <Field placeholder="name@example.com" icon="mail-outline" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Field placeholder="Name (optional)" icon="person-outline" value={name} onChangeText={setName} />
        <Button label={inviteMember.isPending ? 'Sending…' : 'Send invite'} icon="add" onPress={invite} disabled={!validEmail || inviteMember.isPending} full />

        <Pressable style={styles.linkRow} onPress={() => notify('Invite link copied', 'A shareable invite link has been copied to your clipboard (mock).')}>
          <Ionicons name="link-outline" size={18} color={colors.primary} />
          <Text style={styles.linkText}>Copy invite link</Text>
        </Pressable>

        {/* Crew list */}
        <Text style={[styles.label, { marginTop: spacing.xl }]}>On this trip · {crew.length}</Text>

        {owner && <CrewRow c={owner} canRemove={false} onRemove={() => {}} />}
        {editors.map((c) => (
          <CrewRow key={c.id} c={c} canRemove onRemove={() => confirmRemove(c)} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CrewRow({ c, canRemove, onRemove }: { c: Collaborator; canRemove: boolean; onRemove: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.crewRow}>
      <Avatar name={c.name} color={c.avatarColor} size={42} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.crewName}>{c.name}{c.isMe ? ' (you)' : ''}</Text>
        <Text style={styles.crewEmail} numberOfLines={1}>{c.email}</Text>
      </View>
      <View style={[styles.roleChip, { backgroundColor: c.role === 'owner' ? colors.accentSoft : colors.surfaceAlt }]}>
        <Text style={[styles.roleText, { color: c.role === 'owner' ? colors.accent : colors.textMuted }]}>{c.role === 'owner' ? 'Owner' : 'Editor'}</Text>
      </View>
      {canRemove && (
        <Pressable hitSlop={8} onPress={onRemove} style={{ marginLeft: 8 }}>
          <Ionicons name="close-circle" size={22} color={colors.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  scroll: { padding: spacing.lg },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.sm },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroTitle: { fontSize: 22, color: colors.text },
  heroSub: { fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: spacing.md },
  label: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted, marginBottom: 8, marginTop: spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
  linkText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.primary },
  crewRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  crewName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  crewEmail: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 1 },
  roleChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  roleText: { fontSize: font.size.xs, fontWeight: font.weight.bold },
});
