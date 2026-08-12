import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { Button, Field, EmptyState, IconCircle, Pill } from './ui';
import { colors, font, radius, shadow, spacing } from '../theme';
import { DocumentType, TravelDocument } from '../lib/types';
import { fmtDate } from '../lib/format';
import { confirmAction } from '../lib/confirm';
import dayjs from 'dayjs';

const TYPE_META: Record<DocumentType, { icon: any; color: string; label: string }> = {
  passport: { icon: 'globe', color: '#2563EB', label: 'Passport' },
  id: { icon: 'card', color: '#16A34A', label: 'ID' },
  visa: { icon: 'document-text', color: '#9333EA', label: 'Visa' },
  insurance: { icon: 'shield-checkmark', color: '#F97316', label: 'Insurance' },
  other: { icon: 'document', color: '#64748B', label: 'Other' },
};

const TYPES: DocumentType[] = ['passport', 'id', 'visa', 'insurance', 'other'];

export function DocumentsView({ tripId }: { tripId: string | null }) {
  const documents = useStore((s) => s.documents);
  const addDocument = useStore((s) => s.addDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);

  const [adding, setAdding] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [number, setNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [type, setType] = React.useState<DocumentType>('passport');
  const [fileUri, setFileUri] = React.useState<string | undefined>(undefined);
  const [viewing, setViewing] = React.useState<TravelDocument | null>(null);

  const list = documents.filter((d) => d.tripId === tripId);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) setFileUri(res.assets[0].uri);
  };

  const reset = () => {
    setTitle(''); setNumber(''); setExpiry(''); setType('passport'); setFileUri(undefined); setAdding(false);
  };

  const save = () => {
    if (!title.trim()) return;
    addDocument({ tripId, type, title: title.trim(), number: number.trim() || undefined, expiryDate: expiry.trim() || undefined, fileUri });
    reset();
  };

  const confirmDelete = (d: TravelDocument) => {
    // Close the detail sheet first so the confirm dialog isn't hidden behind it.
    setViewing(null);
    confirmAction('Delete document', `Remove "${d.title}"?`, () => deleteDocument(d.id));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {list.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No documents yet" subtitle="Add your passport, ID or booking documents. Files stay on your device in this prototype." cta="Add document" onCta={() => setAdding(true)} />
        ) : (
          <>
            {list.map((d) => {
              const meta = TYPE_META[d.type];
              const expSoon = d.expiryDate && dayjs(d.expiryDate).diff(dayjs(), 'day') < 180;
              const expired = d.expiryDate && dayjs(d.expiryDate).isBefore(dayjs());
              return (
                <Pressable key={d.id} style={styles.docCard} onPress={() => setViewing(d)}>
                  {d.fileUri ? (
                    <Image source={{ uri: d.fileUri }} style={styles.thumb} />
                  ) : (
                    <IconCircle icon={meta.icon} color={meta.color} bg={meta.color + '18'} size={48} />
                  )}
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.docTitle}>{d.title}</Text>
                    {d.number && <Text style={styles.docSub}>{d.number}</Text>}
                    <View style={styles.docTags}>
                      <Pill label={meta.label} tone="neutral" />
                      {d.expiryDate && (
                        <Pill
                          label={expired ? 'Expired' : `Exp ${fmtDate(d.expiryDate, 'MMM YYYY')}`}
                          tone={expired ? 'danger' : expSoon ? 'warning' : 'success'}
                        />
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Pressable>
              );
            })}
            <Button label="Add document" icon="add" variant="secondary" onPress={() => setAdding(true)} full style={{ marginTop: spacing.sm }} />
          </>
        )}
      </ScrollView>

      {/* Add document sheet */}
      <Modal visible={adding} animationType="slide" transparent onRequestClose={reset}>
        <Pressable style={styles.backdrop} onPress={reset} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add document</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <Pressable key={t} onPress={() => setType(t)} style={[styles.typeChip, type === t && styles.typeChipActive]}>
                  <Ionicons name={TYPE_META[t].icon} size={15} color={type === t ? colors.white : colors.textMuted} />
                  <Text style={[styles.typeText, type === t && { color: colors.white }]}>{TYPE_META[t].label}</Text>
                </Pressable>
              ))}
            </View>

            <Field label="Title" placeholder="e.g. Passport" value={title} onChangeText={setTitle} />
            <Field label="Number (optional)" placeholder="Document number" value={number} onChangeText={setNumber} autoCapitalize="characters" />
            <Field label="Expiry date (optional)" placeholder="YYYY-MM-DD" value={expiry} onChangeText={setExpiry} autoCapitalize="none" />

            <Pressable style={styles.uploadBox} onPress={pickImage}>
              {fileUri ? (
                <Image source={{ uri: fileUri }} style={styles.uploadPreview} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={26} color={colors.primary} />
                  <Text style={styles.uploadText}>Upload a scan or photo</Text>
                </>
              )}
            </Pressable>

            <Button label="Save document" onPress={save} disabled={!title.trim()} full style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Document detail view */}
      <Modal visible={!!viewing} animationType="slide" transparent onRequestClose={() => setViewing(null)}>
        <Pressable style={styles.backdrop} onPress={() => setViewing(null)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {viewing && (
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
              <View style={styles.detailHead}>
                <IconCircle icon={TYPE_META[viewing.type].icon} color={TYPE_META[viewing.type].color} bg={TYPE_META[viewing.type].color + '18'} size={48} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.detailTitle}>{viewing.title}</Text>
                  <Pill label={TYPE_META[viewing.type].label} tone="neutral" />
                </View>
              </View>

              {viewing.fileUri ? (
                <Image source={{ uri: viewing.fileUri }} style={styles.detailImage} resizeMode="contain" />
              ) : (
                <View style={styles.noFile}>
                  <Ionicons name="document-outline" size={28} color={colors.textFaint} />
                  <Text style={styles.noFileText}>No file attached</Text>
                </View>
              )}

              <DetailRow label="Document number" value={viewing.number || '—'} />
              <DetailRow label="Expiry date" value={viewing.expiryDate ? fmtDate(viewing.expiryDate, 'MMM D, YYYY') : '—'} />
              <DetailRow label="Type" value={TYPE_META[viewing.type].label} />

              <Button label="Delete document" icon="trash-outline" variant="danger" onPress={() => confirmDelete(viewing)} full style={{ marginTop: spacing.lg }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  thumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  docTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  docSub: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 1 },
  docTags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  detailHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  detailTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text, marginBottom: 6 },
  detailImage: { width: '100%', height: 260, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, marginBottom: spacing.lg },
  noFile: { height: 120, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  noFileText: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: font.size.sm, color: colors.textMuted },
  detailValue: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, maxHeight: '86%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  sheetTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.md },
  label: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textMuted, marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  uploadBox: { height: 120, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  uploadPreview: { width: '100%', height: '100%' },
  uploadText: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 6 },
});
