import { useState } from 'react';
import { AdminLayout, type AdminTab } from '@/components/admin/AdminLayout';
import { StatisticsPanel } from '@/components/admin/StatisticsPanel';
import { AccountsPanel } from '@/components/admin/AccountsPanel';
import { SuggestionsPanel } from '@/components/admin/SuggestionsPanel';
import { MessagesPanel } from '@/components/admin/MessagesPanel';
import { PollsPanel } from '@/components/admin/PollsPanel';
import { useAdminData } from '@/hooks/useAdminData';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('statistics');
  const {
    users, stats, messages, suggestions, polls, isLoading,
    sendBroadcastMessage, updateMessage, deleteMessage,
    createPoll, deletePoll, togglePollActive,
    deleteUser, promoteToAdmin, demoteFromAdmin,
    acceptSuggestion, rejectSuggestion, fetchUserActivity, refreshData,
    sendPrivateMessage, getPrivateMessages, updatePrivateMessage, deletePrivateMessage,
    blockUser, unblockUser,
  } = useAdminData();

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
    </AdminLayout>
  );
}
