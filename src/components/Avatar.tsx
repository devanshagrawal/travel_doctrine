import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Collaborator } from '../lib/types';

function initials(name: string) {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export function Avatar({ name, color, size = 32, ring }: { name: string; color: string; size?: number; ring?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}
    >
      <Text style={{ color: '#FCF7EE', fontSize: size * 0.38, fontWeight: '700' }}>{initials(name)}</Text>
    </View>
  );
}

// Overlapping row of collaborator avatars with a +N overflow chip.
export function AvatarStack({ people, size = 28, max = 4 }: { people: Collaborator[]; size?: number; max?: number }) {
  const { colors } = useTheme();
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
          <Avatar name={p.name} color={p.avatarColor} size={size} ring={colors.surface} />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.more,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.32, backgroundColor: colors.surfaceAlt, borderColor: colors.surface },
          ]}
        >
          <Text style={{ color: colors.textMuted, fontSize: size * 0.34, fontWeight: '700' }}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  more: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
