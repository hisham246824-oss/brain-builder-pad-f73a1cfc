import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserCircle, Shield, ShieldAlert, Trash2, ChevronRight, 
  Send, MessageSquare, Crown, Activity, BookOpen, Languages, 
  Clock, Eye, Globe, ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface UserActivity {
  materials_count: number;
  lessons_count: number;
  vocabulary_count: number;
  suggestions_count: number;
  total_visits: number;
  total_duration: number;
  last_active: string | null;
  most_visited_page: string | null;
}

interface AccountsPanelProps {
  users: User[];
  isLoading: boolean;
  onDeleteUser: (userId: string) => Promise<boolean>;
  onPromoteToAdmin: (userId: string, password: string) => Promise<boolean>;
  onDemoteFromAdmin: (userId: string) => Promise<boolean>;
  onSendBroadcast: (title: string, content: string) => Promise<boolean>;
  fetchUserActivity: (userId: string) => Promise<UserActivity>;
}

const pageNameMap: Record<string, string> = {
  '/': 'Home', '/materials': 'Materials', '/vocabulary': 'Vocabulary',
  '/flashcards': 'Flashcards', '/pomodoro': 'Pomodoro', '/ai-chat': 'AI Chat',
  '/table-creator': 'Tables', '/messages': 'Messages', '/suggestions': 'Suggestions',
  '/settings': 'Settings',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function AccountsPanel({
  users, isLoading, onDeleteUser, onPromoteToAdmin, onDemoteFromAdmin, onSendBroadcast, fetchUserActivity,
}: AccountsPanelProps) {
  const { isSuperAdmin } = useUserRole();
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const filteredUsers = users.filter(u =>
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewActivity = useCallback(async (u: User) => {
    setViewingProfile(u);
    setActivityLoading(true);
    try {
      const activity = await fetchUserActivity(u.id);
      setUserActivity(activity);
    } catch { setUserActivity(null); }
    setActivityLoading(false);
  }, [fetchUserActivity]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !authUser) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from('admin_messages').insert({
        sender_id: authUser.id,
        title: messageTitle.trim() || `Message for ${selectedUser?.display_name || 'User'}`,
        content: messageContent.trim(),
      });
      if (error) throw error;
      toast.success('Message sent');
      setMessageDialogOpen(false);
      setMessageTitle('');
      setMessageContent('');
    } catch {
      toast.error('Failed to send message');
    }
    setIsSending(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await onDeleteUser(selectedUser.id);
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handlePromoteUser = async () => {
    if (!selectedUser || !adminPassword) return;
    const success = await onPromoteToAdmin(selectedUser.id, adminPassword);
    if (success) { setPromoteDialogOpen(false); setAdminPassword(''); }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'super_admin') return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-blue-500" />;
    return <UserCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getRoleBadge = (role: string) => {
    const colors = role === 'super_admin' ? 'bg-yellow-500/10 text-yellow-600' : role === 'admin' ? 'bg-blue-500/10 text-blue-600' : 'bg-secondary text-muted-foreground';
    const label = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User';
    return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', colors)}>{getRoleIcon(role)} {label}</span>;
  };

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />)}</div>;
  }

  // Full profile view
  if (viewingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setViewingProfile(null); setUserActivity(null); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">User Profile</h2>
        </div>

        {/* User header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                {viewingProfile.display_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{viewingProfile.display_name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">Joined {new Date(viewingProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="mt-2">{getRoleBadge(viewingProfile.role)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        {activityLoading ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />)}
          </div>
        ) : userActivity ? (
          <>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Materials', value: userActivity.materials_count, icon: BookOpen, color: 'text-blue-500' },
                { label: 'Vocabulary', value: userActivity.vocabulary_count, icon: Languages, color: 'text-purple-500' },
                { label: 'Page Visits', value: userActivity.total_visits, icon: Globe, color: 'text-green-500' },
                { label: 'Time Spent', value: formatDuration(userActivity.total_duration), icon: Clock, color: 'text-orange-500' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-xl bg-secondary p-2.5"><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Activity Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Lessons</span><span className="font-medium">{userActivity.lessons_count}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Suggestions</span><span className="font-medium">{userActivity.suggestions_count}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Active</span><span className="font-medium">{userActivity.last_active ? new Date(userActivity.last_active).toLocaleDateString() : 'Never'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Most Visited</span><span className="font-medium">{pageNameMap[userActivity.most_visited_page || ''] || userActivity.most_visited_page || 'N/A'}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setSelectedUser(viewingProfile); setMessageDialogOpen(true); }}>
                    <MessageSquare className="h-4 w-4" /> Send Private Message
                  </Button>
                  {isSuperAdmin && viewingProfile.role !== 'super_admin' && (
                    <>
                      {viewingProfile.role === 'admin' ? (
                        <Button variant="outline" className="w-full justify-start gap-2 text-orange-600" onClick={() => { onDemoteFromAdmin(viewingProfile.id); setViewingProfile(null); }}>
                          <ShieldAlert className="h-4 w-4" /> Remove Admin
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full justify-start gap-2 text-blue-600" onClick={() => { setSelectedUser(viewingProfile); setPromoteDialogOpen(true); }}>
                          <Shield className="h-4 w-4" /> Promote to Admin
                        </Button>
                      )}
                      <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => { setSelectedUser(viewingProfile); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4" /> Delete Account
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Account Management</h2>
        <p className="text-sm text-muted-foreground">{users.length} total users</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.map((u, index) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
            <Card 
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
              onClick={() => handleViewActivity(u)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                      {u.display_name?.charAt(0) || '?'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                      {getRoleIcon(u.role)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{u.display_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(u.created_at).toLocaleDateString()} • {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'User'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); handleViewActivity(u); }}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="rounded-xl bg-secondary/50 p-8 text-center">
            <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No results found</p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{selectedUser?.display_name || 'User'}" and all their data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
            <AlertDialogDescription>Enter your password to confirm promoting "{selectedUser?.display_name || 'User'}".</AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="password" placeholder="Your password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="mt-2" />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminPassword('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteUser} disabled={!adminPassword}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Title (optional)" value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} />
            <Textarea placeholder="Message content..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} className="min-h-[100px]" />
            <Button onClick={handleSendMessage} disabled={!messageContent.trim() || isSending} className="w-full gap-2">
              <Send className="h-4 w-4" />{isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
