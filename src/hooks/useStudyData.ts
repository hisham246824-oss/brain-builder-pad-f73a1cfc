import { useState, useEffect, useCallback } from 'react';
import { Material, Lesson, StudyFile, StudyData, MaterialIcon } from '@/types/study';

const STORAGE_KEY = 'study-data';

const defaultData: StudyData = {
  materials: [],
};

export function useStudyData() {
  const [data, setData] = useState<StudyData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old data to include new fields
        const migrated = {
          ...parsed,
          materials: parsed.materials.map((m: any) => ({
            ...m,
            icon: m.icon || 'book',
            files: m.files || [],
          })),
        };
        setData(migrated);
      } catch {
        setData(defaultData);
      }
    }
    setIsLoading(false);
  }, []);

  const saveData = useCallback((newData: StudyData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const addMaterial = useCallback((title: string, description?: string) => {
    const colors = [
      'hsl(175 60% 35%)',
      'hsl(220 70% 50%)',
      'hsl(280 60% 50%)',
      'hsl(340 70% 50%)',
      'hsl(30 80% 50%)',
      'hsl(145 60% 40%)',
    ];
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      title,
      description,
      color: colors[data.materials.length % colors.length],
      icon: 'book',
      lessons: [],
      files: [],
      createdAt: Date.now(),
    };
    saveData({ ...data, materials: [...data.materials, newMaterial] });
    return newMaterial;
  }, [data, saveData]);

  const updateMaterial = useCallback((id: string, updates: Partial<Material>) => {
    const materials = data.materials.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    saveData({ ...data, materials });
  }, [data, saveData]);

  const updateMaterialIcon = useCallback((id: string, icon: MaterialIcon) => {
    const materials = data.materials.map((m) =>
      m.id === id ? { ...m, icon } : m
    );
    saveData({ ...data, materials });
  }, [data, saveData]);

  const deleteMaterial = useCallback((id: string) => {
    const materials = data.materials.filter((m) => m.id !== id);
    saveData({ ...data, materials });
  }, [data, saveData]);

  const getMaterial = useCallback((id: string) => {
    return data.materials.find((m) => m.id === id);
  }, [data.materials]);

  const addLesson = useCallback((materialId: string, title: string) => {
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
    };
    const materials = data.materials.map((m) =>
      m.id === materialId
        ? { ...m, lessons: [...m.lessons, newLesson] }
        : m
    );
    saveData({ ...data, materials });
    return newLesson;
  }, [data, saveData]);

  const toggleLesson = useCallback((materialId: string, lessonId: string) => {
    const materials = data.materials.map((m) =>
      m.id === materialId
        ? {
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId ? { ...l, completed: !l.completed } : l
            ),
          }
        : m
    );
    saveData({ ...data, materials });
  }, [data, saveData]);

  const deleteLesson = useCallback((materialId: string, lessonId: string) => {
    const materials = data.materials.map((m) =>
      m.id === materialId
        ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
        : m
    );
    saveData({ ...data, materials });
  }, [data, saveData]);

  const addFile = useCallback((materialId: string, file: File, customName?: string) => {
    const getFileType = (fileName: string): StudyFile['type'] => {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (ext === 'pdf') return 'pdf';
      if (['doc', 'docx'].includes(ext)) return 'docx';
      if (['ppt', 'pptx'].includes(ext)) return 'pptx';
      if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
      if (ext === 'txt') return 'txt';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
      return 'other';
    };

    // Get file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const displayName = customName ? `${customName}.${ext}` : file.name;

    // Create a data URL for the file
    const reader = new FileReader();
    reader.onload = () => {
      const newFile: StudyFile = {
        id: crypto.randomUUID(),
        name: displayName,
        type: getFileType(file.name),
        url: reader.result as string,
        size: file.size,
        createdAt: Date.now(),
      };
      
      const materials = data.materials.map((m) =>
        m.id === materialId
          ? { ...m, files: [...m.files, newFile] }
          : m
      );
      saveData({ ...data, materials });
    };
    reader.readAsDataURL(file);
  }, [data, saveData]);

  const deleteFile = useCallback((materialId: string, fileId: string) => {
    const materials = data.materials.map((m) =>
      m.id === materialId
        ? { ...m, files: m.files.filter((f) => f.id !== fileId) }
        : m
    );
    saveData({ ...data, materials });
  }, [data, saveData]);

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
  };
}
