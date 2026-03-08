import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/types/study';
import { toast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cacheMaterials, getCachedMaterials, addPendingAction, getPendingActions, removePendingAction } from '@/lib/offlineCache';

export interface MaterialWithRelations {
  id: string;
  title: string;
  icon: MaterialIcon;
  lessons: {
    id: string;
    title: string;
    completed: boolean;
    position: number | null;
    notes: string | null;
  }[];
  files: {
    id: string;
    name: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
  }[];
}

export function useStudyDataSupabase() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [materials, setMaterials] = useState<MaterialWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLocalChange = useRef(false);
  const hasSyncedPending = useRef(false);

  // Sync pending actions when coming back online
  const syncPendingActions = useCallback(async () => {
    if (!user || !isOnline || hasSyncedPending.current) return;
    
    const pendingActions = getPendingActions();
    if (pendingActions.length === 0) return;
    
    hasSyncedPending.current = true;
    
    for (const action of pendingActions) {
      if (action.table !== 'study_materials' && action.table !== 'lessons') continue;
      
      try {
        if (action.type === 'add') {
          await supabase.from(action.table).insert(action.data);
        } else if (action.type === 'update') {
          await supabase.from(action.table).update(action.data.updates).eq('id', action.data.id);
        } else if (action.type === 'delete') {
          await supabase.from(action.table).delete().eq('id', action.data.id);
        }
        removePendingAction(action.id);
      } catch (error) {
        console.error('Error syncing pending action:', error);
      }
    }
    
    // Silent sync - no toast notification
  }, [user, isOnline]);

  useEffect(() => {
    if (isOnline) {
      hasSyncedPending.current = false;
      syncPendingActions();
    }
  }, [isOnline, syncPendingActions]);

  const fetchMaterials = useCallback(async (showLoading = true) => {
    if (!user) {
      setMaterials([]);
      setIsLoading(false);
      return;
    }

    // If offline, use cached data
    if (!isOnline) {
      const cached = getCachedMaterials();
      if (cached) {
        setMaterials(cached);
      }
      setIsLoading(false);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }

    // Fetch materials
    const { data: materialsData, error: materialsError } = await supabase
      .from('study_materials')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      // Fallback to cache on error
      const cached = getCachedMaterials();
      if (cached) {
        setMaterials(cached);
      }
      setIsLoading(false);
      return;
    }

    // Fetch all lessons and files for these materials
    const materialIds = materialsData?.map(m => m.id) || [];
    
    const [lessonsResult, filesResult] = await Promise.all([
      supabase
        .from('lessons')
        .select('*')
        .in('material_id', materialIds)
        .order('position', { ascending: true }),
      supabase
        .from('material_files')
        .select('*')
        .in('material_id', materialIds)
    ]);

    const lessonsMap = new Map<string, any[]>();
    const filesMap = new Map<string, any[]>();

    lessonsResult.data?.forEach(lesson => {
      const existing = lessonsMap.get(lesson.material_id) || [];
      lessonsMap.set(lesson.material_id, [...existing, lesson]);
    });

    filesResult.data?.forEach(file => {
      const existing = filesMap.get(file.material_id) || [];
      filesMap.set(file.material_id, [...existing, file]);
    });

    const materialsWithRelations: MaterialWithRelations[] = (materialsData || []).map(m => ({
      id: m.id,
      title: m.title,
      icon: (m.icon || 'book') as MaterialIcon,
      lessons: lessonsMap.get(m.id) || [],
      files: filesMap.get(m.id) || [],
    }));

    setMaterials(materialsWithRelations);
    // Cache for offline use
    cacheMaterials(materialsWithRelations);
    setIsLoading(false);
  }, [user, isOnline]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Background refetch on tab focus (stale-while-revalidate)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOnline && user) {
        fetchMaterials(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchMaterials, isOnline, user]);

  // Subscribe to realtime changes for cross-device sync
  useEffect(() => {
    if (!user) return;

    const handleRealtimeChange = (tableName: string) => {
      if (isLocalChange.current) {
        isLocalChange.current = false;
        return;
      }
      // Fetch without showing loading state for realtime updates - silent sync
      fetchMaterials(false);
    };

    const materialsChannel = supabase
      .channel('study-materials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_materials',
          filter: `user_id=eq.${user.id}`,
        },
        () => handleRealtimeChange('materials')
      )
      .subscribe();

    const lessonsChannel = supabase
      .channel('lessons-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `user_id=eq.${user.id}`,
        },
        () => handleRealtimeChange('lessons')
      )
      .subscribe();

    const filesChannel = supabase
      .channel('material-files-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'material_files',
          filter: `user_id=eq.${user.id}`,
        },
        () => handleRealtimeChange('files')
      )
      .subscribe();

    return () => {
      supabase.removeChannel(materialsChannel);
      supabase.removeChannel(lessonsChannel);
      supabase.removeChannel(filesChannel);
    };
  }, [user, fetchMaterials]);

  const addMaterial = useCallback(async (title: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('study_materials')
      .insert({
        user_id: user.id,
        title,
        icon: 'book',
        position: materials.length,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding material:', error);
      return null;
    }

    // Optimistic update
    setMaterials(prev => [...prev, { ...data, icon: data.icon as MaterialIcon, lessons: [], files: [] }]);
    return data;
  }, [user, materials.length]);

  const updateMaterialIcon = useCallback(async (id: string, icon: MaterialIcon) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, icon } : m));

    const { error } = await supabase
      .from('study_materials')
      .update({ icon })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating icon:', error);
      fetchMaterials();
    }
  }, [user, fetchMaterials]);

  const deleteMaterial = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => prev.filter(m => m.id !== id));

    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting material:', error);
      fetchMaterials();
    }
  }, [user, fetchMaterials]);

  const addLesson = useCallback(async (materialId: string, title: string) => {
    if (!user) return null;

    const material = materials.find(m => m.id === materialId);
    const position = material?.lessons.length || 0;

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        material_id: materialId,
        user_id: user.id,
        title,
        completed: false,
        position,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding lesson:', error);
      return null;
    }

    // Optimistic update
    setMaterials(prev => prev.map(m => 
      m.id === materialId 
        ? { ...m, lessons: [...m.lessons, data] }
        : m
    ));

    return data;
  }, [user, materials]);

  const toggleLesson = useCallback(async (materialId: string, lessonId: string) => {
    if (!user) return;

    const material = materials.find(m => m.id === materialId);
    const lesson = material?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const newCompleted = !lesson.completed;

    // Optimistic update with reordering
    setMaterials(prev => prev.map(m => {
      if (m.id !== materialId) return m;
      
      const updatedLessons = m.lessons.map(l => 
        l.id === lessonId ? { ...l, completed: newCompleted } : l
      );
      
      // Sort: incomplete lessons first, then completed
      const incompleteLessons = updatedLessons
        .filter(l => !l.completed)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const completedLessons = updatedLessons
        .filter(l => l.completed)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      
      const sortedLessons = [...incompleteLessons, ...completedLessons].map((l, idx) => ({
        ...l,
        position: idx,
      }));
      
      return { ...m, lessons: sortedLessons };
    }));

    // Update completion status in database
    const { error } = await supabase
      .from('lessons')
      .update({ completed: newCompleted })
      .eq('id', lessonId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling lesson:', error);
      fetchMaterials();
      return;
    }

    // Update positions in database
    const material2 = materials.find(m => m.id === materialId);
    if (material2) {
      const updatedLessons = material2.lessons.map(l => 
        l.id === lessonId ? { ...l, completed: newCompleted } : l
      );
      const incompleteLessons = updatedLessons.filter(l => !l.completed);
      const completedLessons = updatedLessons.filter(l => l.completed);
      const sortedLessons = [...incompleteLessons, ...completedLessons];
      
      const positionUpdates = sortedLessons.map((l, index) =>
        supabase
          .from('lessons')
          .update({ position: index })
          .eq('id', l.id)
          .eq('user_id', user.id)
      );
      
      try {
        await Promise.all(positionUpdates);
      } catch (posError) {
        console.error('Error updating positions:', posError);
      }
    }
  }, [user, materials, fetchMaterials]);

  const deleteLesson = useCallback(async (materialId: string, lessonId: string) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => prev.map(m => 
      m.id === materialId 
        ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
        : m
    ));

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting lesson:', error);
      fetchMaterials();
    }
  }, [user, fetchMaterials]);

  const updateLessonNotes = useCallback(async (materialId: string, lessonId: string, notes: string) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => prev.map(m => 
      m.id === materialId 
        ? { 
            ...m, 
            lessons: m.lessons.map(l => 
              l.id === lessonId ? { ...l, notes } : l
            ) 
          }
        : m
    ));

    if (!isOnline) {
      // Queue for later sync
      addPendingAction({
        type: 'update',
        table: 'lessons',
        data: { id: lessonId, updates: { notes } },
      });
      return;
    }

    const { error } = await supabase
      .from('lessons')
      .update({ notes })
      .eq('id', lessonId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating lesson notes:', error);
      fetchMaterials();
    }
  }, [user, isOnline, fetchMaterials]);

  const reorderLessons = useCallback(async (materialId: string, lessonIds: string[]) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => prev.map(m => {
      if (m.id !== materialId) return m;
      
      const reorderedLessons = lessonIds.map((id, index) => {
        const lesson = m.lessons.find(l => l.id === id);
        return lesson ? { ...lesson, position: index } : null;
      }).filter(Boolean) as typeof m.lessons;
      
      return { ...m, lessons: reorderedLessons };
    }));

    if (!isOnline) {
      // Queue for later sync
      lessonIds.forEach((id, index) => {
        addPendingAction({
          type: 'update',
          table: 'lessons',
          data: { id, updates: { position: index } },
        });
      });
      return;
    }

    // Update positions in database
    const updates = lessonIds.map((id, index) => 
      supabase
        .from('lessons')
        .update({ position: index })
        .eq('id', id)
        .eq('user_id', user.id)
    );

    try {
      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering lessons:', error);
      fetchMaterials();
    }
  }, [user, isOnline, fetchMaterials]);

  const getMaterial = useCallback((id: string) => {
    return materials.find(m => m.id === id);
  }, [materials]);

  return {
    materials,
    isLoading,
    addMaterial,
    updateMaterialIcon,
    deleteMaterial,
    addLesson,
    toggleLesson,
    deleteLesson,
    updateLessonNotes,
    reorderLessons,
    getMaterial,
    refetch: fetchMaterials,
  };
}
