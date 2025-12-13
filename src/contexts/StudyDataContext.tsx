import { createContext, useContext, ReactNode } from 'react';
import { useCloudStudyData } from '@/hooks/useCloudStudyData';
import { Material, Lesson, MaterialIcon } from '@/types/study';

interface StudyDataContextType {
  materials: Material[];
  isLoading: boolean;
  addMaterial: (title: string, description?: string) => Promise<Material>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>;
  updateMaterialIcon: (id: string, icon: MaterialIcon) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  getMaterial: (id: string) => Material | undefined;
  addLesson: (materialId: string, title: string) => Promise<Lesson>;
  toggleLesson: (materialId: string, lessonId: string) => Promise<void>;
  deleteLesson: (materialId: string, lessonId: string) => Promise<void>;
  addFile: (materialId: string, file: File, customName?: string) => Promise<void>;
  deleteFile: (materialId: string, fileId: string) => Promise<void>;
  clearLocalData: () => void;
  refreshData: () => Promise<void>;
  reorderMaterials: (oldIndex: number, newIndex: number) => Promise<void>;
  reorderLessons: (materialId: string, oldIndex: number, newIndex: number) => Promise<void>;
}

const StudyDataContext = createContext<StudyDataContextType | undefined>(undefined);

export function StudyDataProvider({ children }: { children: ReactNode }) {
  const studyData = useCloudStudyData();

  return (
    <StudyDataContext.Provider value={studyData}>
      {children}
    </StudyDataContext.Provider>
  );
}

export function useStudyData() {
  const context = useContext(StudyDataContext);
  if (context === undefined) {
    throw new Error('useStudyData must be used within a StudyDataProvider');
  }
  return context;
}
