import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'super_admin' | 'admin' | 'user' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role')
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching role:', error);
          setRole('user');
        } else {
          setRole(data?.role as AppRole || 'user');
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  return { role, isLoading, isAdmin, isSuperAdmin };
}
