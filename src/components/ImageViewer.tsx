import React from 'react';
import { Modal, Pressable, View, Text, Image, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, spacing, Palette } from '../theme';
import { useTheme } from '../theme/useTheme';

function isPdf(uri?: string): boolean {
  if (!uri) return false;
  return /\.pdf($|\?)/i.test(uri) || uri.includes('application/pdf');
}

export function ImageViewer({ uri, title, onClose }: { uri?: string; title?: string; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const pdf = isPdf(uri);
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.white} />
          </Pressable>
        </View>
        <Pressable style={styles.imageWrap} onPress={onClose}>
          {!!uri && (pdf ? (
            <View style={styles.pdfWrap}>
              <Ionicons name="document-text" size={56} color="#EF4444" />
              <Text style={styles.pdfText}>PDF document</Text>
              <Pressable
                style={styles.openBtn}
                onPress={() => { if (uri) Linking.openURL(uri); }}
              >
                <Text style={styles.openBtnText}>Open in browser</Text>
              </Pressable>
            </View>
          ) : (
            <Image source={{ uri }} style={styles.image} resizeMode="contain" />
          ))}
        </Pressable>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: spacing.md },
  title: { flex: 1, color: colors.white, fontSize: font.size.md, fontWeight: font.weight.semibold },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  imageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  image: { width: '100%', height: '100%', borderRadius: radius.md },
  pdfWrap: { alignItems: 'center', gap: 12 },
  pdfText: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.semibold },
  openBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 },
  openBtnText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.semibold },
});
