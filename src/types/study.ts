export interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface StudyFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'txt' | 'image' | 'other';
  url: string;
  size: number;
  createdAt: number;
}

export type MaterialIcon = 'book' | 'calculator' | 'flask' | 'globe' | 'music' | 'code' | 'palette';

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

// --- الإضافات الجديدة الخاصة بالمالك هشام ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user'; // (رتبة) تفرق بين المالك والمستخدمين
  is_verified: boolean;   // (موثق) لإظهار علامة الصح الزرقاء
  avatarUrl?: string;     // رابط الصورة الشخصية
}

export interface AppState {
  currentUser: User | null;
  studyData: StudyData;
}
