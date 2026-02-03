import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatisticsPanel } from '@/components/admin/StatisticsPanel';
import { AccountsPanel } from '@/components/admin/AccountsPanel';
import { SuggestionsPanel } from '@/components/admin/SuggestionsPanel';
import { useAdminData } from '@/hooks/useAdminData';

type AdminTab = 'statistics' | 'accounts' | 'suggestions';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('statistics');
  const {
    users,
    stats,
    suggestions,
    isLoading,
    sendBroadcastMessage,
    deleteUser,
    promoteToAdmin,
    demoteFromAdmin,
    acceptSuggestion,
    rejectSuggestion,
  } = useAdminData();

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'statistics' && (
        <StatisticsPanel stats={stats} isLoading={isLoading} />
      )}
      
      {activeTab === 'accounts' && (
        <AccountsPanel
          users={users}
          isLoading={isLoading}
          onDeleteUser={deleteUser}
          onPromoteToAdmin={promoteToAdmin}
          onDemoteFromAdmin={demoteFromAdmin}
          onSendBroadcast={sendBroadcastMessage}
        />
      )}
      
      {activeTab === 'suggestions' && (
        <SuggestionsPanel
          suggestions={suggestions}
          isLoading={isLoading}
          onAccept={acceptSuggestion}
          onReject={rejectSuggestion}
        />
      )}
    </AdminLayout>
  );
}
