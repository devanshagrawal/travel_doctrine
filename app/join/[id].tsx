import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth';
import { redeemInvite } from '../../src/repos/members';
import { tripKeys } from '../../src/hooks/useTrips';
import { keys } from '../../src/hooks/useTripData';
import { useTheme } from '../../src/theme/useTheme';

export default function JoinTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, loading } = useAuth();
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [stashed, setStashed] = React.useState(false);

  // Not signed in: remember the invite and send them to log in; the app picks
  // it back up after auth (see usePendingJoin).
  React.useEffect(() => {
    if (loading || session || !id) return;
    AsyncStorage.setItem('pendingJoin', id).finally(() => setStashed(true));
  }, [loading, session, id]);

  // Signed in: redeem right away.
  React.useEffect(() => {
    if (!session || !id) return;
    let active = true;
    redeemInvite(id)
      .then((tripId) => {
        if (!active) return;
        qc.invalidateQueries({ queryKey: tripKeys.all });
        qc.invalidateQueries({ queryKey: keys.members(tripId) });
        router.replace(`/(app)/trip/${tripId}`);
      })
      .catch((e) => active && setError(e?.message ?? 'Could not join this trip.'));
    return () => { active = false; };
  }, [session, id]);

  if (!loading && !session && stashed) return <Redirect href="/(auth)/login" />;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      {error ? (
        <>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.serif }]}>Couldn't join</Text>
          <Text style={[styles.msg, { color: colors.textMuted }]}>{error}</Text>
          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => router.replace('/(app)/(tabs)')}>
            <Text style={styles.btnText}>Go to my trips</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.msg, { color: colors.textMuted, marginTop: 16 }]}>Joining trip…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 22, marginTop: 12 },
  msg: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  btn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  btnText: { color: '#FCF7EE', fontWeight: '700', fontSize: 15 },
});
