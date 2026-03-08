import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ImpersonationTarget {
  userId: string;
  displayName: string | null;
  email: string;
}

interface AdminImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonationTarget | null;
  startImpersonation: (target: ImpersonationTarget) => void;
  stopImpersonation: () => void;
}

const AdminImpersonationContext = createContext<AdminImpersonationContextType | undefined>(undefined);

export function AdminImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonationTarget | null>(() => {
    const stored = sessionStorage.getItem('admin-impersonation');
    return stored ? JSON.parse(stored) : null;
  });

  const startImpersonation = useCallback((target: ImpersonationTarget) => {
    setImpersonatedUser(target);
    sessionStorage.setItem('admin-impersonation', JSON.stringify(target));
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUser(null);
    sessionStorage.removeItem('admin-impersonation');
  }, []);

  return (
    <AdminImpersonationContext.Provider value={{
      isImpersonating: !!impersonatedUser,
      impersonatedUser,
      startImpersonation,
      stopImpersonation,
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
