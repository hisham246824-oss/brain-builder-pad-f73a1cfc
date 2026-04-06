import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAIN_ADMIN_EMAIL = 'hisham090807@gmail.com';

export type AppRole = 'super_admin' | 'admin' | 'analyst' | 'executive_admin' | 'user' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMainAdmin, setIsMainAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsMainAdmin(false);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const [{ data, error }, { data: userData, error: userError }] = await Promise.all([
          supabase.rpc('get_user_role', { _user_id: user.id }),
          supabase.auth.getUser(),
        ]);

        if (error) {
          console.error('Error fetching role:', error);
          setRole('user');
        } else {
          setRole((data as AppRole) || 'user');
        }

        if (userError) {
          console.error('Error fetching user email:', userError);
          setIsMainAdmin(false);
        } else {
          setIsMainAdmin(userData.user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRole('user');
        setIsMainAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin' || role === 'super_admin' || role === 'analyst' || role === 'executive_admin';
  const isSuperAdmin = role === 'super_admin';
  const isAnalyst = role === 'analyst';
  const isExecutiveAdmin = role === 'executive_admin';
  const canModerateContent = isMainAdmin || role === 'super_admin' || role === 'admin';
  const canBlockUsers = isMainAdmin;
  const canDeleteUsers = isMainAdmin;
  const canManageRoles = isMainAdmin;
  const canViewSensitiveUserInfo = isMainAdmin || role === 'super_admin' || role === 'admin';

  return {
    role,
    isLoading,
    isAdmin,
    isSuperAdmin,
    isAnalyst,
    isExecutiveAdmin,
    isMainAdmin,
    canModerateContent,
    canBlockUsers,
    canDeleteUsers,
    canManageRoles,
    canViewSensitiveUserInfo,
  };
}
