import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearOfflineCache } from '@/lib/offlineCache';

const AUTH_CACHE_KEY = 'studyhub-auth-cache';

interface CachedAuth {
  user: User;
  expiresAt: number; // timestamp
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isOfflineMode: boolean;
  isReadOnlyMode: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 30 days in ms
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function getCachedAuth(): CachedAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function setCachedAuth(user: User) {
  try {
    const cached: CachedAuth = {
      user,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cached));
  } catch { /* ignore */ }
}

function clearCachedAuth() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const hasRevalidated = useRef(false);

  // Try to restore from Supabase, fallback to local cache if offline
  useEffect(() => {
    // Set up auth listener FIRST (as per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsOfflineMode(false);
        setIsReadOnlyMode(false);

        if (session?.user) {
          setCachedAuth(session.user);
        }

        if (event === 'SIGNED_IN' && session?.user) {
          await transferLocalDataToDatabase(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('study-data');
          localStorage.removeItem('table-data');
          clearOfflineCache();
          clearCachedAuth();
        }

        setIsLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setCachedAuth(session.user);
      }
      setIsLoading(false);
    }).catch(() => {
      // Offline — try cached auth
      restoreFromCache();
    });

    // Listen for online/offline to handle revalidation
    const handleOnline = () => {
      if (!hasRevalidated.current) {
        revalidateSession();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const restoreFromCache = useCallback(() => {
    const cached = getCachedAuth();
    if (!cached) {
      setIsLoading(false);
      return;
    }

    const isExpired = Date.now() > cached.expiresAt;

    // Even if expired, restore user for read-only offline access
    setUser(cached.user);
    setIsOfflineMode(true);
    setIsReadOnlyMode(isExpired);
    setIsLoading(false);
  }, []);

  const revalidateSession = useCallback(async () => {
    hasRevalidated.current = true;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        // Try to refresh
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session) {
          setSession(refreshData.session);
          setUser(refreshData.session.user);
          setCachedAuth(refreshData.session.user);
          setIsOfflineMode(false);
          setIsReadOnlyMode(false);
        } else {
          // Token truly expired — keep read-only if we have cached user
          const cached = getCachedAuth();
          if (cached) {
            setIsReadOnlyMode(true);
          }
        }
      } else {
        setSession(session);
        setUser(session.user);
        setCachedAuth(session.user);
        setIsOfflineMode(false);
        setIsReadOnlyMode(false);
      }
    } catch {
      // Still offline, keep current state
    }
    hasRevalidated.current = false;
  }, []);

  const transferLocalDataToDatabase = async (userId: string) => {
    try {
      const localData = localStorage.getItem('study-data');
      if (!localData) return;

      const parsed = JSON.parse(localData);
      const materials = parsed.materials || [];
      if (materials.length === 0) return;

      const { data: existingMaterials } = await supabase
        .from('study_materials')
        .select('id')
        .eq('user_id', userId);

      if (existingMaterials && existingMaterials.length > 0) {
        localStorage.removeItem('study-data');
        return;
      }

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

      localStorage.removeItem('study-data');
    } catch (error) {
      console.error('Error transferring local data:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('study-data');
    localStorage.removeItem('table-data');
    clearOfflineCache();
    clearCachedAuth();
    setIsOfflineMode(false);
    setIsReadOnlyMode(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isOfflineMode, isReadOnlyMode, signUp, signIn, signOut }}>
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
