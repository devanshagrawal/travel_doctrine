import { supabase } from '../lib/supabase';
import { TodoItem, TodoCategory } from '../lib/types';

interface TodoRow {
  id: string;
  trip_id: string;
  title: string;
  category: TodoCategory;
  done: boolean;
}

function rowToTodo(r: TodoRow): TodoItem {
  return { id: r.id, tripId: r.trip_id, title: r.title, category: r.category, done: r.done };
}

export async function listTodos(tripId: string): Promise<TodoItem[]> {
  const { data, error } = await supabase.from('todos').select('*').eq('trip_id', tripId);
  if (error) throw error;
  return (data as TodoRow[]).map(rowToTodo);
}

export async function addTodo(input: Omit<TodoItem, 'id' | 'done'>): Promise<void> {
  const { error } = await supabase.from('todos').insert({
    trip_id: input.tripId,
    title: input.title,
    category: input.category,
  });
  if (error) throw error;
}

export async function setTodoDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('todos').update({ done }).eq('id', id);
  if (error) throw error;
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) throw error;
}
