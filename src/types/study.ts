export interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  position?: number | null;
  notes?: string | null;
  createdAt?: number;
}

export interface StudyFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'txt' | 'image' | 'other';
  url: string;
  size: number;
  createdAt: number;
}

export type MaterialIcon = 'book' | 'calculator' | 'flask' | 'globe' | 'music' | 'code' | 'palette' | 'atom' | 'languages' | 'heart-pulse' | 'scale' | 'landmark' | 'microscope' | 'pen-tool' | 'cpu' | 'dumbbell' | 'telescope';

export interface Material {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon: MaterialIcon;
  lessons: Lesson[];
  files: StudyFile[];
  createdAt: number;
}

export interface StudyData {
  materials: Material[];
}
