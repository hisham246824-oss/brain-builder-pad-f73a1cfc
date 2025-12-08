export interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  color: string;
  lessons: Lesson[];
  createdAt: number;
}

export interface StudyData {
  materials: Material[];
}
