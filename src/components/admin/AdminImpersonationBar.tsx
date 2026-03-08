import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { useNavigate } from 'react-router-dom';

export function AdminImpersonationBar() {
  const { isImpersonating, targetDisplayName, targetEmail, stopImpersonation, isLoading } = useAdminImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleReturn = async () => {
    await stopImpersonation();
    navigate('/admin');
  };

  return (
    <motion.div
      initial={{ y: -48 }}
      animate={{ y: 0 }}
      exit={{ y: -48 }}
      className="sticky top-0 z-[100] flex items-center justify-between gap-3 px-4 py-2.5"
      style={{ backgroundColor: 'hsl(45, 93%, 47%)', color: 'hsl(0, 0%, 10%)' }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Eye className="h-4 w-4" />
        <span>Viewing as: {targetDisplayName || targetEmail}</span>
        <span className="hidden sm:inline rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'hsla(0,0%,0%,0.15)' }}>
          ADMIN MODE
        </span>
      </div>
      <button
        onClick={handleReturn}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: 'hsla(0,0%,0%,0.2)' }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
        Return to Admin Panel
      </button>
    </motion.div>
  );
}
