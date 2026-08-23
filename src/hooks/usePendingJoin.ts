import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { redeemInvite } from '../repos/members';
import { tripKeys } from './useTrips';
import { keys } from './useTripData';
import { notify } from '../lib/confirm';

// After a signed-out invitee logs in, finish the join they started: redeem the
// stashed invite and drop them on the trip.
export function usePendingJoin(hasSession: boolean) {
  const router = useRouter();
  const qc = useQueryClient();
  const done = useRef(false);

  useEffect(() => {
    if (!hasSession || done.current) return;
    done.current = true;
    (async () => {
      const memberId = await AsyncStorage.getItem('pendingJoin');
      if (!memberId) return;
      await AsyncStorage.removeItem('pendingJoin');
      try {
        const tripId = await redeemInvite(memberId);
        qc.invalidateQueries({ queryKey: tripKeys.all });
        qc.invalidateQueries({ queryKey: keys.members(tripId) });
        router.replace(`/(app)/trip/${tripId}`);
      } catch (e: any) {
        notify('Could not join trip', e?.message ?? 'The invite link may be invalid.');
      }
    })();
  }, [hasSession]);
}
