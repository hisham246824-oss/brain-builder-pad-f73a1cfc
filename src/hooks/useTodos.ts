import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cacheTodos, getCachedTodos, addPendingAction, getPendingActions, removePendingAction, setSyncStatus } from '@/lib/offlineCache';
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
  const { isOnline } = useNetworkStatus();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasSyncedPending = useRef(false);

  // Sync pending todo actions
  const syncPendingActions = useCallback(async () => {
    if (!user || !isOnline || hasSyncedPending.current) return;
    const pendingActions = getPendingActions().filter(a => a.table === 'todos');
    if (pendingActions.length === 0) return;

    hasSyncedPending.current = true;
    setSyncStatus('syncing');

    for (const action of pendingActions) {
      try {
        if (action.type === 'add') {
          await supabase.from('todos').insert(action.data);
        } else if (action.type === 'update') {
          await supabase.from('todos').update(action.data.updates).eq('id', action.data.id);
        } else if (action.type === 'delete') {
          await supabase.from('todos').delete().eq('id', action.data.id);
        }
        removePendingAction(action.id);
      } catch (error) {
        console.error('Error syncing todo action:', error);
      }
    }

    toast.success('Your offline changes have been synced successfully!', { duration: 3000 });
    setSyncStatus('synced');
  }, [user, isOnline]);

  useEffect(() => {
    if (isOnline) {
      hasSyncedPending.current = false;
      syncPendingActions();
    }
  }, [isOnline, syncPendingActions]);

  const fetchTodos = useCallback(async () => {
    if (!user) { setTodos([]); setIsLoading(false); return; }

    if (!isOnline) {
      const cached = getCachedTodos();
      if (cached) setTodos(cached as Todo[]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos:', error);
      const cached = getCachedTodos();
      if (cached) setTodos(cached as Todo[]);
    } else {
      setTodos((data as Todo[]) || []);
      cacheTodos(data || []);
    }
    setIsLoading(false);
  }, [user, isOnline]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  // Realtime subscription for cross-device sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('todos-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchTodos();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTodos]);

  // Background refetch on tab focus (stale-while-revalidate)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOnline && user) {
        fetchTodos();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchTodos, isOnline, user]);

  const addTodo = useCallback(async (todo: { title: string; description?: string; importance: string; deadline?: string }) => {
    if (!user) return;

    const optimisticTodo: Todo = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: todo.title,
      description: todo.description || null,
      importance: todo.importance as 'red' | 'yellow' | 'green',
      deadline: todo.deadline || null,
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setTodos(prev => [optimisticTodo, ...prev]);

    if (!isOnline) {
      addPendingAction({
        type: 'add',
        table: 'todos',
        data: { user_id: user.id, title: todo.title, description: todo.description || null, importance: todo.importance, deadline: todo.deadline || null },
      });
      toast.success('Task saved locally — will sync when online');
      return;
    }

    const { error } = await supabase.from('todos').insert({
      user_id: user.id,
      title: todo.title,
      description: todo.description || null,
      importance: todo.importance,
      deadline: todo.deadline || null,
    });
    if (error) { toast.error('Failed to add task'); console.error(error); fetchTodos(); }
    else { toast.success('Task added!'); fetchTodos(); }
  }, [user, isOnline, fetchTodos]);

  const toggleComplete = useCallback(async (id: string, completed: boolean) => {
    if (!user) return;
    const updates: any = { completed, updated_at: new Date().toISOString() };
    if (completed) updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;

    // Optimistic
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (!isOnline) {
      addPendingAction({ type: 'update', table: 'todos', data: { id, updates } });
      return;
    }

    const { error } = await supabase.from('todos').update(updates).eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Failed to update task'); fetchTodos(); }
  }, [user, isOnline, fetchTodos]);

  const deleteTodo = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistic
    setTodos(prev => prev.filter(t => t.id !== id));

    if (!isOnline) {
      addPendingAction({ type: 'delete', table: 'todos', data: { id } });
      toast.success('Task removed locally');
      return;
    }

    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Failed to delete task'); fetchTodos(); }
    else toast.success('Task deleted');
  }, [user, isOnline, fetchTodos]);

  return { todos, isLoading, addTodo, toggleComplete, deleteTodo, fetchTodos };
}
