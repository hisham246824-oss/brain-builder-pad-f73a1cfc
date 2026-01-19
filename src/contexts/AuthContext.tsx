import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Transfer local data to the database when user signs in
          await transferLocalDataToDatabase(session.user.id);
        }
        
        if (event === 'SIGNED_OUT') {
          // Clear local storage on logout
          localStorage.removeItem('study-data');
          localStorage.removeItem('table-data');
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const transferLocalDataToDatabase = async (userId: string) => {
    try {
      // Get local study materials data
      const localData = localStorage.getItem('study-data');
      if (!localData) return;

      const parsed = JSON.parse(localData);
      const materials = parsed.materials || [];

      if (materials.length === 0) return;

      // Check if user already has materials in the database
      const { data: existingMaterials } = await supabase
        .from('study_materials')
        .select('id')
        .eq('user_id', userId);

      // If user already has data, don't transfer (prevents duplicates)
      if (existingMaterials && existingMaterials.length > 0) {
        // Clear local data after confirming server has data
        localStorage.removeItem('study-data');
        return;
      }

      // Transfer each material to the database
      for (const material of materials) {
        const { data: newMaterial, error: materialError } = await supabase
          .from('study_materials')
          .insert({
            user_id: userId,
            title: material.title,
            icon: material.icon || 'book',
            position: 0,
          })
          .select()
          .single();

        if (materialError || !newMaterial) continue;

        // Transfer lessons
        if (material.lessons && material.lessons.length > 0) {
          const lessonsToInsert = material.lessons.map((lesson: any, index: number) => ({
            material_id: newMaterial.id,
            user_id: userId,
            title: lesson.title,
            completed: lesson.completed || false,
            position: index,
          }));

          await supabase.from('lessons').insert(lessonsToInsert);
        }

        // Transfer files
        if (material.files && material.files.length > 0) {
          const filesToInsert = material.files.map((file: any) => ({
            material_id: newMaterial.id,
            user_id: userId,
            name: file.name,
            file_url: file.url,
            file_type: file.type,
            file_size: file.size,
          }));

          await supabase.from('material_files').insert(filesToInsert);
        }
      }

      // Clear local data after successful transfer
      localStorage.removeItem('study-data');
    } catch (error) {
      console.error('Error transferring local data:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('study-data');
    localStorage.removeItem('table-data');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
