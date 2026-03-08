import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImpersonationState {
  isImpersonating: boolean;
  adminRefreshToken: string | null;
  adminAccessToken: string | null;
  targetDisplayName: string | null;
  targetEmail: string | null;
}

interface AdminImpersonationContextType {
  isImpersonating: boolean;
  targetDisplayName: string | null;
  targetEmail: string | null;
  startImpersonation: (userId: string, displayName: string | null, email: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  isLoading: boolean;
}

const AdminImpersonationContext = createContext<AdminImpersonationContextType | undefined>(undefined);

const STORAGE_KEY = 'admin-impersonation-state';

function getStoredState(): ImpersonationState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeState(state: ImpersonationState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearStoredState() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function AdminImpersonationProvider({ children }: { children: ReactNode }) {
  const storedState = getStoredState();
  const [isImpersonating, setIsImpersonating] = useState(storedState?.isImpersonating ?? false);
  const [targetDisplayName, setTargetDisplayName] = useState(storedState?.targetDisplayName ?? null);
  const [targetEmail, setTargetEmail] = useState(storedState?.targetEmail ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const startImpersonation = useCallback(async (userId: string, displayName: string | null, email: string) => {
    setIsLoading(true);
    try {
      // 1. Save current admin session
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession) {
        toast.error('No active admin session');
        setIsLoading(false);
        return;
      }

      // 2. Call edge function — it verifies the OTP server-side and returns session tokens
      let { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { targetUserId: userId },
      });

      // Retry with refreshed session if auth failed
      if (error || data?.error?.includes?.('authentication')) {
        await supabase.auth.refreshSession();
        const retry = await supabase.functions.invoke('admin-impersonate', {
          body: { targetUserId: userId },
        });
        data = retry.data;
        error = retry.error;
      }

      if (error || !data?.access_token || !data?.refresh_token) {
        toast.error(data?.error || error?.message || 'Failed to impersonate user');
        setIsLoading(false);
        return;
      }

      // 3. Store admin tokens for later restoration
      const state: ImpersonationState = {
        isImpersonating: true,
        adminRefreshToken: adminSession.refresh_token,
        adminAccessToken: adminSession.access_token,
        targetDisplayName: displayName,
        targetEmail: email,
      };
      storeState(state);

      // 4. Set the session directly using the tokens from the edge function
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        toast.error('Failed to sign in as user: ' + sessionError.message);
        clearStoredState();
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
        setIsLoading(false);
        return;
      }

      setIsImpersonating(true);
      setTargetDisplayName(displayName);
      setTargetEmail(email);
      toast.success(`Now viewing as ${displayName || email}`);
    } catch (err: any) {
      toast.error('Impersonation failed: ' + err.message);
      clearStoredState();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopImpersonation = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedState = getStoredState();
      if (!storedState?.adminRefreshToken || !storedState?.adminAccessToken) {
        toast.error('No admin session to restore');
        clearStoredState();
        setIsImpersonating(false);
        setIsLoading(false);
        return;
      }

      // Restore admin session
      const { error } = await supabase.auth.setSession({
        access_token: storedState.adminAccessToken,
        refresh_token: storedState.adminRefreshToken,
      });

      if (error) {
        const { error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: storedState.adminRefreshToken,
        });
        if (refreshError) {
          toast.error('Admin session expired. Please sign in again.');
          clearStoredState();
          setIsImpersonating(false);
          setIsLoading(false);
          return;
        }
      }

      clearStoredState();
      setIsImpersonating(false);
      setTargetDisplayName(null);
      setTargetEmail(null);
      toast.success('Returned to admin account');
    } catch (err: any) {
      toast.error('Failed to restore admin session: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AdminImpersonationContext.Provider value={{
      isImpersonating,
      targetDisplayName,
      targetEmail,
      startImpersonation,
      stopImpersonation,
      isLoading,
    }}>
      {children}
    </AdminImpersonationContext.Provider>
  );
}

export function useAdminImpersonation() {
  const context = useContext(AdminImpersonationContext);
  if (!context) {
    throw new Error('useAdminImpersonation must be used within AdminImpersonationProvider');
  }
  return context;
}
