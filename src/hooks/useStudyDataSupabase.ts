import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/types/study';
import { toast } from '@/hooks/use-toast';

export interface MaterialWithRelations {
  id: string;
  title: string;
  icon: MaterialIcon;
  lessons: {
    id: string;
    title: string;
    completed: boolean;
    position: number | null;
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
  const [materials, setMaterials] = useState<MaterialWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLocalChange = useRef(false);

  const fetchMaterials = useCallback(async () => {
    if (!user) {
      setMaterials([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Fetch materials
    const { data: materialsData, error: materialsError } = await supabase
      .from('study_materials')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
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
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Subscribe to realtime changes for cross-device sync
  useEffect(() => {
    if (!user) return;

    const handleRealtimeChange = (tableName: string) => {
      if (isLocalChange.current) {
        isLocalChange.current = false;
        return;
      }
      fetchMaterials();
      toast({
        title: "Data synced",
        description: `Your ${tableName} updated from another device`,
      });
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

    // Optimistic update
    setMaterials(prev => prev.map(m => 
      m.id === materialId 
        ? { 
            ...m, 
            lessons: m.lessons.map(l => 
              l.id === lessonId ? { ...l, completed: !l.completed } : l
            ) 
          }
        : m
    ));

    const { error } = await supabase
      .from('lessons')
      .update({ completed: !lesson.completed })
      .eq('id', lessonId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling lesson:', error);
      fetchMaterials();
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
    getMaterial,
    refetch: fetchMaterials,
  };
}
