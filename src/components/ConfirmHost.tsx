import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useConfirm } from '../store/useConfirm';
import { colors, font, radius, spacing } from '../theme';

// Rendered once at the app root. Shows a styled confirm dialog whenever
// confirmAction() is called. Works the same on web and native.
export function ConfirmHost() {
  const { open, title, message, confirmLabel, destructive, hide, accept } = useConfirm();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={hide}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, destructive ? styles.danger : styles.confirm]} onPress={accept}>
              <Text style={[styles.btnText, { color: destructive ? colors.danger : colors.white }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  title: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  message: { fontSize: font.size.md, color: colors.textMuted, marginTop: 8, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  btn: { flex: 1, minHeight: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.surfaceAlt },
  cancelText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  confirm: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.dangerSoft },
  btnText: { fontSize: font.size.md, fontWeight: font.weight.semibold },
});
