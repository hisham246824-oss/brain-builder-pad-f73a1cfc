import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, type AdminTab } from '@/components/admin/AdminLayout';
import { StatisticsPanel } from '@/components/admin/StatisticsPanel';
import { AccountsPanel } from '@/components/admin/AccountsPanel';
import { SuggestionsPanel } from '@/components/admin/SuggestionsPanel';
import { MessagesPanel } from '@/components/admin/MessagesPanel';
import { PollsPanel } from '@/components/admin/PollsPanel';
import { SupportPanel } from '@/components/admin/SupportPanel';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('statistics');
  const navigate = useNavigate();
  const { startImpersonation } = useAdminImpersonation();
  const {
    users, stats, messages, suggestions, polls, isLoading,
    sendBroadcastMessage, updateMessage, deleteMessage,
    createPoll, deletePoll, togglePollActive,
    deleteUser, promoteToAdmin, demoteFromAdmin,
    acceptSuggestion, rejectSuggestion, fetchUserActivity, refreshData,
    sendPrivateMessage, getPrivateMessages, updatePrivateMessage, deletePrivateMessage,
    blockUser, unblockUser,
  } = useAdminData();

  const handleImpersonateUser = useCallback(async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    await startImpersonation(userId, targetUser.display_name, targetUser.email);
    navigate('/');
  }, [users, startImpersonation, navigate]);

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} onRefresh={refreshData}>
      {activeTab === 'statistics' && <StatisticsPanel stats={stats} isLoading={isLoading} />}
      {activeTab === 'accounts' && (
        <AccountsPanel
          users={users} isLoading={isLoading}
          onDeleteUser={deleteUser} onPromoteToAdmin={promoteToAdmin}
          onDemoteFromAdmin={demoteFromAdmin} onSendBroadcast={sendBroadcastMessage}
          fetchUserActivity={fetchUserActivity}
          onBlockUser={blockUser} onUnblockUser={unblockUser}
          onSendPrivateMessage={sendPrivateMessage}
          onGetPrivateMessages={getPrivateMessages}
          onUpdatePrivateMessage={updatePrivateMessage}
          onDeletePrivateMessage={deletePrivateMessage}
          onImpersonateUser={handleImpersonateUser}
        />
      )}
      {activeTab === 'messages' && (
        <MessagesPanel
          messages={messages} isLoading={isLoading}
          onSendBroadcast={sendBroadcastMessage}
          onUpdateMessage={updateMessage} onDeleteMessage={deleteMessage}
        />
      )}
      {activeTab === 'polls' && (
        <PollsPanel
          polls={polls} isLoading={isLoading}
          onCreatePoll={createPoll} onDeletePoll={deletePoll}
          onTogglePoll={togglePollActive}
        />
      )}
      {activeTab === 'suggestions' && (
        <SuggestionsPanel
          suggestions={suggestions} isLoading={isLoading}
          onAccept={acceptSuggestion} onReject={rejectSuggestion}
        />
      )}
      {activeTab === 'support' && <SupportPanel />}
    </AdminLayout>
  );
}
