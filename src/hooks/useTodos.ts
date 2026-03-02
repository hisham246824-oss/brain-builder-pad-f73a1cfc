import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  importance: 'red' | 'yellow' | 'green';
  deadline: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    if (!user) { setTodos([]); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching todos:', error);
    else setTodos((data as Todo[]) || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const addTodo = useCallback(async (todo: { title: string; description?: string; importance: string; deadline?: string }) => {
    if (!user) return;
    const { error } = await supabase.from('todos').insert({
      user_id: user.id,
      title: todo.title,
      description: todo.description || null,
      importance: todo.importance,
      deadline: todo.deadline || null,
    });
    if (error) { toast.error('Failed to add task'); console.error(error); }
    else { toast.success('Task added!'); fetchTodos(); }
  }, [user, fetchTodos]);

  const toggleComplete = useCallback(async (id: string, completed: boolean) => {
    if (!user) return;
    const updates: any = { completed, updated_at: new Date().toISOString() };
    if (completed) updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;

    const { error } = await supabase.from('todos').update(updates).eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Failed to update task'); console.error(error); }
    else fetchTodos();
  }, [user, fetchTodos]);

  const deleteTodo = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Failed to delete task'); console.error(error); }
    else { toast.success('Task deleted'); fetchTodos(); }
  }, [user, fetchTodos]);

  return { todos, isLoading, addTodo, toggleComplete, deleteTodo, fetchTodos };
}
