import { useState, useEffect, useCallback } from 'react';
import { Material, Lesson, StudyData } from '@/types/study';

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
        setData(JSON.parse(stored));
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
      lessons: [],
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

  return {
    materials: data.materials,
    isLoading,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterial,
    addLesson,
    toggleLesson,
    deleteLesson,
  };
}
