import { useState, useEffect, useCallback } from 'react';
import { Material, Lesson, StudyFile, StudyData, MaterialIcon } from '@/types/study';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEY = 'study-data';

const defaultData: StudyData = {
  materials: [],
};

export function useCloudStudyData() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<StudyData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMigrated, setHasMigrated] = useState(false);

  // Fetch data from cloud when user is logged in
  const fetchCloudData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch materials
      const { data: materials, error: materialsError } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (materialsError) throw materialsError;

      // Fetch lessons for all materials
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', user.id);

      if (lessonsError) throw lessonsError;

      // Fetch files for all materials
      const { data: files, error: filesError } = await supabase
        .from('material_files')
        .select('*')
        .eq('user_id', user.id);

      if (filesError) throw filesError;

      // Map to local format
      const mappedMaterials: Material[] = (materials || []).map((m) => ({
        id: m.id,
        title: m.title,
        icon: (m.icon as MaterialIcon) || 'book',
        color: getColorForIndex(materials?.indexOf(m) || 0),
        lessons: (lessons || [])
          .filter((l) => l.material_id === m.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            completed: l.completed,
            createdAt: new Date(l.created_at).getTime(),
          })),
        files: (files || [])
          .filter((f) => f.material_id === m.id)
          .map((f) => ({
            id: f.id,
            name: f.name,
            type: getFileType(f.name),
            url: f.file_url,
            size: f.file_size || 0,
            createdAt: new Date(f.created_at).getTime(),
          })),
        createdAt: new Date(m.created_at).getTime(),
      }));

      setData({ materials: mappedMaterials });
    } catch (error) {
      console.error('Error fetching cloud data:', error);
    }
  }, [user]);

  // Migrate local data to cloud when user signs in
  const migrateLocalData = useCallback(async () => {
    if (!user || hasMigrated) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setHasMigrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const localMaterials: Material[] = parsed.materials || [];

      if (localMaterials.length === 0) {
        setHasMigrated(true);
        return;
      }

      // Migrate each material
      for (const material of localMaterials) {
        // Insert material
        const { data: newMaterial, error: materialError } = await supabase
          .from('study_materials')
          .insert({
            title: material.title,
            icon: material.icon || 'book',
            user_id: user.id,
          })
          .select()
          .single();

        if (materialError) throw materialError;

        // Insert lessons
        if (material.lessons?.length > 0) {
          const { error: lessonsError } = await supabase
            .from('lessons')
            .insert(
              material.lessons.map((l) => ({
                title: l.title,
                completed: l.completed,
                material_id: newMaterial.id,
                user_id: user.id,
              }))
            );

          if (lessonsError) throw lessonsError;
        }

        // Insert files
        if (material.files?.length > 0) {
          const { error: filesError } = await supabase
            .from('material_files')
            .insert(
              material.files.map((f) => ({
                name: f.name,
                file_url: f.url,
                file_size: f.size,
                file_type: f.type,
                material_id: newMaterial.id,
                user_id: user.id,
              }))
            );

          if (filesError) throw filesError;
        }
      }

      // Clear local storage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      setHasMigrated(true);
      toast.success('Your study materials have been synced to your account!');
      
      // Refresh cloud data
      await fetchCloudData();
    } catch (error) {
      console.error('Error migrating local data:', error);
      toast.error('Failed to sync local data. Please try again.');
    }
  }, [user, hasMigrated, fetchCloudData]);

  // Load data based on auth state
  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      setIsLoading(true);

      if (user) {
        // User is logged in - migrate local data then fetch cloud data
        await migrateLocalData();
        await fetchCloudData();
      } else {
        // User is logged out - load from local storage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const migrated = {
              ...parsed,
              materials: (parsed.materials || []).map((m: Material) => ({
                ...m,
                icon: m.icon || 'book',
                files: m.files || [],
              })),
            };
            setData(migrated);
          } catch {
            setData(defaultData);
          }
        } else {
          setData(defaultData);
        }
        setHasMigrated(false);
      }

      setIsLoading(false);
    };

    loadData();
  }, [user, authLoading, migrateLocalData, fetchCloudData]);

  // Save to local storage (for non-authenticated users)
  const saveLocal = useCallback((newData: StudyData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  // Add material
  const addMaterial = useCallback(async (title: string, description?: string) => {
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      title,
      description,
      color: getColorForIndex(data.materials.length),
      icon: 'book',
      lessons: [],
      files: [],
      createdAt: Date.now(),
    };

    if (user) {
      try {
        const { data: created, error } = await supabase
          .from('study_materials')
          .insert({
            title,
            icon: 'book',
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        newMaterial.id = created.id;
        setData((prev) => ({ materials: [...prev.materials, newMaterial] }));
        return newMaterial;
      } catch (error) {
        console.error('Error adding material:', error);
        toast.error('Failed to add material');
        return newMaterial;
      }
    } else {
      saveLocal({ ...data, materials: [...data.materials, newMaterial] });
      return newMaterial;
    }
  }, [data, user, saveLocal]);

  // Update material
  const updateMaterial = useCallback(async (id: string, updates: Partial<Material>) => {
    const materials = data.materials.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    setData({ materials });

    if (user) {
      try {
        const { error } = await supabase
          .from('study_materials')
          .update({ title: updates.title, icon: updates.icon })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating material:', error);
      }
    } else {
      saveLocal({ materials });
    }
  }, [data, user, saveLocal]);

  // Update material icon
  const updateMaterialIcon = useCallback(async (id: string, icon: MaterialIcon) => {
    const materials = data.materials.map((m) =>
      m.id === id ? { ...m, icon } : m
    );
    setData({ materials });

    if (user) {
      try {
        const { error } = await supabase
          .from('study_materials')
          .update({ icon })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating material icon:', error);
      }
    } else {
      saveLocal({ materials });
    }
  }, [data, user, saveLocal]);

  // Delete material
  const deleteMaterial = useCallback(async (id: string) => {
    const materials = data.materials.filter((m) => m.id !== id);
    setData({ materials });

    if (user) {
      try {
        const { error } = await supabase
          .from('study_materials')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    } else {
      saveLocal({ materials });
    }
  }, [data, user, saveLocal]);

  // Get material
  const getMaterial = useCallback((id: string) => {
    return data.materials.find((m) => m.id === id);
  }, [data.materials]);

  // Add lesson
  const addLesson = useCallback(async (materialId: string, title: string) => {
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
    };

    if (user) {
      try {
        const { data: created, error } = await supabase
          .from('lessons')
          .insert({
            title,
            completed: false,
            material_id: materialId,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        newLesson.id = created.id;
      } catch (error) {
        console.error('Error adding lesson:', error);
      }
    }

    const materials = data.materials.map((m) =>
      m.id === materialId
        ? { ...m, lessons: [...m.lessons, newLesson] }
        : m
    );
    
    if (user) {
      setData({ materials });
    } else {
      saveLocal({ materials });
    }

    return newLesson;
  }, [data, user, saveLocal]);

  // Toggle lesson
  const toggleLesson = useCallback(async (materialId: string, lessonId: string) => {
    const material = data.materials.find((m) => m.id === materialId);
    const lesson = material?.lessons.find((l) => l.id === lessonId);
    const newCompleted = !lesson?.completed;

    const materials = data.materials.map((m) =>
      m.id === materialId
        ? {
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId ? { ...l, completed: newCompleted } : l
            ),
          }
        : m
    );

    if (user) {
      setData({ materials });
      try {
        const { error } = await supabase
          .from('lessons')
          .update({ completed: newCompleted })
          .eq('id', lessonId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error toggling lesson:', error);
      }
    } else {
      saveLocal({ materials });
    }
  }, [data, user, saveLocal]);

  // Delete lesson
  const deleteLesson = useCallback(async (materialId: string, lessonId: string) => {
    const materials = data.materials.map((m) =>
      m.id === materialId
        ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
        : m
    );

    if (user) {
      setData({ materials });
      try {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    } else {
      saveLocal({ materials });
    }
  }, [data, user, saveLocal]);

  // Add file
  const addFile = useCallback(async (materialId: string, file: File, customName?: string) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const displayName = customName ? `${customName}.${ext}` : file.name;

    const reader = new FileReader();
    reader.onload = async () => {
      const newFile: StudyFile = {
        id: crypto.randomUUID(),
        name: displayName,
        type: getFileType(file.name),
        url: reader.result as string,
        size: file.size,
        createdAt: Date.now(),
      };

      if (user) {
        try {
          const { data: created, error } = await supabase
            .from('material_files')
            .insert({
              name: displayName,
              file_url: reader.result as string,
              file_size: file.size,
              file_type: getFileType(file.name),
              material_id: materialId,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          newFile.id = created.id;
        } catch (error) {
          console.error('Error adding file:', error);
          toast.error('Failed to upload file');
          return;
        }
      }

      const materials = data.materials.map((m) =>
        m.id === materialId
          ? { ...m, files: [...m.files, newFile] }
          : m
      );

      if (user) {
        setData({ materials });
      } else {
        saveLocal({ materials });
      }
    };
    reader.readAsDataURL(file);
  }, [data, user, saveLocal]);

  // Delete file
  const deleteFile = useCallback(async (materialId: string, fileId: string) => {
    const materials = data.materials.map((m) =>
      m.id === materialId
        ? { ...m, files: m.files.filter((f) => f.id !== fileId) }
        : m
    );

    if (user) {
      setData({ materials });
      try {
        const { error } = await supabase
          .from('material_files')
          .delete()
          .eq('id', fileId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    } else {
      saveLocal({ materials });
    }
  }, [data, user, saveLocal]);

  // Clear local data (on logout)
  const clearLocalData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(defaultData);
    setHasMigrated(false);
  }, []);

  return {
    materials: data.materials,
    isLoading,
    addMaterial,
    updateMaterial,
    updateMaterialIcon,
    deleteMaterial,
    getMaterial,
    addLesson,
    toggleLesson,
    deleteLesson,
    addFile,
    deleteFile,
    clearLocalData,
    refreshData: fetchCloudData,
  };
}

// Helper functions
function getColorForIndex(index: number): string {
  const colors = [
    'hsl(175 60% 35%)',
    'hsl(220 70% 50%)',
    'hsl(280 60% 50%)',
    'hsl(340 70% 50%)',
    'hsl(30 80% 50%)',
    'hsl(145 60% 40%)',
  ];
  return colors[index % colors.length];
}

function getFileType(fileName: string): StudyFile['type'] {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  if (['ppt', 'pptx'].includes(ext)) return 'pptx';
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
  if (ext === 'txt') return 'txt';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  return 'other';
}
