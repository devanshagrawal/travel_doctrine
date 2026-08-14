import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrip } from '../../../../src/hooks/useTrips';
import { useTodos, useAddTodo, useSetTodoDone, useDeleteTodo } from '../../../../src/hooks/useTripData';
import { EmptyState } from '../../../../src/components/ui';
import { font, radius, spacing, Palette } from '../../../../src/theme';
import { useTheme } from '../../../../src/theme/useTheme';
import { confirmAction } from '../../../../src/lib/confirm';
import { TodoCategory } from '../../../../src/lib/types';

const CATS: { key: TodoCategory; label: string; icon: any; color: string; placeholder: string }[] = [
  { key: 'todo', label: 'To-do', icon: 'checkbox-outline', color: '#2563EB', placeholder: 'e.g. Book airport transfer' },
  { key: 'packing', label: 'Packing', icon: 'bag-check-outline', color: '#F97316', placeholder: 'e.g. Passport & charger' },
  { key: 'shopping', label: 'Shopping', icon: 'cart-outline', color: '#16A34A', placeholder: 'e.g. Souvenirs for family' },
  { key: 'notes', label: 'Keep in mind', icon: 'bulb-outline', color: '#9333EA', placeholder: 'e.g. Carry cash' },
];

export default function Todos() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: todos = [] } = useTodos(id);
  const addTodo = useAddTodo(id);
  const setTodoDone = useSetTodoDone(id);
  const deleteTodo = useDeleteTodo(id);

  const [active, setActive] = React.useState<TodoCategory>('todo');
  const [text, setText] = React.useState('');

  if (!trip) return null;
  const list = todos.filter((t) => t.tripId === trip.id);
  const done = list.filter((t) => t.done).length;

  const add = () => {
    if (!text.trim() || addTodo.isPending) return;
    addTodo.mutate({ tripId: trip.id, title: text.trim(), category: active });
    setText('');
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressHead}>
          <Text style={styles.progressText}>{done} of {list.length} done</Text>
          <Text style={styles.progressPct}>{list.length ? Math.round((done / list.length) * 100) : 0}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${list.length ? (done / list.length) * 100 : 0}%` }]} />
        </View>
      </View>

      {/* Category filter / target for new items */}
      <View style={styles.catRow}>
        {CATS.map((c) => {
          const on = active === c.key;
          return (
            <Pressable key={c.key} onPress={() => setActive(c.key)} style={[styles.catChip, on && { backgroundColor: c.color + '22', borderColor: c.color }]}>
              <Ionicons name={c.icon} size={13} color={c.color} />
              <Text style={[styles.catText, { color: on ? c.color : colors.textMuted }]} numberOfLines={1}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Add row */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder={CATS.find((c) => c.key === active)!.placeholder}
          placeholderTextColor={colors.textFaint}
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={add}>
          <Ionicons name="add" size={24} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {list.length === 0 ? (
          <EmptyState icon="checkbox-outline" title="Nothing on your list yet" subtitle="Add packing items, shopping, to-dos and things to keep in mind for this trip." />
        ) : (
          CATS.map((c) => {
            const items = list.filter((t) => t.category === c.key);
            if (items.length === 0) return null;
            return (
              <View key={c.key} style={{ marginBottom: spacing.lg }}>
                <View style={styles.sectionHead}>
                  <Ionicons name={c.icon} size={16} color={c.color} />
                  <Text style={styles.sectionTitle}>{c.label}</Text>
                  <Text style={styles.sectionCount}>{items.filter((i) => i.done).length}/{items.length}</Text>
                </View>
                {items.map((t) => (
                  <View key={t.id} style={styles.todoRow}>
                    <Pressable style={styles.checkArea} onPress={() => setTodoDone.mutate({ id: t.id, done: !t.done })}>
                      <View style={[styles.checkbox, t.done && { backgroundColor: c.color, borderColor: c.color }]}>
                        {t.done && <Ionicons name="checkmark" size={14} color={colors.white} />}
                      </View>
                      <Text style={[styles.todoText, t.done && styles.todoDone]}>{t.title}</Text>
                    </Pressable>
                    <Pressable hitSlop={8} onPress={() => confirmAction('Delete item', `Remove "${t.title}"?`, () => deleteTodo.mutate(t.id))}>
                      <Ionicons name="close" size={18} color={colors.textFaint} />
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  progressWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.medium },
  progressPct: { fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.bold },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catText: { fontSize: 12.5, fontWeight: font.weight.semibold, color: colors.textMuted },
  addRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  input: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, minHeight: 46, fontSize: font.size.md, color: colors.text },
  addBtn: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingTop: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, flex: 1 },
  sectionCount: { fontSize: font.size.xs, color: colors.textMuted, fontWeight: font.weight.semibold },
  todoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  checkArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  todoText: { flex: 1, fontSize: font.size.md, color: colors.text },
  todoDone: { textDecorationLine: 'line-through', color: colors.textFaint },
});
