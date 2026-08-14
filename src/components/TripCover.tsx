import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { LinearGradient as Scrim } from 'expo-linear-gradient';
import { font, radius } from '../theme';

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) + amt;
  let g = ((n >> 8) & 0xff) + amt;
  let b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// A colourful gradient banner with the trip emoji — stands in for a photo.
export function TripCover({
  color,
  emoji,
  image,
  height = 140,
  radiusTop = true,
  scrim = false,
  style,
  children,
}: {
  color: string;
  emoji?: string;
  image?: string;
  height?: number;
  radiusTop?: boolean;
  scrim?: boolean; // soft bottom-up dark gradient for overlaid text
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  // Unique gradient id per instance — otherwise multiple covers on one
  // screen (e.g. the trips list) all collide on the same SVG def and
  // render with the first trip's colour.
  const rawId = React.useId();
  const gradId = `cover-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[{ height, overflow: 'hidden', borderRadius: radiusTop ? radius.lg : 0 }, style]}>
      {image ? (
        <>
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* Dark scrim so overlaid white text stays readable on any photo. */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />
        </>
      ) : (
        <Svg width="100%" height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={shade(color, 35)} />
              <Stop offset="1" stopColor={shade(color, -35)} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={height} fill={`url(#${gradId})`} />
        </Svg>
      )}
      {scrim && (
        <Scrim
          colors={['transparent', 'rgba(12,8,3,0.15)', 'rgba(12,8,3,0.62)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {emoji && !image && <Text style={styles.emoji}>{emoji}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { position: 'absolute', right: 14, top: 10, fontSize: 46, opacity: 0.9 },
});
