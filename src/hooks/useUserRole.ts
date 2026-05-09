import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAIN_ADMIN_EMAIL = 'hisham090807@gmail.com';
const ROLE_CACHE = new Map<string, AppRole>();
const MAIN_ADMIN_CACHE = new Map<string, boolean>();
const ROLE_PROMISES = new Map<string, Promise<{ role: AppRole; isMainAdmin: boolean }>>();

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

    const cachedRole = ROLE_CACHE.get(user.id);
    const cachedMainAdmin = MAIN_ADMIN_CACHE.get(user.id);
    if (cachedRole !== undefined && cachedMainAdmin !== undefined) {
      setRole(cachedRole);
      setIsMainAdmin(cachedMainAdmin);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const existingPromise = ROLE_PROMISES.get(user.id);
        const request = existingPromise ?? Promise.all([
          supabase.rpc('get_user_role', { _user_id: user.id }),
          supabase.auth.getUser(),
        ]).then(([roleResult, userResult]) => {
          const resolvedRole = roleResult.error ? 'user' : ((roleResult.data as AppRole) || 'user');
          const resolvedMainAdmin = userResult.error ? false : userResult.data.user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL;
          ROLE_CACHE.set(user.id, resolvedRole);
          MAIN_ADMIN_CACHE.set(user.id, resolvedMainAdmin);
          return { role: resolvedRole, isMainAdmin: resolvedMainAdmin };
        }).finally(() => {
          ROLE_PROMISES.delete(user.id);
        });

        ROLE_PROMISES.set(user.id, request);
        const resolved = await request;

        setRole(resolved.role);
        setIsMainAdmin(resolved.isMainAdmin);
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
