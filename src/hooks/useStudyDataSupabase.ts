import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/types/study';
import { toast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cacheMaterials, getCachedMaterials, addPendingAction, getPendingActions, removePendingAction, setSyncStatus } from '@/lib/offlineCache';

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
  const cachedInit = !navigator.onLine ? getCachedMaterials() : null;
  const [materials, setMaterials] = useState<MaterialWithRelations[]>(cachedInit || []);
  const [isLoading, setIsLoading] = useState(cachedInit ? false : true);
  const isLocalChange = useRef(false);
  const hasSyncedPending = useRef(false);
  const hasLoadedOnce = useRef(cachedInit ? true : false);

  // Sync pending actions when coming back online
  const syncPendingActions = useCallback(async () => {
    if (!user || !isOnline || hasSyncedPending.current) return;
    
    const pendingActions = getPendingActions();
    const relevantActions = pendingActions.filter(a => 
      a.table === 'study_materials' || a.table === 'lessons'
    );
    if (relevantActions.length === 0) return;
    
    hasSyncedPending.current = true;
    setSyncStatus('syncing');
    
    for (const action of relevantActions) {
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
    
    setSyncStatus('synced');
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

    if (showLoading && !hasLoadedOnce.current) {
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
    cacheMaterials(materialsWithRelations);
    hasLoadedOnce.current = true;
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

    const handleRealtimeChange = () => {
      if (isLocalChange.current) {
        isLocalChange.current = false;
        return;
      }
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
        () => handleRealtimeChange()
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
        () => handleRealtimeChange()
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
        () => handleRealtimeChange()
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

    const optimisticMaterial: MaterialWithRelations = {
      id: crypto.randomUUID(),
      title,
      icon: 'book' as MaterialIcon,
      lessons: [],
      files: [],
    };

    // Optimistic update
    setMaterials(prev => {
      const updated = [...prev, optimisticMaterial];
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
      addPendingAction({
        type: 'add',
        table: 'study_materials',
        data: {
          user_id: user.id,
          title,
          icon: 'book',
          position: materials.length,
        },
      });
      return optimisticMaterial;
    }

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
      setMaterials(prev => prev.filter(m => m.id !== optimisticMaterial.id));
      return null;
    }

    isLocalChange.current = true;
    setMaterials(prev => {
      const updated = prev.map(m => m.id === optimisticMaterial.id 
        ? { ...data, icon: data.icon as MaterialIcon, lessons: [], files: [] } 
        : m);
      cacheMaterials(updated);
      return updated;
    });
    return data;
  }, [user, materials.length, isOnline]);

  const updateMaterialIcon = useCallback(async (id: string, icon: MaterialIcon) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, icon } : m);
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
      addPendingAction({
        type: 'update',
        table: 'study_materials',
        data: { id, updates: { icon } },
      });
      return;
    }

    const { error } = await supabase
      .from('study_materials')
      .update({ icon })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating icon:', error);
      fetchMaterials();
    }
  }, [user, isOnline, fetchMaterials]);

  const deleteMaterial = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => {
      const updated = prev.filter(m => m.id !== id);
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
      addPendingAction({
        type: 'delete',
        table: 'study_materials',
        data: { id },
      });
      return;
    }

    const { error } = await supabase
      .from('study_materials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting material:', error);
      fetchMaterials();
    }
  }, [user, isOnline, fetchMaterials]);

  const addLesson = useCallback(async (materialId: string, title: string) => {
    if (!user) return null;

    const material = materials.find(m => m.id === materialId);
    const position = material?.lessons.length || 0;

    const optimisticLesson = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      position,
      notes: null,
    };

    // Optimistic update
    setMaterials(prev => {
      const updated = prev.map(m => 
        m.id === materialId 
          ? { ...m, lessons: [...m.lessons, optimisticLesson] }
          : m
      );
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
      addPendingAction({
        type: 'add',
        table: 'lessons',
        data: {
          material_id: materialId,
          user_id: user.id,
          title,
          completed: false,
          position,
        },
      });
      return optimisticLesson;
    }

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
      // Revert
      setMaterials(prev => prev.map(m => 
        m.id === materialId 
          ? { ...m, lessons: m.lessons.filter(l => l.id !== optimisticLesson.id) }
          : m
      ));
      return null;
    }

    isLocalChange.current = true;
    setMaterials(prev => {
      const updated = prev.map(m => 
        m.id === materialId 
          ? { ...m, lessons: m.lessons.map(l => l.id === optimisticLesson.id ? data : l) }
          : m
      );
      cacheMaterials(updated);
      return updated;
    });

    return data;
  }, [user, materials, isOnline]);

  const toggleLesson = useCallback(async (materialId: string, lessonId: string) => {
    if (!user) return;

    const material = materials.find(m => m.id === materialId);
    const lesson = material?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const newCompleted = !lesson.completed;

    // Optimistic update with reordering
    setMaterials(prev => {
      const updated = prev.map(m => {
        if (m.id !== materialId) return m;
        
        const updatedLessons = m.lessons.map(l => 
          l.id === lessonId ? { ...l, completed: newCompleted } : l
        );
        
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
      });
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
      addPendingAction({
        type: 'update',
        table: 'lessons',
        data: { id: lessonId, updates: { completed: newCompleted } },
      });
      return;
    }

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
  }, [user, materials, isOnline, fetchMaterials]);

  const deleteLesson = useCallback(async (materialId: string, lessonId: string) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => {
      const updated = prev.map(m => 
        m.id === materialId 
          ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
          : m
      );
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
      addPendingAction({
        type: 'delete',
        table: 'lessons',
        data: { id: lessonId },
      });
      return;
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting lesson:', error);
      fetchMaterials();
    }
  }, [user, isOnline, fetchMaterials]);

  const updateLessonNotes = useCallback(async (materialId: string, lessonId: string, notes: string) => {
    if (!user) return;

    // Optimistic update
    setMaterials(prev => {
      const updated = prev.map(m => 
        m.id === materialId 
          ? { 
              ...m, 
              lessons: m.lessons.map(l => 
                l.id === lessonId ? { ...l, notes } : l
              ) 
            }
          : m
      );
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
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
    setMaterials(prev => {
      const updated = prev.map(m => {
        if (m.id !== materialId) return m;
        
        const reorderedLessons = lessonIds.map((id, index) => {
          const lesson = m.lessons.find(l => l.id === id);
          return lesson ? { ...lesson, position: index } : null;
        }).filter(Boolean) as typeof m.lessons;
        
        return { ...m, lessons: reorderedLessons };
      });
      cacheMaterials(updated);
      return updated;
    });

    if (!isOnline) {
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
